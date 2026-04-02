export const dynamic = 'force-dynamic';

import { AnalyticsScreen } from '@/components/analytics/analytics-screen';
import { AppShell } from '@/components/shell/app-shell';
import { getDashboardData, getOpeningBalance, getTransactions } from '@/lib/data/repository';
import type { AnnualAnalyticsData, CategoryTotal, Transaction } from '@/lib/domain/types';
import { resolvePeriod, shiftPeriod, type Period } from '@/lib/utils/period';

export default async function AnalisisPage({
  searchParams
}: {
  searchParams: Promise<{ year?: string; month?: string; view?: string }>;
}) {
  const params = await searchParams;
  const period = resolvePeriod(params);
  const previousPeriod = shiftPeriod(period, -1);
  const viewMode = params.view === 'annual' ? 'annual' : 'monthly';

  const [data, previousData, annualData] = await Promise.all([
    getDashboardData(period),
    getDashboardData(previousPeriod),
    getAnnualAnalyticsData(period)
  ]);

  return (
    <AppShell period={period}>
      <AnalyticsScreen period={period} viewMode={viewMode} data={data} previousData={previousData} annualData={annualData} />
    </AppShell>
  );
}

async function getAnnualAnalyticsData(period: Period): Promise<AnnualAnalyticsData> {
  const months = Array.from({ length: period.month }, (_, index) => index + 1);
  const monthDashboards = await Promise.all(months.map((month) => getDashboardData({ year: period.year, month })));
  const allTransactions = await getTransactions();
  const yearTransactions = allTransactions.filter((transaction) => {
    const date = new Date(`${transaction.transactionDate}T00:00:00`);
    return date.getFullYear() === period.year && date.getMonth() + 1 <= period.month;
  });

  const openingBalance = monthDashboards[0]?.summary.openingBalance ?? (await getOpeningBalance(period.year, 1));
  const totalIncome = sumByType(yearTransactions, 'income');
  const totalExpense = sumByType(yearTransactions, 'expense');
  const netAmount = totalIncome - totalExpense;
  const closingBalance = monthDashboards[monthDashboards.length - 1]?.summary.closingBalance ?? openingBalance + netAmount;

  return {
    year: period.year,
    throughMonth: period.month,
    openingBalance,
    closingBalance,
    totalIncome,
    totalExpense,
    netAmount,
    savingsRate: totalIncome === 0 ? 0 : netAmount / totalIncome,
    expenseCategories: buildCategoryTotals(yearTransactions, 'expense'),
    incomeCategories: buildCategoryTotals(yearTransactions, 'income'),
    topExpenseTransactions: yearTransactions.filter((item) => item.type === 'expense').sort((a, b) => b.amount - a.amount).slice(0, 4),
    topIncomeTransactions: yearTransactions.filter((item) => item.type === 'income').sort((a, b) => b.amount - a.amount).slice(0, 4),
    months: monthDashboards.map((dashboard, index) => ({
      month: index + 1,
      label: new Intl.DateTimeFormat('es-ES', { month: 'short' }).format(new Date(period.year, index, 1)).replace('.', '').toLowerCase(),
      closingBalance: dashboard.summary.closingBalance,
      netAmount: dashboard.summary.netAmount,
      income: dashboard.summary.totalIncome,
      expense: dashboard.summary.totalExpense
    }))
  };
}

function sumByType(transactions: Transaction[], type: 'expense' | 'income') {
  return transactions.filter((transaction) => transaction.type === type).reduce((sum, transaction) => sum + transaction.amount, 0);
}

function buildCategoryTotals(transactions: Transaction[], type: 'expense' | 'income'): CategoryTotal[] {
  const filtered = transactions.filter((transaction) => transaction.type === type);
  const total = filtered.reduce((sum, transaction) => sum + transaction.amount, 0);
  const grouped = new Map<string, number>();

  filtered.forEach((transaction) => {
    grouped.set(transaction.categoryName, (grouped.get(transaction.categoryName) ?? 0) + transaction.amount);
  });

  return [...grouped.entries()]
    .map(([categoryName, amount]) => ({
      categoryName,
      amount,
      percentage: total === 0 ? 0 : amount / total
    }))
    .sort((a, b) => b.amount - a.amount);
}
