'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { Check, PencilLine } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { AnimatedValue } from '@/components/shared/animated-value';
import { SurfaceCard } from '@/components/shared/surface-card';
import type { DashboardData, MonthlyBudget, TransactionType } from '@/lib/domain/types';
import { formatCurrency } from '@/lib/utils/currency';

type BudgetScreenProps = {
  data: DashboardData;
  budgets: MonthlyBudget[];
  expenseCatalog: string[];
  incomeCatalog: string[];
  period: {
    year: number;
    month: number;
  };
  seededFromPrevious?: boolean;
};

type BudgetRowModel = {
  type: TransactionType;
  categoryName: string;
  plannedAmount: number;
  actualAmount: number;
};

export function BudgetScreen({
  data,
  budgets,
  expenseCatalog,
  incomeCatalog,
  period,
  seededFromPrevious = false
}: BudgetScreenProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [localBudgets, setLocalBudgets] = useState<Record<string, number>>(() => mapBudgetsToLocalState(budgets));

  useEffect(() => {
    setLocalBudgets(mapBudgetsToLocalState(budgets));
    setSavingKey(null);
    setSavedKey(null);
    setEditingKey(null);
    setErrorMessage(null);
  }, [budgets, period.year, period.month]);

  const expenseActualMap = useMemo(
    () => new Map(data.expenseCategories.map((category) => [category.categoryName, category.amount])),
    [data.expenseCategories]
  );
  const incomeActualMap = useMemo(
    () => new Map(data.incomeCategories.map((category) => [category.categoryName, category.amount])),
    [data.incomeCategories]
  );

  const expenseRows = useMemo(() => {
    return expenseCatalog.map<BudgetRowModel>((categoryName) => ({
      type: 'expense',
      categoryName,
      plannedAmount: localBudgets[makeKey('expense', categoryName)] ?? 0,
      actualAmount: expenseActualMap.get(categoryName) ?? 0
    }));
  }, [expenseActualMap, expenseCatalog, localBudgets]);

  const incomeRows = useMemo(() => {
    return incomeCatalog.map<BudgetRowModel>((categoryName) => ({
      type: 'income',
      categoryName,
      plannedAmount: localBudgets[makeKey('income', categoryName)] ?? 0,
      actualAmount: incomeActualMap.get(categoryName) ?? 0
    }));
  }, [incomeActualMap, incomeCatalog, localBudgets]);

  const expensePlannedTotal = expenseRows.reduce((sum, row) => sum + row.plannedAmount, 0);
  const incomePlannedTotal = incomeRows.reduce((sum, row) => sum + row.plannedAmount, 0);
  const expenseMargin = expensePlannedTotal - data.summary.totalExpense;
  const incomeMargin = data.summary.totalIncome - incomePlannedTotal;

  async function saveBudget(row: BudgetRowModel) {
    const key = makeKey(row.type, row.categoryName);
    setSavingKey(key);
    setSavedKey(null);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/budgets/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          year: period.year,
          month: period.month,
          type: row.type,
          categoryName: row.categoryName,
          plannedAmount: row.plannedAmount
        })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || 'No se pudo guardar el presupuesto.');
      }

      setSavedKey(key);
      setEditingKey((current) => (current === key ? null : current));
      startTransition(() => router.refresh());
      window.setTimeout(() => setSavedKey((current) => (current === key ? null : current)), 1800);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo guardar el presupuesto.');
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <div className="space-y-5">
      <SurfaceCard className="overflow-hidden p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-text-muted">presupuesto del mes</p>
            <div className="mt-3 flex items-end gap-3">
              <AnimatedValue
                value={expenseMargin}
                kind="currency"
                positivePrefix={expenseMargin > 0}
                className={`text-[2.7rem] font-semibold leading-none tracking-tight ${expenseMargin >= 0 ? 'text-pos' : 'text-neg'}`}
              />
            </div>
            <p className="mt-3 text-sm text-text-faint">
              {expenseMargin >= 0 ? 'restante frente al gasto previsto' : 'exceso frente al gasto previsto'}
            </p>
          </div>

          <div
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
              expenseMargin >= 0 ? 'bg-pos-soft text-pos' : 'bg-neg-soft text-neg'
            }`}
          >
            {expenseMargin >= 0 ? 'dentro' : 'excedido'}
          </div>
        </div>

        {seededFromPrevious ? (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-surface-2 px-3 py-1.5 text-xs text-text-muted">
            <PencilLine size={13} />
            base copiada del mes anterior
          </div>
        ) : null}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <StatPill label="gasto previsto" value={expensePlannedTotal} tone="expense" />
          <StatPill label="gasto real" value={data.summary.totalExpense} tone="expense" />
          <StatPill label="ingreso previsto" value={incomePlannedTotal} tone="income" />
          <StatPill label="ingreso real" value={data.summary.totalIncome} tone="income" />
        </div>
      </SurfaceCard>

      {errorMessage ? (
        <SurfaceCard className="border border-neg bg-neg-soft p-4 text-sm text-neg">
          {errorMessage}
        </SurfaceCard>
      ) : null}

      <BudgetSection
        title="gastos"
        caption={`${expenseRows.filter((row) => row.actualAmount > row.plannedAmount).length} categorías excedidas`}
        rows={expenseRows}
        savingKey={savingKey}
        savedKey={savedKey}
        editingKey={editingKey}
        disabled={isPending}
        onChange={(categoryName, value) => {
          setLocalBudgets((current) => ({
            ...current,
            [makeKey('expense', categoryName)]: value
          }));
        }}
        onStartEdit={(categoryName) => setEditingKey(makeKey('expense', categoryName))}
        onSave={saveBudget}
      />

      <BudgetSection
        title="ingresos"
        caption={`${incomeMargin >= 0 ? 'por encima' : 'por debajo'} de lo previsto`}
        rows={incomeRows}
        savingKey={savingKey}
        savedKey={savedKey}
        editingKey={editingKey}
        disabled={isPending}
        onChange={(categoryName, value) => {
          setLocalBudgets((current) => ({
            ...current,
            [makeKey('income', categoryName)]: value
          }));
        }}
        onStartEdit={(categoryName) => setEditingKey(makeKey('income', categoryName))}
        onSave={saveBudget}
      />
    </div>
  );
}

function BudgetSection({
  title,
  caption,
  rows,
  savingKey,
  savedKey,
  editingKey,
  disabled,
  onChange,
  onStartEdit,
  onSave
}: {
  title: string;
  caption: string;
  rows: BudgetRowModel[];
  savingKey: string | null;
  savedKey: string | null;
  editingKey: string | null;
  disabled: boolean;
  onChange: (categoryName: string, value: number) => void;
  onStartEdit: (categoryName: string) => void;
  onSave: (row: BudgetRowModel) => void;
}) {
  return (
    <SurfaceCard className="p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[1.35rem] font-semibold capitalize tracking-tight text-text">{title}</h2>
        <span className="text-xs text-text-faint">{caption}</span>
      </div>

      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <BudgetRow
            key={makeKey(row.type, row.categoryName)}
            row={row}
            isEditing={editingKey === makeKey(row.type, row.categoryName)}
            isSaving={savingKey === makeKey(row.type, row.categoryName)}
            isSaved={savedKey === makeKey(row.type, row.categoryName)}
            disabled={disabled}
            onChange={onChange}
            onStartEdit={onStartEdit}
            onSave={onSave}
          />
        ))}
      </div>
    </SurfaceCard>
  );
}

function BudgetRow({
  row,
  isEditing,
  isSaving,
  isSaved,
  disabled,
  onChange,
  onStartEdit,
  onSave
}: {
  row: BudgetRowModel;
  isEditing: boolean;
  isSaving: boolean;
  isSaved: boolean;
  disabled: boolean;
  onChange: (categoryName: string, value: number) => void;
  onStartEdit: (categoryName: string) => void;
  onSave: (row: BudgetRowModel) => void;
}) {
  const difference = row.type === 'expense' ? row.plannedAmount - row.actualAmount : row.actualAmount - row.plannedAmount;
  const usageRatio = row.plannedAmount === 0 ? 0 : row.actualAmount / row.plannedAmount;
  const isOver = row.type === 'expense' ? row.actualAmount > row.plannedAmount : row.actualAmount < row.plannedAmount && row.actualAmount > 0;
  const barWidth = `${Math.min(100, Math.max(row.actualAmount > 0 ? 8 : 0, usageRatio * 100))}%`;

  return (
    <div className="rounded-md border border-border bg-surface-2 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium text-text">{row.categoryName}</p>
            {isSaved ? <Check size={14} className="text-pos" /> : null}
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs text-text-faint">
            <span className="tnum">real {formatCurrency(row.actualAmount)}</span>
            <span className={`tnum ${difference >= 0 ? 'text-pos' : 'text-neg'}`}>
              {difference >= 0 ? (row.type === 'expense' ? 'restan ' : 'por encima ') : row.type === 'expense' ? 'exceso ' : 'faltan '}
              {formatCurrency(Math.abs(difference))}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {isEditing ? (
            <div className="relative flex h-12 w-[104px] items-center justify-end rounded-sm border border-accent bg-surface-1 px-3 text-right text-sm text-text">
              <input
                type="text"
                inputMode="decimal"
                autoFocus
                value={Number.isFinite(row.plannedAmount) ? String(row.plannedAmount).replace('.', ',') : '0'}
                onChange={(event) => onChange(row.categoryName, parseBudgetInput(event.target.value))}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    void onSave(row);
                  }
                }}
                className="tnum w-full bg-transparent text-right text-[1.05rem] font-medium text-text outline-none"
              />
              <span className="pointer-events-none ml-2 text-[11px] text-text-faint">€</span>
            </div>
          ) : null}

          <button
            type="button"
            disabled={disabled || isSaving}
            onClick={() => {
              if (isEditing) {
                void onSave(row);
                return;
              }
              onStartEdit(row.categoryName);
            }}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-sm border transition ${
              isSaved
                ? 'border-pos bg-pos-soft text-pos'
                : 'border-border bg-surface-1 text-text-muted hover:bg-surface-2'
            }`}
            aria-label={isEditing ? `Guardar presupuesto de ${row.categoryName}` : `Editar presupuesto de ${row.categoryName}`}
          >
            {isSaving ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/28 border-t-white/80" />
            ) : isEditing || isSaved ? (
              <Check size={16} />
            ) : (
              <PencilLine size={16} />
            )}
          </button>
        </div>
      </div>

      <div className="mt-3 h-2 rounded-full bg-white/[0.06]">
        <div
          className={`h-2 rounded-full ${
            row.type === 'expense' ? (isOver ? 'bar-neg' : 'bar-accent') : 'bar-pos'
          }`}
          style={{ width: barWidth }}
        />
      </div>
    </div>
  );
}

function StatPill({ label, value, tone }: { label: string; value: number; tone: 'income' | 'expense' }) {
  return (
    <div className="flex min-h-[118px] flex-col justify-between rounded-md border border-border bg-surface-2 p-4">
      <p className="max-w-[8rem] text-[11px] uppercase tracking-[0.18em] text-text-faint">{label}</p>
      <AnimatedValue
        value={value}
        kind="currency"
        className={`mt-4 block text-[1.1rem] font-semibold ${tone === 'income' ? 'text-pos' : 'text-neg'}`}
      />
    </div>
  );
}

function makeKey(type: TransactionType, categoryName: string) {
  return `${type}:${categoryName}`;
}

function mapBudgetsToLocalState(budgets: MonthlyBudget[]) {
  return Object.fromEntries(budgets.map((budget) => [makeKey(budget.type, budget.categoryName), budget.plannedAmount]));
}

function parseBudgetInput(value: string) {
  const normalized = value.replace(/\s/g, '').replace('€', '').replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}
