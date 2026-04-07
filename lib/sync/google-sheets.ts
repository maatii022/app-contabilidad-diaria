import 'server-only';

import type { GoogleSheetsSyncPayload, GoogleSheetsSyncResult, TransactionType } from '@/lib/domain/types';
import { getServerSupabase } from '@/lib/supabase/server';
import type { Period } from '@/lib/utils/period';

const APPS_SCRIPT_SYNC_URL = process.env.APPS_SCRIPT_SYNC_URL;
const APPS_SCRIPT_SYNC_TOKEN = process.env.APPS_SCRIPT_SYNC_TOKEN;

type BudgetWriteInput = {
  type: TransactionType;
  categoryName: string;
  plannedAmount: number;
};

export async function syncPeriodFromGoogleSheets(period: Period): Promise<GoogleSheetsSyncResult> {
  const supabase = getServerSupabase();

  if (!supabase) {
    throw new Error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno.');
  }

  if (!APPS_SCRIPT_SYNC_URL || !APPS_SCRIPT_SYNC_TOKEN) {
    throw new Error('Faltan APPS_SCRIPT_SYNC_URL o APPS_SCRIPT_SYNC_TOKEN en el entorno.');
  }

  const syncRunInsert = await supabase
    .from('sync_runs')
    .insert({
      source: 'google_sheets',
      status: 'running',
      message: `Sincronizando ${period.year}-${String(period.month).padStart(2, '0')}`
    })
    .select('id')
    .single();

  const syncRunId = syncRunInsert.data?.id ?? null;

  try {
    const payload = await fetchMonthPayload(period);
    const syncTimestamp = new Date().toISOString();

    const txRows = payload.transactions.map((transaction) => ({
      source_system: 'google_sheets',
      source_file_id: payload.fileId,
      source_file_name: payload.fileName,
      source_sheet_name: payload.sheetName,
      source_row: transaction.sourceRow,
      type: transaction.type,
      transaction_date: transaction.transactionDate,
      amount: parseImportedAmount(transaction.amount),
      description: transaction.description,
      category_name: transaction.categoryName,
      last_synced_at: syncTimestamp,
      updated_at: syncTimestamp
    }));

    const budgetRows = payload.budgets.map((budget) => ({
      year: payload.year,
      month: payload.month,
      type: budget.type,
      category_name: budget.categoryName,
      planned_amount: parseImportedAmount(budget.plannedAmount),
      updated_at: syncTimestamp
    }));

    if (txRows.length > 0) {
      const { error } = await supabase.from('transactions').upsert(txRows, {
        onConflict: 'source_file_name,source_sheet_name,source_row,type'
      });

      if (error) {
        throw error;
      }
    }

    const { error: deleteBudgetsError } = await supabase
      .from('monthly_budgets')
      .delete()
      .eq('year', payload.year)
      .eq('month', payload.month);

    if (deleteBudgetsError) {
      throw deleteBudgetsError;
    }

    if (budgetRows.length > 0) {
      const { error: insertBudgetsError } = await supabase.from('monthly_budgets').insert(budgetRows);

      if (insertBudgetsError) {
        throw insertBudgetsError;
      }
    }

    const { error: openingBalanceError } = await supabase.from('monthly_opening_balances').upsert(
      {
        year: payload.year,
        month: payload.month,
        opening_balance: parseImportedAmount(payload.openingBalance),
        source_file_id: payload.fileId,
        source_file_name: payload.fileName,
        updated_at: syncTimestamp
      },
      {
        onConflict: 'year,month'
      }
    );

    if (openingBalanceError) {
      throw openingBalanceError;
    }

    if (syncRunId) {
      await finishSyncRun(supabase, syncRunId, 'success', `Archivo ${payload.fileName} sincronizado`, txRows.length + budgetRows.length + 1);
    }

    return {
      period: {
        year: payload.year,
        month: payload.month
      },
      fileName: payload.fileName,
      transactionsUpserted: txRows.length,
      budgetsUpserted: budgetRows.length,
      openingBalanceUpserted: true
    };
  } catch (error) {
    if (syncRunId) {
      await finishSyncRun(
        supabase,
        syncRunId,
        'error',
        error instanceof Error ? error.message : 'Error desconocido en la sincronización',
        0
      );
    }

    throw error;
  }
}

export async function syncPeriodRangeFromGoogleSheets(range: { start: Period; end: Period }) {
  const periods = buildPeriodRange(range.start, range.end);
  const results: GoogleSheetsSyncResult[] = [];

  for (const period of periods) {
    results.push(await syncPeriodFromGoogleSheets(period));
  }

  return results;
}

export async function writeBudgetValuesToGoogleSheets(
  period: Period,
  budgets: BudgetWriteInput[],
  options?: { updateTemplate?: boolean }
) {
  if (!APPS_SCRIPT_SYNC_URL || !APPS_SCRIPT_SYNC_TOKEN) {
    throw new Error('Faltan APPS_SCRIPT_SYNC_URL o APPS_SCRIPT_SYNC_TOKEN en el entorno.');
  }

  const response = await fetch(APPS_SCRIPT_SYNC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    cache: 'no-store',
    body: JSON.stringify({
      token: APPS_SCRIPT_SYNC_TOKEN,
      action: 'set_budgets',
      year: period.year,
      month: period.month,
      updateTemplate: Boolean(options?.updateTemplate),
      budgets: budgets.map((budget) => ({
        type: budget.type,
        categoryName: budget.categoryName,
        plannedAmount: budget.plannedAmount
      }))
    })
  });

  if (!response.ok) {
    throw new Error(`Apps Script respondió con estado ${response.status}`);
  }

  const payload = (await response.json()) as { ok: boolean; error?: string; updated?: number; fileName?: string };

  if (!payload.ok) {
    throw new Error(payload.error || 'No se pudo escribir el presupuesto en Google Sheets.');
  }

  return payload;
}

async function fetchMonthPayload(period: Period): Promise<GoogleSheetsSyncPayload> {
  const url = new URL(APPS_SCRIPT_SYNC_URL!);
  url.searchParams.set('token', APPS_SCRIPT_SYNC_TOKEN!);
  url.searchParams.set('year', String(period.year));
  url.searchParams.set('month', String(period.month));

  const response = await fetch(url.toString(), {
    method: 'GET',
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(`Apps Script respondió con estado ${response.status}`);
  }

  const payload = (await response.json()) as GoogleSheetsSyncPayload & { error?: string };

  if (!payload.ok) {
    throw new Error(payload.error || 'La exportación desde Google Sheets devolvió un error.');
  }

  return {
    ...payload,
    openingBalance: parseImportedAmount(payload.openingBalance),
    transactions: payload.transactions.map((transaction) => ({
      ...transaction,
      type: normalizeTransactionType(transaction.type),
      amount: parseImportedAmount(transaction.amount)
    })),
    budgets: payload.budgets.map((budget) => ({
      ...budget,
      type: normalizeTransactionType(budget.type),
      plannedAmount: parseImportedAmount(budget.plannedAmount)
    }))
  };
}

function normalizeTransactionType(value: string): TransactionType {
  return value === 'income' ? 'income' : 'expense';
}

function buildPeriodRange(start: Period, end: Period): Period[] {
  const periods: Period[] = [];
  let cursor = new Date(start.year, start.month - 1, 1);
  const endDate = new Date(end.year, end.month - 1, 1);

  while (cursor <= endDate) {
    periods.push({
      year: cursor.getFullYear(),
      month: cursor.getMonth() + 1
    });

    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }

  return periods;
}

function parseImportedAmount(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  let raw = String(value ?? '').trim();

  if (!raw) {
    return 0;
  }

  raw = raw
    .replace(/\s/g, '')
    .replace(/€/g, '')
    .replace(/\u00A0/g, '');

  if (raw.includes(',') && raw.includes('.')) {
    raw = raw.replace(/\./g, '').replace(',', '.');
  } else if (raw.includes(',')) {
    raw = raw.replace(',', '.');
  } else if (raw.includes('.')) {
    raw = raw.replace(/\./g, '');
  }

  const num = Number(raw);
  return Number.isFinite(num) ? num : 0;
}

async function finishSyncRun(
  supabase: NonNullable<ReturnType<typeof getServerSupabase>>,
  syncRunId: string,
  status: 'success' | 'error',
  message: string,
  processedCount: number
) {
  await supabase
    .from('sync_runs')
    .update({
      status,
      message,
      processed_count: processedCount,
      finished_at: new Date().toISOString()
    })
    .eq('id', syncRunId);
}
