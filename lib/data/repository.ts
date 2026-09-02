import 'server-only';

import { mockMonthlyBudgets, mockOpeningBalance, mockTransactions } from '@/lib/domain/mock-data';
import type { Account, AccountBalance, DashboardData, MonthlyBudget, Transaction, TransactionType } from '@/lib/domain/types';
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
  account_name: string | null;
  source_system: 'google_sheets' | 'mock';
  source_file_id: string | null;
  source_file_name: string | null;
  source_sheet_name: string | null;
  source_row: number | null;
};

type AccountRow = {
  id: string;
  name: string;
  sort_order: number | string | null;
  is_active: boolean | null;
  starting_balance: number | string | null;
  starting_year: number | string | null;
  starting_month: number | string | null;
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

export async function getDashboardData(
  period: Period = getCurrentPeriod(),
  accountName?: string
): Promise<DashboardData> {
  await ensurePeriodDataFresh(period);

  const budgets = await getMonthlyBudgets(period.year, period.month);

  if (accountName) {
    const account = (await getAccounts()).find((item) => item.name === accountName);
    const accountTransactions = await fetchTransactions(undefined, accountName);
    const openingBalance = computeAccountOpening(account, accountTransactions, period);

    return buildDashboardData({
      year: period.year,
      month: period.month,
      openingBalance,
      transactions: accountTransactions,
      budgets
    });
  }

  const transactions = await fetchTransactions(period);
  const openingBalance = await getOpeningBalance(period.year, period.month);

  return buildDashboardData({
    year: period.year,
    month: period.month,
    openingBalance,
    transactions,
    budgets
  });
}

export async function getBudgetPageData(period: Period = getCurrentPeriod(), accountName?: string) {
  await ensurePeriodDataFresh(period);

  const seededFromPrevious = await ensureBudgetSeededFromPrevious(period);
  const data = await getDashboardData(period, accountName);
  const budgets = await getMonthlyBudgets(period.year, period.month);

  return {
    data,
    budgets,
    seededFromPrevious,
    expenseCatalog: buildBudgetCatalog(budgets, 'expense'),
    incomeCatalog: buildBudgetCatalog(budgets, 'income')
  };
}

export async function getTransactions(period?: Period, accountName?: string): Promise<Transaction[]> {
  if (period) {
    await ensurePeriodDataFresh(period);
  }

  return fetchTransactions(period, accountName);
}

export async function getAccounts(): Promise<Account[]> {
  const supabase = getServerSupabase();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error || !data) {
    return [];
  }

  return (data as AccountRow[]).map(mapAccountRow);
}

export async function getAccountsWithBalances(period: Period = getCurrentPeriod()): Promise<AccountBalance[]> {
  const accounts = await getAccounts();

  if (accounts.length === 0) {
    return [];
  }

  const supabase = getServerSupabase();

  if (!supabase) {
    return accounts.map((account) => ({ ...account, balance: account.startingBalance }));
  }

  const endExclusive = `${nextPeriod(period).year}-${String(nextPeriod(period).month).padStart(2, '0')}-01`;

  const { data } = await supabase
    .from('transactions')
    .select('type, amount, transaction_date, account_name')
    .not('account_name', 'is', null)
    .lt('transaction_date', endExclusive);

  const rows = (data ?? []) as Array<Pick<TransactionRow, 'type' | 'amount' | 'transaction_date' | 'account_name'>>;

  return accounts.map((account) => {
    const net = rows.reduce((sum, row) => {
      if (row.account_name !== account.name || !isOnOrAfterStart(account, row.transaction_date)) {
        return sum;
      }
      const signed = row.type === 'income' ? Number(row.amount) : -Number(row.amount);
      return sum + (Number.isFinite(signed) ? signed : 0);
    }, 0);

    return { ...account, balance: account.startingBalance + net };
  });
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

  await writeBudgetValuesToGoogleSheets(
    period,
    previousBudgets.map((budget) => ({
      type: budget.type,
      categoryName: budget.categoryName,
      plannedAmount: budget.plannedAmount
    }))
  );

  const syncTimestamp = new Date().toISOString();

  const { error: deleteError } = await supabase
    .from('monthly_budgets')
    .delete()
    .eq('year', period.year)
    .eq('month', period.month);

  if (deleteError) {
    throw deleteError;
  }

  const { error: insertError } = await supabase.from('monthly_budgets').insert(
    previousBudgets.map((budget) => ({
      year: period.year,
      month: period.month,
      type: budget.type,
      category_name: budget.categoryName,
      planned_amount: budget.plannedAmount,
      updated_at: syncTimestamp
    }))
  );

  if (insertError) {
    throw insertError;
  }

  return true;
}

async function fetchTransactions(period?: Period, accountName?: string): Promise<Transaction[]> {
  const supabase = getServerSupabase();

  if (!supabase) {
    const scoped = accountName
      ? mockTransactions.filter((transaction) => transaction.accountName === accountName)
      : mockTransactions;
    return filterTransactionsByPeriod(scoped, period);
  }

  let query = supabase
    .from('transactions')
    .select('*')
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (accountName) {
    query = query.eq('account_name', accountName);
  }

  if (period) {
    query = query
      .gte('transaction_date', `${period.year}-${String(period.month).padStart(2, '0')}-01`)
      .lt('transaction_date', `${nextPeriod(period).year}-${String(nextPeriod(period).month).padStart(2, '0')}-01`);
  }

  const { data, error } = await query;

  if (error || !data) {
    const scoped = accountName
      ? mockTransactions.filter((transaction) => transaction.accountName === accountName)
      : mockTransactions;
    return filterTransactionsByPeriod(scoped, period);
  }

  const rows = data as TransactionRow[];

  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    transactionDate: row.transaction_date,
    amount: Number(row.amount),
    description: row.description,
    categoryName: row.category_name,
    accountName: row.account_name ?? undefined,
    sourceSystem: row.source_system,
    sourceFileId: row.source_file_id ?? undefined,
    sourceFileName: row.source_file_name ?? undefined,
    sourceSheetName: row.source_sheet_name ?? undefined,
    sourceRow: row.source_row ?? undefined
  }));
}

function mapAccountRow(row: AccountRow): Account {
  return {
    id: row.id,
    name: row.name,
    sortOrder: Number(row.sort_order ?? 0),
    isActive: row.is_active ?? true,
    startingBalance: Number(row.starting_balance ?? 0),
    startingYear: row.starting_year != null ? Number(row.starting_year) : null,
    startingMonth: row.starting_month != null ? Number(row.starting_month) : null
  };
}

function accountStartDate(account: Account | undefined): string | null {
  if (!account || account.startingYear == null || account.startingMonth == null) {
    return null;
  }
  return `${account.startingYear}-${String(account.startingMonth).padStart(2, '0')}-01`;
}

function isOnOrAfterStart(account: Account, date: string): boolean {
  const start = accountStartDate(account);
  return start ? date >= start : true;
}

function computeAccountOpening(account: Account | undefined, accountTransactions: Transaction[], period: Period): number {
  if (!account) {
    return 0;
  }

  const monthStart = `${period.year}-${String(period.month).padStart(2, '0')}-01`;
  const start = accountStartDate(account);

  const net = accountTransactions.reduce((sum, transaction) => {
    if (transaction.transactionDate >= monthStart) {
      return sum;
    }
    if (start && transaction.transactionDate < start) {
      return sum;
    }
    return sum + (transaction.type === 'income' ? transaction.amount : -transaction.amount);
  }, 0);

  return account.startingBalance + net;
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

function buildBudgetCatalog(budgets: MonthlyBudget[], type: TransactionType) {
  return [...new Set(budgets.filter((budget) => budget.type === type).map((budget) => budget.categoryName))];
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
