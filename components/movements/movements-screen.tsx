'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Search, SlidersHorizontal, Trash2, X } from 'lucide-react';

import { SurfaceCard } from '@/components/shared/surface-card';
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

export function MovementsScreen({
  transactions,
  filters,
  period
}: {
  transactions: Transaction[];
  filters: Filters;
  period: Period;
}) {
  const [activeType, setActiveType] = useState<Filters['type']>(filters.type);
  const [activeCategory, setActiveCategory] = useState(filters.category);
  const [query, setQuery] = useState(filters.query);
  const [activeDate, setActiveDate] = useState(filters.date);
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Transaction | null>(null);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  useEffect(() => {
    setActiveType(filters.type);
    setActiveCategory(filters.category);
    setQuery(filters.query);
    setActiveDate(filters.date);
    setOpenActionId(null);
    setDeleteCandidate(null);
    setDismissedIds([]);
  }, [filters.type, filters.category, filters.query, filters.date, period.month, period.year]);

  const searchLower = query.trim().toLowerCase();

  const searchScopedTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      if (activeDate && transaction.transactionDate !== activeDate) {
        return false;
      }

      if (!searchLower) {
        return true;
      }

      const haystack = `${transaction.description} ${transaction.categoryName}`.toLowerCase();
      return haystack.includes(searchLower);
    });
  }, [transactions, activeDate, searchLower]);

  const availableCategories = useMemo(() => {
    const scopedByType = activeType === 'all'
      ? searchScopedTransactions
      : searchScopedTransactions.filter((transaction) => transaction.type === activeType);

    return [...new Set(scopedByType.map((transaction) => transaction.categoryName))].sort((a, b) => a.localeCompare(b));
  }, [searchScopedTransactions, activeType]);

  useEffect(() => {
    if (activeCategory !== 'all' && !availableCategories.includes(activeCategory)) {
      setActiveCategory('all');
    }
  }, [activeCategory, availableCategories]);

  const contextTransactions = useMemo(() => {
    return searchScopedTransactions.filter((transaction) => {
      if (activeCategory !== 'all' && transaction.categoryName !== activeCategory) {
        return false;
      }
      return true;
    });
  }, [searchScopedTransactions, activeCategory]);

  const periodTotals = useMemo(() => {
    return contextTransactions.reduce(
      (acc, transaction) => {
        if (transaction.type === 'income') {
          acc.income += transaction.amount;
        } else {
          acc.expense += transaction.amount;
        }
        return acc;
      },
      { income: 0, expense: 0 }
    );
  }, [contextTransactions]);

  const visibleTransactions = useMemo(() => {
    return contextTransactions
      .filter((transaction) => activeType === 'all' || transaction.type === activeType)
      .filter((transaction) => !dismissedIds.includes(transaction.id))
      .sort((a, b) => (a.transactionDate < b.transactionDate ? 1 : a.transactionDate > b.transactionDate ? -1 : b.amount - a.amount));
  }, [contextTransactions, activeType, dismissedIds]);

  const grouped = useMemo(() => groupTransactionsByDate(visibleTransactions), [visibleTransactions]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between px-1">
        <h1 className="text-[1.85rem] font-semibold tracking-tight text-white">Movimientos</h1>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/64 backdrop-blur-xl">
          <SlidersHorizontal size={14} className="text-white/46" />
          {visibleTransactions.length} resultados
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
            <TypeStatButton
              label="Ingresos"
              value={periodTotals.income}
              tone="income"
              active={activeType === 'income'}
              muted={activeType !== 'all' && activeType !== 'income'}
              onClick={() => setActiveType((current) => (current === 'income' ? 'all' : 'income'))}
            />
            <TypeStatButton
              label="Gastos"
              value={periodTotals.expense}
              tone="expense"
              active={activeType === 'expense'}
              muted={activeType !== 'all' && activeType !== 'expense'}
              onClick={() => setActiveType((current) => (current === 'expense' ? 'all' : 'expense'))}
            />
            <TypeStatButton
              label="Neto"
              value={periodTotals.income - periodTotals.expense}
              tone={periodTotals.income - periodTotals.expense >= 0 ? 'income' : 'expense'}
              signed
              active={activeType === 'all'}
              muted={activeType !== 'all'}
              onClick={() => setActiveType('all')}
            />
          </div>

          {activeDate ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveDate('')}
                className="inline-flex items-center gap-2 rounded-full border border-cyan-400/16 bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-100"
              >
                {formatSectionLabel(activeDate)}
                <X size={12} />
              </button>
            </div>
          ) : null}

          <div>
            <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-white/34">Categoría</p>
            <div className="scrollbar-none flex gap-2 overflow-x-auto pb-1">
              <FilterChip active={activeCategory === 'all'} onClick={() => setActiveCategory('all')}>
                Todas
              </FilterChip>
              {availableCategories.map((category) => (
                <FilterChip
                  key={category}
                  active={activeCategory === category}
                  onClick={() => setActiveCategory((current) => (current === category ? 'all' : category))}
                >
                  {category}
                </FilterChip>
              ))}
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
                  <SwipeRow
                    key={transaction.id}
                    transaction={transaction}
                    isOpen={openActionId === transaction.id}
                    onOpen={() => setOpenActionId(transaction.id)}
                    onClose={() => setOpenActionId((current) => (current === transaction.id ? null : current))}
                    onDelete={() => {
                      setOpenActionId(null);
                      setDeleteCandidate(transaction);
                    }}
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

      {deleteCandidate ? (
        <div className="fixed inset-0 z-[70] flex items-end bg-black/45 p-4 backdrop-blur-sm">
          <div className="mx-auto w-full max-w-md rounded-[28px] border border-white/10 bg-[#121a31]/95 p-5 shadow-[0_25px_80px_rgba(0,0,0,0.45)]">
            <h3 className="text-lg font-medium text-white">Eliminar movimiento</h3>
            <p className="mt-2 text-sm leading-6 text-white/62">
              Vas a eliminar <span className="text-white">{deleteCandidate.description}</span>. De momento es solo una prueba visual y no se borrará de Google Sheets todavía.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className="rounded-[20px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/72"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setDismissedIds((current) => [...current, deleteCandidate.id]);
                  setDeleteCandidate(null);
                }}
                className="rounded-[20px] bg-rose-500/90 px-4 py-3 text-sm font-medium text-white"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TypeStatButton({
  label,
  value,
  tone,
  signed = false,
  active,
  muted,
  onClick
}: {
  label: string;
  value: number;
  tone: 'income' | 'expense';
  signed?: boolean;
  active: boolean;
  muted: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[22px] border px-3 py-3 text-left transition ${
        active
          ? 'border-white/16 bg-white/[0.08] shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_14px_34px_rgba(0,0,0,0.18)]'
          : 'border-white/8 bg-white/[0.03]'
      } ${muted ? 'opacity-45' : 'opacity-100'}`}
      aria-pressed={active}
    >
      <p className="text-[11px] uppercase tracking-[0.18em] text-white/34">{label}</p>
      <p className={`mt-2 text-sm font-medium ${tone === 'income' ? 'text-emerald-300' : 'text-rose-300'}`}>
        {signed && value > 0 ? '+' : ''}{formatCurrency(value)}
      </p>
    </button>
  );
}

function FilterChip({
  active,
  children,
  onClick
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`filter-chip whitespace-nowrap ${active ? 'filter-chip-active' : ''}`}
    >
      {children}
    </button>
  );
}

function SwipeRow({
  transaction,
  isOpen,
  onOpen,
  onClose,
  onDelete
}: {
  transaction: Transaction;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onDelete: () => void;
}) {
  const startX = useRef<number | null>(null);
  const deltaX = useRef(0);

  return (
    <div className="relative overflow-hidden rounded-[22px]">
      <div className="absolute inset-y-0 right-0 flex w-[84px] items-center justify-center rounded-[22px] bg-rose-500/90 shadow-[0_18px_40px_rgba(225,29,72,0.28)]">
        <button
          type="button"
          onClick={onDelete}
          className="flex h-full w-full items-center justify-center text-white"
          aria-label="Eliminar movimiento"
        >
          <Trash2 size={20} />
        </button>
      </div>

      <div
        className={`relative flex items-center justify-between rounded-[22px] border border-white/[0.06] bg-white/[0.03] px-4 py-3.5 transition-transform duration-200 ease-out ${isOpen ? '-translate-x-[84px]' : 'translate-x-0'}`}
        onTouchStart={(event) => {
          startX.current = event.touches[0]?.clientX ?? null;
          deltaX.current = 0;
        }}
        onTouchMove={(event) => {
          if (startX.current === null) return;
          deltaX.current = (event.touches[0]?.clientX ?? 0) - startX.current;
        }}
        onTouchEnd={() => {
          if (deltaX.current < -36) {
            onOpen();
          } else if (deltaX.current > 24) {
            onClose();
          }
          startX.current = null;
          deltaX.current = 0;
        }}
      >
        <button
          type="button"
          onClick={() => {
            if (isOpen) {
              onClose();
            }
          }}
          className="absolute inset-0"
          aria-label={isOpen ? 'Cerrar acciones' : 'Movimiento'}
        />

        <div className="min-w-0 pr-4">
          <div className="flex items-center gap-2">
            <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${transaction.type === 'income' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'}`}>
              {transaction.type === 'income' ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}
            </span>
            <div className="min-w-0 text-left">
              <p className="truncate text-sm font-medium text-white">{transaction.description}</p>
              <p className="mt-1 text-xs text-white/44">{transaction.categoryName}</p>
            </div>
          </div>
        </div>
        <p className={`relative z-[1] shrink-0 text-sm font-medium ${transaction.type === 'income' ? 'text-emerald-300' : 'text-rose-300'}`}>
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
