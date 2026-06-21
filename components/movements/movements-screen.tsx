'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Search, SlidersHorizontal, Trash2 } from 'lucide-react';

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
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    setActiveType(filters.type);
    setActiveCategory(filters.category);
    setQuery(filters.query);
    setActiveDate(filters.date);
    setOpenActionId(null);
    setDeleteCandidate(null);
    setDeletedIds([]);
    setIsDeleting(false);
    setDeleteError(null);
  }, [filters.type, filters.category, filters.query, filters.date, period.month, period.year]);

  const searchLower = query.trim().toLowerCase();

  const searchScopedTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      if (deletedIds.includes(transaction.id)) {
        return false;
      }

      if (activeDate && transaction.transactionDate !== activeDate) {
        return false;
      }

      if (!searchLower) {
        return true;
      }

      const haystack = `${transaction.description} ${transaction.categoryName}`.toLowerCase();
      return haystack.includes(searchLower);
    });
  }, [transactions, activeDate, searchLower, deletedIds]);

  const availableCategories = useMemo(() => {
    const scopedByType =
      activeType === 'all'
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
      .map((transaction, index) => ({ transaction, index }))
      .sort((a, b) => {
        if (a.transaction.transactionDate !== b.transaction.transactionDate) {
          return a.transaction.transactionDate < b.transaction.transactionDate ? 1 : -1;
        }

        const aRow = a.transaction.sourceRow ?? -1;
        const bRow = b.transaction.sourceRow ?? -1;

        if (aRow !== bRow) {
          return bRow - aRow;
        }

        return a.index - b.index;
      })
      .map(({ transaction }) => transaction);
  }, [contextTransactions, activeType]);

  const grouped = useMemo(() => groupTransactionsByDate(visibleTransactions), [visibleTransactions]);

  return (
    <div className="space-y-5">
      <SurfaceCard className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-2 px-3 py-2 text-xs text-text-muted">
              <SlidersHorizontal size={14} className="text-text-faint" />
              {visibleTransactions.length} resultados
            </div>

            {activeDate ? (
              <button
                type="button"
                onClick={() => setActiveDate('')}
                className="inline-flex items-center gap-2 rounded-full border border-accent bg-accent px-3 py-2 text-xs text-white"
              >
                {formatSectionLabel(activeDate)}
              </button>
            ) : null}
          </div>

          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-faint" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por descripción o categoría"
              className="w-full rounded-md border border-border bg-surface-2 py-3 pl-11 pr-4 text-sm text-text outline-none transition placeholder:text-text-faint focus:border-accent"
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

          <div>
            <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-text-faint">Categoría</p>
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
                  <p className="text-base font-medium text-text">{formatSectionLabel(group.date)}</p>
                  <p className="mt-1 text-xs text-text-faint">{group.transactions.length} movimientos</p>
                </div>
                <p className={`tnum text-sm font-medium ${group.net >= 0 ? 'text-pos' : 'text-neg'}`}>
                  {group.net > 0 ? '+' : ''}
                  {formatCurrency(group.net)}
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
            <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-text-faint">
              No hay movimientos con los filtros actuales.
            </div>
          </SurfaceCard>
        )}
      </div>

      {deleteCandidate ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/55 p-4 backdrop-blur-md">
          <div className="w-full max-w-[420px] rounded-lg border border-border bg-surface-1 p-5 shadow-[0_25px_80px_rgba(0,0,0,0.45)]">
            <h3 className="text-lg font-medium text-text">Eliminar movimiento</h3>
            <p className="mt-2 text-sm leading-6 text-text-muted">
              Vas a eliminar <span className="text-text">{deleteCandidate.description}</span> de Google Sheets y de la app. Esta acción no se puede deshacer.
            </p>
            {deleteError ? <p className="mt-3 text-sm text-neg">{deleteError}</p> : null}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  setDeleteCandidate(null);
                  setDeleteError(null);
                }}
                className="rounded-md border border-border bg-surface-2 px-4 py-3 text-sm text-text-muted disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={async () => {
                  if (!deleteCandidate) return;

                  try {
                    setIsDeleting(true);
                    setDeleteError(null);

                    const response = await fetch('/api/transactions/delete', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({
                        transactionId: deleteCandidate.id,
                        sourceFileId: deleteCandidate.sourceFileId,
                        sourceFileName: deleteCandidate.sourceFileName,
                        sourceSheetName: deleteCandidate.sourceSheetName,
                        sourceRow: deleteCandidate.sourceRow,
                        type: deleteCandidate.type
                      })
                    });

                    const payload = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;

                    if (!response.ok || !payload?.ok) {
                      throw new Error(payload?.error || 'No se pudo eliminar el movimiento.');
                    }

                    setDeletedIds((current) => [...current, deleteCandidate.id]);
                    setDeleteCandidate(null);
                    setOpenActionId(null);
                  } catch (error) {
                    setDeleteError(error instanceof Error ? error.message : 'No se pudo eliminar el movimiento.');
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                className="rounded-md bg-neg px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
              >
                {isDeleting ? 'Eliminando…' : 'Eliminar'}
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
      className={`rounded-md border px-3 py-3 text-left transition ${
        active
          ? 'border-accent bg-surface-2'
          : 'border-border bg-surface-2'
      } ${muted ? 'opacity-45' : 'opacity-100'}`}
      aria-pressed={active}
    >
      <p className="text-[11px] uppercase tracking-[0.18em] text-text-faint">{label}</p>
      <p className={`tnum mt-2 text-sm font-medium ${tone === 'income' ? 'text-pos' : 'text-neg'}`}>
        {signed && value > 0 ? '+' : ''}
        {formatCurrency(value)}
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
    <button type="button" onClick={onClick} className={`filter-chip whitespace-nowrap ${active ? 'filter-chip-active' : ''}`}>
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
  const ACTION_WIDTH = 88;

  return (
    <div className="relative overflow-hidden rounded-md">
      <div
        className={`pointer-events-none absolute inset-y-0 right-0 flex w-[88px] items-center justify-center rounded-md bg-neg transition-opacity duration-200 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <button
          type="button"
          onClick={onDelete}
          className={`pointer-events-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition ${
            isOpen ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
          }`}
          aria-label="Eliminar movimiento"
        >
          <Trash2 size={20} />
        </button>
      </div>

      <div
        className={`relative flex items-center justify-between rounded-md border border-border bg-surface-2 px-4 py-3.5 transition-transform duration-200 ease-out ${
          isOpen ? '-translate-x-[88px]' : 'translate-x-0'
        }`}
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
          } else if (deltaX.current > 20) {
            onClose();
          }
          startX.current = null;
          deltaX.current = 0;
        }}
      >
        <div className="min-w-0 pr-4">
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                transaction.type === 'income' ? 'bg-pos-soft text-pos' : 'bg-neg-soft text-neg'
              }`}
            >
              {transaction.type === 'income' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
            </span>
            <div className="min-w-0 text-left">
              <p className="truncate text-sm font-medium text-text">{transaction.description}</p>
              <p className="mt-1 text-xs text-text-faint">{transaction.categoryName}</p>
            </div>
          </div>
        </div>
        <p
          className={`tnum shrink-0 text-sm font-medium transition-all duration-200 ${
            transaction.type === 'income' ? 'text-pos' : 'text-neg'
          } ${isOpen ? 'translate-x-2 opacity-0' : 'translate-x-0 opacity-100'}`}
          style={{ maxWidth: isOpen ? `calc(100% - ${ACTION_WIDTH}px)` : undefined }}
        >
          {transaction.type === 'income' ? '+' : '-'}
          {formatCurrency(transaction.amount)}
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
