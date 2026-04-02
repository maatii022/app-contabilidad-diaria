import 'server-only';

import { expenseCategories, incomeCategories } from '@/lib/domain/categories';
import { mockMonthlyBudgets, mockOpeningBalance, mockTransactions } from '@/lib/domain/mock-data';
import type { DashboardData, MonthlyBudget, Transaction, TransactionType } from '@/lib/domain/types';
import { getServerSupabase } from '@/lib/supabase/server';
import { syncPeriodFromGoogleSheets, writeBudgetValuesToGoogleSheets } from '@/lib/sync/google-sheets';
import { buildDashboardData } from '@/lib/utils/finance';
import { getCurrentPeriod, isCurrentPeriod, shiftPeriod, type Period } from '@/lib/utils/period';

const AUTO_SYNC_INTERVAL_MINUTES = 60;

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
  updated_at?: string;
};

export async function getDashboardData(period: Period = getCurrentPeriod()): Promise<DashboardData> {
  await ensurePeriodDataFresh(period);

  const transactions = await fetchTransactions(period);
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

export async function getBudgetPageData(period: Period = getCurrentPeriod()) {
  await ensurePeriodDataFresh(period);

  const seededFromPrevious = await ensureBudgetSeededFromPrevious(period);
  const data = await getDashboardData(period);
  const budgets = await getMonthlyBudgets(period.year, period.month);

  return {
    data,
    budgets,
    seededFromPrevious,
    expenseCatalog: expenseCategories.map((category) => category.name),
    incomeCatalog: incomeCategories.map((category) => category.name)
  };
}

export async function getTransactions(period?: Period): Promise<Transaction[]> {
  if (period) {
    await ensurePeriodDataFresh(period);
  }

  return fetchTransactions(period);
}

export async function getMonthlyBudgets(year: number, month: number): Promise<MonthlyBudget[]> {
  const supabase = getServerSupabase();

  if (!supabase) {
    return mockMonthlyBudgets.filter((budget) => budget.year === year && budget.month === month);
  }

  const rows = await fetchMonthlyBudgetRows(supabase, year, month);

  if (!rows) {
    return mockMonthlyBudgets.filter((budget) => budget.year === year && budget.month === month);
  }

  return mapMonthlyBudgetRows(rows);
}

export async function getOpeningBalance(year: number, month: number): Promise<number> {
  const supabase = getServerSupabase();

  if (!supabase) {
    return mockOpeningBalance;
  }

  const { data, error } = await supabase
    .from('monthly_opening_balances')
    .select('year, month, opening_balance, updated_at')
    .eq('year', year)
    .eq('month', month)
    .maybeSingle();

  if (error || !data) {
    return mockOpeningBalance;
  }

  const row = data as OpeningBalanceRow;
  return Number(row.opening_balance);
}

export async function ensurePeriodDataFresh(period: Period): Promise<void> {
  const supabase = getServerSupabase();

  if (!supabase || !isCurrentPeriod(period) || !process.env.APPS_SCRIPT_SYNC_URL || !process.env.APPS_SCRIPT_SYNC_TOKEN) {
    return;
  }

  const { data, error } = await supabase
    .from('monthly_opening_balances')
    .select('updated_at')
    .eq('year', period.year)
    .eq('month', period.month)
    .maybeSingle();

  if (error) {
    return;
  }

  const updatedAt = data?.updated_at ? new Date(data.updated_at) : null;
  const now = new Date();
  const isFresh = updatedAt ? now.getTime() - updatedAt.getTime() < AUTO_SYNC_INTERVAL_MINUTES * 60 * 1000 : false;

  if (!isFresh) {
    await syncPeriodFromGoogleSheets(period);
  }
}

async function ensureBudgetSeededFromPrevious(period: Period): Promise<boolean> {
  const supabase = getServerSupabase();

  if (!supabase || !process.env.APPS_SCRIPT_SYNC_URL || !process.env.APPS_SCRIPT_SYNC_TOKEN) {
    return false;
  }

  const currentRows = await fetchMonthlyBudgetRows(supabase, period.year, period.month);

  if (currentRows && currentRows.length > 0 && currentRows.some((row) => Number(row.planned_amount) > 0)) {
    return false;
  }

  const previous = shiftPeriod(period, -1);
  let previousRows = await fetchMonthlyBudgetRows(supabase, previous.year, previous.month);

  if (!previousRows || previousRows.length === 0) {
    await syncPeriodFromGoogleSheets(previous);
    previousRows = await fetchMonthlyBudgetRows(supabase, previous.year, previous.month);
  }

  if (!previousRows || previousRows.length === 0) {
    return false;
  }

  const previousBudgets = mapMonthlyBudgetRows(previousRows).filter((budget) => budget.plannedAmount > 0);

  if (previousBudgets.length === 0) {
    return false;
  }

  await writeBudgetValuesToGoogleSheets(period, previousBudgets.map((budget) => ({
    type: budget.type,
    categoryName: budget.categoryName,
    plannedAmount: budget.plannedAmount
  })));

  const syncTimestamp = new Date().toISOString();

  const { error } = await supabase.from('monthly_budgets').upsert(
    previousBudgets.map((budget) => ({
      year: period.year,
      month: period.month,
      type: budget.type,
      category_name: budget.categoryName,
      planned_amount: budget.plannedAmount,
      updated_at: syncTimestamp
    })),
    {
      onConflict: 'year,month,type,category_name'
    }
  );

  if (error) {
    throw error;
  }

  return true;
}

async function fetchTransactions(period?: Period): Promise<Transaction[]> {
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

async function fetchMonthlyBudgetRows(
  supabase: NonNullable<ReturnType<typeof getServerSupabase>>,
  year: number,
  month: number
): Promise<MonthlyBudgetRow[] | null> {
  const { data, error } = await supabase
    .from('monthly_budgets')
    .select('*')
    .eq('year', year)
    .eq('month', month)
    .order('type', { ascending: true })
    .order('category_name', { ascending: true });

  if (error || !data) {
    return null;
  }

  return data as MonthlyBudgetRow[];
}

function mapMonthlyBudgetRows(rows: MonthlyBudgetRow[]): MonthlyBudget[] {
  return rows.map((row) => ({
    id: row.id,
    year: row.year,
    month: row.month,
    type: row.type,
    categoryName: row.category_name,
    plannedAmount: Number(row.planned_amount)
  }));
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
