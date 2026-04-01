import 'server-only';

import { mockMonthlyBudgets, mockOpeningBalance, mockTransactions } from '@/lib/domain/mock-data';
import type { DashboardData, MonthlyBudget, Transaction, TransactionType } from '@/lib/domain/types';
import { getServerSupabase } from '@/lib/supabase/server';
import { buildDashboardData } from '@/lib/utils/finance';

const DEFAULT_YEAR = 2026;
const DEFAULT_MONTH = 3;

type TransactionRow = {
  id: string;
  type: TransactionType;
  transaction_date: string;
  amount: number | string;
  description: string;
  category_name: string;
  source_system: 'google_sheets' | 'mock';
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

export async function getDashboardData(): Promise<DashboardData> {
  const transactions = await getTransactions();
  const budgets = await getMonthlyBudgets(DEFAULT_YEAR, DEFAULT_MONTH);

  return buildDashboardData({
    year: DEFAULT_YEAR,
    month: DEFAULT_MONTH,
    openingBalance: mockOpeningBalance,
    transactions,
    budgets
  });
}

export async function getTransactions(): Promise<Transaction[]> {
  const supabase = getServerSupabase();

  if (!supabase) {
    return mockTransactions;
  }

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error || !data) {
    return mockTransactions;
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
