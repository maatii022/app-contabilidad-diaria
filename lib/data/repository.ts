import 'server-only';

import { mockMonthlyBudgets, mockOpeningBalance, mockTransactions } from '@/lib/domain/mock-data';
import type { DashboardData, MonthlyBudget, Transaction, TransactionType } from '@/lib/domain/types';
import { getServerSupabase } from '@/lib/supabase/server';
import { buildDashboardData } from '@/lib/utils/finance';
import { DEFAULT_PERIOD, type Period } from '@/lib/utils/period';

type TransactionRow = {
  id: string;
  type: TransactionType;
  transaction_date: string;
  amount: number | string;
  description: string;
  category_name: string;
  source_system: 'google_sheets' | 'mock';
  source_file_id: string | null;
  source_file_name: string | null;
  source_sheet_name: string | null;
  source_row: number | null;
};

type MonthlyBudgetRow = {
  id: string;
  year: number;
  month: number;
  type: TransactionType;
  category_name: string;
  planned_amount: number | string;
};

type OpeningBalanceRow = {
  year: number;
  month: number;
  opening_balance: number | string;
};

export async function getDashboardData(period: Period = DEFAULT_PERIOD): Promise<DashboardData> {
  const transactions = await getTransactions(period);
  const budgets = await getMonthlyBudgets(period.year, period.month);
  const openingBalance = await getOpeningBalance(period.year, period.month);

  return buildDashboardData({
    year: period.year,
    month: period.month,
    openingBalance,
    transactions,
    budgets
  });
}

export async function getTransactions(period?: Period): Promise<Transaction[]> {
  const supabase = getServerSupabase();

  if (!supabase) {
    return filterTransactionsByPeriod(mockTransactions, period);
  }

  const query = supabase
    .from('transactions')
    .select('*')
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false });

  const { data, error } = period
    ? await query
        .gte('transaction_date', `${period.year}-${String(period.month).padStart(2, '0')}-01`)
        .lt('transaction_date', `${nextPeriod(period).year}-${String(nextPeriod(period).month).padStart(2, '0')}-01`)
    : await query;

  if (error || !data) {
    return filterTransactionsByPeriod(mockTransactions, period);
  }

  const rows = data as TransactionRow[];

  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    transactionDate: row.transaction_date,
    amount: Number(row.amount),
    description: row.description,
    categoryName: row.category_name,
    sourceSystem: row.source_system,
    sourceFileId: row.source_file_id ?? undefined,
    sourceFileName: row.source_file_name ?? undefined,
    sourceSheetName: row.source_sheet_name ?? undefined,
    sourceRow: row.source_row ?? undefined
  }));
}

export async function getMonthlyBudgets(year: number, month: number): Promise<MonthlyBudget[]> {
  const supabase = getServerSupabase();

  if (!supabase) {
    return mockMonthlyBudgets.filter((budget) => budget.year === year && budget.month === month);
  }

  const { data, error } = await supabase
    .from('monthly_budgets')
    .select('*')
    .eq('year', year)
    .eq('month', month)
    .order('type', { ascending: true })
    .order('category_name', { ascending: true });

  if (error || !data) {
    return mockMonthlyBudgets.filter((budget) => budget.year === year && budget.month === month);
  }

  const rows = data as MonthlyBudgetRow[];

  return rows.map((row) => ({
    id: row.id,
    year: row.year,
    month: row.month,
    type: row.type,
    categoryName: row.category_name,
    plannedAmount: Number(row.planned_amount)
  }));
}

export async function getOpeningBalance(year: number, month: number): Promise<number> {
  const supabase = getServerSupabase();

  if (!supabase) {
    return mockOpeningBalance;
  }

  const { data, error } = await supabase
    .from('monthly_opening_balances')
    .select('year, month, opening_balance')
    .eq('year', year)
    .eq('month', month)
    .maybeSingle();

  if (error || !data) {
    return mockOpeningBalance;
  }

  const row = data as OpeningBalanceRow;
  return Number(row.opening_balance);
}

function filterTransactionsByPeriod(transactions: Transaction[], period?: Period) {
  if (!period) {
    return transactions;
  }

  return transactions.filter((transaction) => {
    const date = new Date(`${transaction.transactionDate}T00:00:00`);
    return date.getFullYear() === period.year && date.getMonth() + 1 === period.month;
  });
}

function nextPeriod(period: Period): Period {
  return period.month === 12 ? { year: period.year + 1, month: 1 } : { year: period.year, month: period.month + 1 };
}
