'use client';

import { useMemo, useState, useTransition } from 'react';
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [localBudgets, setLocalBudgets] = useState<Record<string, number>>(() =>
    Object.fromEntries(budgets.map((budget) => [makeKey(budget.type, budget.categoryName), budget.plannedAmount]))
  );

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
          <div>
            <p className="text-sm text-white/54">presupuesto del mes</p>
            <div className="mt-3 flex items-end gap-3">
              <AnimatedValue
                value={expenseMargin}
                kind="currency"
                positivePrefix={expenseMargin > 0}
                className={`text-[2.7rem] font-semibold leading-none tracking-tight ${expenseMargin >= 0 ? 'text-white' : 'text-rose-300'}`}
              />
            </div>
            <p className="mt-3 text-sm text-white/48">
              {expenseMargin >= 0 ? 'restante frente al gasto previsto' : 'exceso frente al gasto previsto'}
            </p>
          </div>

          <div className={`rounded-full px-4 py-2 text-sm ${expenseMargin >= 0 ? 'bg-emerald-500/14 text-emerald-300' : 'bg-rose-500/14 text-rose-300'}`}>
            {expenseMargin >= 0 ? 'dentro del presupuesto' : 'presupuesto excedido'}
          </div>
        </div>

        {seededFromPrevious ? (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/14 bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-100">
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
        <SurfaceCard className="border border-rose-500/16 bg-rose-500/[0.07] p-4 text-sm text-rose-100">
          {errorMessage}
        </SurfaceCard>
      ) : null}

      <BudgetSection
        title="gastos"
        caption={`${expenseRows.filter((row) => row.actualAmount > row.plannedAmount).length} categorías excedidas`}
        rows={expenseRows}
        savingKey={savingKey}
        savedKey={savedKey}
        disabled={isPending}
        onChange={(categoryName, value) => {
          setLocalBudgets((current) => ({
            ...current,
            [makeKey('expense', categoryName)]: value
          }));
        }}
        onSave={saveBudget}
      />

      <BudgetSection
        title="ingresos"
        caption={`${incomeMargin >= 0 ? 'por encima' : 'por debajo'} de lo previsto`}
        rows={incomeRows}
        savingKey={savingKey}
        savedKey={savedKey}
        disabled={isPending}
        onChange={(categoryName, value) => {
          setLocalBudgets((current) => ({
            ...current,
            [makeKey('income', categoryName)]: value
          }));
        }}
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
  disabled,
  onChange,
  onSave
}: {
  title: string;
  caption: string;
  rows: BudgetRowModel[];
  savingKey: string | null;
  savedKey: string | null;
  disabled: boolean;
  onChange: (categoryName: string, value: number) => void;
  onSave: (row: BudgetRowModel) => void;
}) {
  return (
    <SurfaceCard className="p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[1.35rem] font-semibold capitalize tracking-tight text-white">{title}</h2>
        <span className="text-xs text-white/44">{caption}</span>
      </div>

      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <BudgetRow
            key={makeKey(row.type, row.categoryName)}
            row={row}
            isSaving={savingKey === makeKey(row.type, row.categoryName)}
            isSaved={savedKey === makeKey(row.type, row.categoryName)}
            disabled={disabled}
            onChange={onChange}
            onSave={onSave}
          />
        ))}
      </div>
    </SurfaceCard>
  );
}

function BudgetRow({
  row,
  isSaving,
  isSaved,
  disabled,
  onChange,
  onSave
}: {
  row: BudgetRowModel;
  isSaving: boolean;
  isSaved: boolean;
  disabled: boolean;
  onChange: (categoryName: string, value: number) => void;
  onSave: (row: BudgetRowModel) => void;
}) {
  const difference = row.type === 'expense' ? row.plannedAmount - row.actualAmount : row.actualAmount - row.plannedAmount;
  const usageRatio = row.plannedAmount === 0 ? 0 : row.actualAmount / row.plannedAmount;
  const isOver = row.type === 'expense' ? row.actualAmount > row.plannedAmount : row.actualAmount < row.plannedAmount && row.actualAmount > 0;
  const barWidth = `${Math.min(100, Math.max(row.actualAmount > 0 ? 8 : 0, usageRatio * 100))}%`;

  return (
    <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium text-white">{row.categoryName}</p>
            {isSaved ? <Check size={14} className="text-emerald-300" /> : null}
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs text-white/48">
            <span>real {formatCurrency(row.actualAmount)}</span>
            <span className={difference >= 0 ? 'text-emerald-300' : 'text-rose-300'}>
              {difference >= 0 ? row.type === 'expense' ? 'restan ' : 'por encima ' : row.type === 'expense' ? 'exceso ' : 'faltan '}
              {formatCurrency(Math.abs(difference))}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="relative w-[108px]">
            <input
              type="number"
              min="0"
              step="0.01"
              value={Number.isFinite(row.plannedAmount) ? row.plannedAmount : 0}
              onChange={(event) => onChange(row.categoryName, Number(event.target.value || 0))}
              className="w-full rounded-[18px] border border-white/10 bg-[#151e35] px-3 py-2 text-right text-sm text-white outline-none"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-white/36">€</span>
          </div>
          <button
            type="button"
            disabled={disabled || isSaving}
            onClick={() => onSave(row)}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-[16px] border transition ${
              isSaved
                ? 'border-emerald-400/18 bg-emerald-500/12 text-emerald-300'
                : 'border-white/10 bg-white/[0.05] text-white/72 hover:bg-white/[0.08]'
            }`}
            aria-label={`Guardar presupuesto de ${row.categoryName}`}
          >
            {isSaving ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/28 border-t-white/80" />
            ) : isSaved ? (
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
            row.type === 'expense'
              ? isOver
                ? 'bg-[linear-gradient(90deg,rgba(251,113,133,0.92),rgba(245,158,11,0.75))]'
                : 'bg-[linear-gradient(90deg,rgba(96,165,250,0.95),rgba(52,211,153,0.78))]'
              : 'bg-[linear-gradient(90deg,rgba(45,212,191,0.95),rgba(96,165,250,0.82))]'
          }`}
          style={{ width: barWidth }}
        />
      </div>
    </div>
  );
}

function StatPill({ label, value, tone }: { label: string; value: number; tone: 'income' | 'expense' }) {
  return (
    <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-white/34">{label}</p>
      <AnimatedValue
        value={value}
        kind="currency"
        className={`mt-2 block text-lg font-semibold ${tone === 'income' ? 'text-emerald-300' : 'text-rose-300'}`}
      />
    </div>
  );
}

function makeKey(type: TransactionType, categoryName: string) {
  return `${type}:${categoryName}`;
}
