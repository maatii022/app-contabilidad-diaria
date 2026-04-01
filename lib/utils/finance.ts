import type {
  BudgetInsight,
  CategoryTotal,
  DashboardData,
  MonthlyBudget,
  Transaction,
  TransactionType,
  TrendPoint
} from '@/lib/domain/types';
import { formatMonthLabel, toIsoDate } from '@/lib/utils/dates';

export function buildDashboardData(input: {
  year: number;
  month: number;
  openingBalance: number;
  transactions: Transaction[];
  budgets: MonthlyBudget[];
}): DashboardData {
  const monthTransactions = input.transactions
    .filter((transaction) => {
      const date = new Date(`${transaction.transactionDate}T00:00:00`);
      return date.getFullYear() === input.year && date.getMonth() + 1 === input.month;
    })
    .sort((a, b) => (a.transactionDate < b.transactionDate ? -1 : 1));

  const totalIncome = sumByType(monthTransactions, 'income');
  const totalExpense = sumByType(monthTransactions, 'expense');
  const netAmount = totalIncome - totalExpense;
  const closingBalance = input.openingBalance + netAmount;
  const savingsRate = totalIncome === 0 ? 0 : netAmount / totalIncome;

  return {
    summary: {
      monthLabel: capitalize(formatMonthLabel(input.year, input.month)),
      periodStart: `${input.year}-${String(input.month).padStart(2, '0')}-01`,
      periodEnd: lastDayOfMonth(input.year, input.month),
      openingBalance: input.openingBalance,
      closingBalance,
      totalIncome,
      totalExpense,
      netAmount,
      savingsRate
    },
    trend: buildTrend(monthTransactions, input.openingBalance, input.year, input.month),
    expenseCategories: buildCategoryTotals(monthTransactions, 'expense'),
    incomeCategories: buildCategoryTotals(monthTransactions, 'income'),
    latestTransactions: [...monthTransactions].sort((a, b) => (a.transactionDate < b.transactionDate ? 1 : -1)).slice(0, 8),
    budgetInsights: buildBudgetInsights(input.budgets, monthTransactions)
  };
}

export function filterTransactions(
  transactions: Transaction[],
  options: {
    type?: TransactionType | 'all';
    category?: string;
    query?: string;
    date?: string;
  }
) {
  const normalizedQuery = options.query?.trim().toLowerCase();

  return transactions.filter((transaction) => {
    if (options.type && options.type !== 'all' && transaction.type !== options.type) {
      return false;
    }

    if (options.category && options.category !== 'all' && transaction.categoryName !== options.category) {
      return false;
    }

    if (options.date && transaction.transactionDate !== options.date) {
      return false;
    }

    if (normalizedQuery) {
      const haystack = `${transaction.description} ${transaction.categoryName}`.toLowerCase();
      if (!haystack.includes(normalizedQuery)) {
        return false;
      }
    }

    return true;
  });
}

function sumByType(transactions: Transaction[], type: TransactionType) {
  return transactions.filter((transaction) => transaction.type === type).reduce((sum, transaction) => sum + transaction.amount, 0);
}

function buildCategoryTotals(transactions: Transaction[], type: TransactionType): CategoryTotal[] {
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

function buildTrend(transactions: Transaction[], openingBalance: number, year: number, month: number): TrendPoint[] {
  const grouped = new Map<string, { income: number; expense: number }>();

  transactions.forEach((transaction) => {
    const current = grouped.get(transaction.transactionDate) ?? { income: 0, expense: 0 };
    if (transaction.type === 'income') {
      current.income += transaction.amount;
    } else {
      current.expense += transaction.amount;
    }
    grouped.set(transaction.transactionDate, current);
  });

  let runningBalance = openingBalance;
  const totalDays = new Date(year, month, 0).getDate();

  return Array.from({ length: totalDays }, (_, index) => {
    const date = toIsoDate(new Date(year, month - 1, index + 1));
    const values = grouped.get(date) ?? { income: 0, expense: 0 };
    const net = values.income - values.expense;
    runningBalance += net;

    return {
      date,
      income: values.income,
      expense: values.expense,
      net,
      runningBalance
    };
  });
}

function buildBudgetInsights(budgets: MonthlyBudget[], transactions: Transaction[]): BudgetInsight[] {
  const expenseBudgets = budgets.filter((budget) => budget.type === 'expense');

  return expenseBudgets
    .map((budget): BudgetInsight => {
      const actualAmount = transactions
        .filter((transaction) => transaction.type === 'expense' && transaction.categoryName === budget.categoryName)
        .reduce((sum, transaction) => sum + transaction.amount, 0);

      const remainingAmount = budget.plannedAmount - actualAmount;
      const usageRatio = budget.plannedAmount === 0 ? 0 : actualAmount / budget.plannedAmount;
      const status: BudgetInsight['status'] =
        actualAmount > budget.plannedAmount ? 'over' : actualAmount === budget.plannedAmount ? 'balanced' : 'under';

      return {
        categoryName: budget.categoryName,
        plannedAmount: budget.plannedAmount,
        actualAmount,
        remainingAmount,
        usageRatio,
        status
      };
    })
    .sort((a, b) => b.usageRatio - a.usageRatio);
}

function lastDayOfMonth(year: number, month: number) {
  return toIsoDate(new Date(year, month, 0));
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
