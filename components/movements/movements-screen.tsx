'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Search, SlidersHorizontal, Trash2, X } from 'lucide-react';

import { SurfaceCard } from '@/components/shared/surface-card';
import { expenseCategories, incomeCategories } from '@/lib/domain/categories';
import type { Transaction, TransactionType } from '@/lib/domain/types';
import { formatCurrency } from '@/lib/utils/currency';

type Period = {
  year: number;
  month: number;
};

type Filters = {
  type: TransactionType | 'all';
  category: string;
  query: string;
  date: string;
};

const DELETE_ACTION_WIDTH = 88;

export function MovementsScreen({
  transactions,
  period,
  filters: initialFilters
}: {
  transactions: Transaction[];
  period: Period;
  filters: Filters;
}) {
  const [typeFilter, setTypeFilter] = useState<Filters['type']>(initialFilters.type);
  const [categoryFilter, setCategoryFilter] = useState(initialFilters.category);
  const [query, setQuery] = useState(initialFilters.query);
  const [dateFilter, setDateFilter] = useState(initialFilters.date);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null);

  const aliveTransactions = useMemo(
    () => transactions.filter((transaction) => !deletedIds.includes(transaction.id)),
    [deletedIds, transactions]
  );

  const transactionsForCategories = useMemo(() => {
    let current = aliveTransactions;

    if (dateFilter) {
      current = current.filter((transaction) => transaction.transactionDate === dateFilter);
    }

    return current;
  }, [aliveTransactions, dateFilter]);

  const availableCategories = useMemo(() => {
    const source =
      typeFilter === 'income'
        ? incomeCategories.map((category) => category.name)
        : typeFilter === 'expense'
          ? expenseCategories.map((category) => category.name)
          : [...expenseCategories, ...incomeCategories].map((category) => category.name);

    const present = new Set(transactionsForCategories.map((transaction) => transaction.categoryName));

    return source.filter((category) => present.has(category));
  }, [transactionsForCategories, typeFilter]);

  useEffect(() => {
    if (categoryFilter !== 'all' && !availableCategories.includes(categoryFilter)) {
      setCategoryFilter('all');
    }
  }, [availableCategories, categoryFilter]);

  const baseFiltered = useMemo(() => {
    return aliveTransactions.filter((transaction) => {
      if (dateFilter && transaction.transactionDate !== dateFilter) {
        return false;
      }

      if (categoryFilter !== 'all' && transaction.categoryName !== categoryFilter) {
        return false;
      }

      if (query.trim()) {
        const haystack = `${transaction.description} ${transaction.categoryName}`.toLowerCase();
        if (!haystack.includes(query.trim().toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }, [aliveTransactions, categoryFilter, dateFilter, query]);

  const filtered = useMemo(() => {
    const current =
      typeFilter === 'all'
        ? baseFiltered
        : baseFiltered.filter((transaction) => transaction.type === typeFilter);

    return [...current].sort((a, b) =>
      a.transactionDate < b.transactionDate ? 1 : a.transactionDate > b.transactionDate ? -1 : b.amount - a.amount
    );
  }, [baseFiltered, typeFilter]);

  const totals = useMemo(
    () =>
      baseFiltered.reduce(
        (acc, transaction) => {
          if (transaction.type === 'income') {
            acc.income += transaction.amount;
          } else {
            acc.expense += transaction.amount;
          }
          return acc;
        },
        { income: 0, expense: 0 }
      ),
    [baseFiltered]
  );

  const grouped = useMemo(() => groupTransactionsByDate(filtered), [filtered]);
  const filterCount = Number(typeFilter !== 'all') + Number(categoryFilter !== 'all') + Number(Boolean(query)) + Number(Boolean(dateFilter));

  function handleTypeChange(nextType: Filters['type']) {
    setTypeFilter(nextType);
  }

  function handleResetFilters() {
    setTypeFilter('all');
    setCategoryFilter('all');
    setQuery('');
    setDateFilter('');
  }

  function confirmLocalDelete() {
    if (!pendingDelete) return;

    setDeletedIds((current) => [...current, pendingDelete.id]);
    setPendingDelete(null);
  }

  return (
    <>
      <div className="space-y-5">
        <div className="flex items-center justify-between px-1">
          <h1 className="text-[1.85rem] font-semibold tracking-tight text-white">Movimientos</h1>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/64 backdrop-blur-xl">
            <SlidersHorizontal size={14} className="text-white/46" />
            {filtered.length} resultados
          </div>
        </div>

        <SurfaceCard className="p-4">
          <div className="space-y-4">
            <div className="relative">
              <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/34" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por descripción o categoría"
                className="w-full rounded-[22px] border border-white/10 bg-white/[0.04] py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/28"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <FilterStatButton
                label="Ingresos"
                value={totals.income}
                tone="income"
                active={typeFilter === 'income'}
                muted={typeFilter !== 'all' && typeFilter !== 'income'}
                onClick={() => handleTypeChange('income')}
              />
              <FilterStatButton
                label="Gastos"
                value={totals.expense}
                tone="expense"
                active={typeFilter === 'expense'}
                muted={typeFilter !== 'all' && typeFilter !== 'expense'}
                onClick={() => handleTypeChange('expense')}
              />
              <FilterStatButton
                label="Neto"
                value={totals.income - totals.expense}
                tone={totals.income - totals.expense >= 0 ? 'income' : 'expense'}
                signed
                active={typeFilter === 'all'}
                muted={typeFilter !== 'all'}
                onClick={() => handleTypeChange('all')}
              />
            </div>

            {(dateFilter || filterCount > 0) ? (
              <div className="flex flex-wrap gap-2">
                {dateFilter ? (
                  <button
                    type="button"
                    onClick={() => setDateFilter('')}
                    className="inline-flex items-center gap-2 rounded-full border border-cyan-400/16 bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-100"
                  >
                    {formatSectionLabel(dateFilter)}
                    <X size={12} />
                  </button>
                ) : null}

                {filterCount > 0 ? (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/68"
                  >
                    Limpiar filtros
                    <X size={12} />
                  </button>
                ) : null}
              </div>
            ) : null}

            <div className="space-y-3">
              <div>
                <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-white/34">Categoría</p>
                <div className="scrollbar-none flex gap-2 overflow-x-auto pb-1">
                  <FilterChip active={categoryFilter === 'all'} onClick={() => setCategoryFilter('all')}>
                    Todas
                  </FilterChip>
                  {availableCategories.map((category) => (
                    <FilterChip
                      key={category}
                      active={categoryFilter === category}
                      onClick={() => setCategoryFilter(category)}
                    >
                      {category}
                    </FilterChip>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </SurfaceCard>

        <div className="space-y-4">
          {grouped.length > 0 ? (
            grouped.map((group) => (
              <SurfaceCard key={group.date} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-base font-medium text-white">{formatSectionLabel(group.date)}</p>
                    <p className="mt-1 text-xs text-white/42">{group.transactions.length} movimientos</p>
                  </div>
                  <p className={`text-sm font-medium ${group.net >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {group.net > 0 ? '+' : ''}{formatCurrency(group.net)}
                  </p>
                </div>

                <div className="mt-4 space-y-3">
                  {group.transactions.map((transaction) => (
                    <SwipeableMovementRow
                      key={transaction.id}
                      transaction={transaction}
                      onDelete={() => setPendingDelete(transaction)}
                    />
                  ))}
                </div>
              </SurfaceCard>
            ))
          ) : (
            <SurfaceCard className="p-8">
              <div className="rounded-[24px] border border-dashed border-white/10 p-6 text-center text-sm text-white/46">
                No hay movimientos con los filtros actuales.
              </div>
            </SurfaceCard>
          )}
        </div>
      </div>

      {pendingDelete ? (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/55 p-4 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-sm rounded-[28px] border border-white/10 bg-[#111a2c]/95 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
            <p className="text-lg font-semibold text-white">Eliminar movimiento</p>
            <p className="mt-2 text-sm leading-6 text-white/62">
              Vas a eliminar <span className="font-medium text-white">{pendingDelete.description}</span>.
            </p>
            <p className="mt-1 text-sm text-white/42">Por ahora es una vista previa visual, no se borra todavía del Google Sheets.</p>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="flex-1 rounded-[20px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white/78"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmLocalDelete}
                className="flex-1 rounded-[20px] bg-rose-500/85 px-4 py-3 text-sm font-medium text-white"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function FilterStatButton({
  label,
  value,
  tone,
  active,
  muted,
  signed = false,
  onClick
}: {
  label: string;
  value: number;
  tone: 'income' | 'expense';
  active: boolean;
  muted: boolean;
  signed?: boolean;
  onClick: () => void;
}) {
  const toneClasses = tone === 'income' ? 'text-emerald-300' : 'text-rose-300';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[22px] border px-3 py-3 text-left transition ${
        active
          ? 'border-white/16 bg-white/[0.08] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]'
          : 'border-white/8 bg-white/[0.03]'
      } ${muted ? 'opacity-45' : 'opacity-100'}`}
    >
      <p className="text-[11px] uppercase tracking-[0.18em] text-white/34">{label}</p>
      <p className={`mt-2 text-sm font-medium ${toneClasses}`}>
        {signed && value > 0 ? '+' : ''}{formatCurrency(value)}
      </p>
    </button>
  );
}

function FilterChip({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border px-4 py-2.5 text-sm transition ${
        active ? 'border-white/16 bg-white/[0.08] text-white' : 'border-white/10 bg-white/[0.04] text-white/72'
      }`}
    >
      {children}
    </button>
  );
}

function SwipeableMovementRow({
  transaction,
  onDelete
}: {
  transaction: Transaction;
  onDelete: () => void;
}) {
  const [offset, setOffset] = useState(0);
  const [locked, setLocked] = useState(false);
  const startX = useRef<number | null>(null);
  const startOffset = useRef(0);

  function handleTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    startX.current = event.touches[0]?.clientX ?? null;
    startOffset.current = offset;
  }

  function handleTouchMove(event: React.TouchEvent<HTMLDivElement>) {
    if (startX.current === null) return;

    const currentX = event.touches[0]?.clientX ?? startX.current;
    const delta = currentX - startX.current;
    const next = Math.max(-DELETE_ACTION_WIDTH, Math.min(0, startOffset.current + delta));
    setOffset(next);
  }

  function handleTouchEnd() {
    if (offset <= -DELETE_ACTION_WIDTH / 2) {
      setOffset(-DELETE_ACTION_WIDTH);
      setLocked(true);
    } else {
      setOffset(0);
      setLocked(false);
    }

    startX.current = null;
  }

  function handleClose() {
    setOffset(0);
    setLocked(false);
  }

  return (
    <div className="relative overflow-hidden rounded-[22px]">
      <div className="absolute inset-y-0 right-0 flex w-[88px] items-stretch justify-end">
        <button
          type="button"
          onClick={onDelete}
          className="flex w-[88px] items-center justify-center gap-2 rounded-[22px] bg-rose-500/85 text-sm font-medium text-white"
        >
          <Trash2 size={16} />
          Borrar
        </button>
      </div>

      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative flex items-center justify-between rounded-[22px] border border-white/[0.06] bg-white/[0.03] px-4 py-3.5 transition-transform duration-200 ease-out"
        style={{ transform: `translateX(${offset}px)` }}
      >
        <button
          type="button"
          aria-label={locked ? 'Cerrar acción de borrar' : undefined}
          onClick={locked ? handleClose : undefined}
          className="min-w-0 flex-1 pr-4 text-left"
        >
          <div className="flex items-center gap-2">
            <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${transaction.type === 'income' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'}`}>
              {transaction.type === 'income' ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{transaction.description}</p>
              <p className="mt-1 text-xs text-white/44">{transaction.categoryName}</p>
            </div>
          </div>
        </button>
        <p className={`shrink-0 text-sm font-medium ${transaction.type === 'income' ? 'text-emerald-300' : 'text-rose-300'}`}>
          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
        </p>
      </div>
    </div>
  );
}

function groupTransactionsByDate(transactions: Transaction[]) {
  const grouped = new Map<string, Transaction[]>();

  transactions.forEach((transaction) => {
    const current = grouped.get(transaction.transactionDate) ?? [];
    current.push(transaction);
    grouped.set(transaction.transactionDate, current);
  });

  return [...grouped.entries()].map(([date, dailyTransactions]) => ({
    date,
    transactions: dailyTransactions,
    net: dailyTransactions.reduce((sum, transaction) => {
      return sum + (transaction.type === 'income' ? transaction.amount : -transaction.amount);
    }, 0)
  }));
}

function formatSectionLabel(value: string) {
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'long'
  })
    .format(new Date(`${value}T00:00:00`))
    .replace('.', '');
}
