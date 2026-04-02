import Link from 'next/link';
import { ArrowDownRight, ArrowUpRight, Search, SlidersHorizontal, X } from 'lucide-react';

import { SurfaceCard } from '@/components/shared/surface-card';
import type { Transaction, TransactionType } from '@/lib/domain/types';
import { formatCurrency } from '@/lib/utils/currency';
import { filterTransactions } from '@/lib/utils/finance';

type Period = {
  year: number;
  month: number;
};

export function MovementsScreen({
  transactions,
  filters,
  categories,
  period
}: {
  transactions: Transaction[];
  filters: {
    type: TransactionType | 'all';
    category: string;
    query: string;
    date: string;
  };
  categories: string[];
  period: Period;
}) {
  const monthTransactions = filterTransactions(transactions, {
    type: filters.type,
    category: filters.category,
    query: filters.query
  }).filter((transaction) => !filters.date || transaction.transactionDate === filters.date);

  const filtered = [...monthTransactions].sort((a, b) => (a.transactionDate < b.transactionDate ? 1 : a.transactionDate > b.transactionDate ? -1 : b.amount - a.amount));

  const totals = filtered.reduce(
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

  const grouped = groupTransactionsByDate(filtered);
  const filterCount = Number(filters.type !== 'all') + Number(filters.category !== 'all') + Number(Boolean(filters.query)) + Number(Boolean(filters.date));

  return (
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
          <form className="space-y-4" action="/movimientos">
            <input type="hidden" name="type" value={filters.type} />
            <input type="hidden" name="category" value={filters.category} />
            <input type="hidden" name="date" value={filters.date} />
            <input type="hidden" name="year" value={period.year} />
            <input type="hidden" name="month" value={period.month} />

            <div className="relative">
              <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/34" />
              <input
                name="q"
                defaultValue={filters.query}
                placeholder="Buscar por descripción o categoría"
                className="w-full rounded-[22px] border border-white/10 bg-white/[0.04] py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/28"
              />
            </div>
          </form>

          <div className="grid grid-cols-3 gap-3">
            <MiniStat label="Ingresos" value={totals.income} tone="income" />
            <MiniStat label="Gastos" value={totals.expense} tone="expense" />
            <MiniStat label="Neto" value={totals.income - totals.expense} tone={totals.income - totals.expense >= 0 ? 'income' : 'expense'} signed />
          </div>

          {(filters.date || filterCount > 0) ? (
            <div className="flex flex-wrap gap-2">
              {filters.date ? (
                <Link
                  href={buildHref({
                    type: filters.type,
                    category: filters.category,
                    query: filters.query,
                    date: '',
                    year: period.year,
                    month: period.month
                  })}
                  className="inline-flex items-center gap-2 rounded-full border border-cyan-400/16 bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-100"
                >
                  {formatSectionLabel(filters.date)}
                  <X size={12} />
                </Link>
              ) : null}

              {filterCount > 0 ? (
                <Link
                  href={buildHref({ type: 'all', category: 'all', query: '', date: '', year: period.year, month: period.month })}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/68"
                >
                  Limpiar filtros
                  <X size={12} />
                </Link>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-3">
            <div>
              <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-white/34">Tipo</p>
              <div className="flex flex-wrap gap-2">
                {(['all', 'expense', 'income'] as const).map((value) => {
                  const active = filters.type === value;
                  const label = value === 'all' ? 'Todos' : value === 'expense' ? 'Gastos' : 'Ingresos';

                  return (
                    <Link
                      key={value}
                      href={buildHref({
                        type: value,
                        category: filters.category,
                        query: filters.query,
                        date: filters.date,
                        year: period.year,
                        month: period.month
                      })}
                      className={`filter-chip ${active ? 'filter-chip-active' : ''}`}
                    >
                      {label}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-white/34">Categoría</p>
              <div className="scrollbar-none flex gap-2 overflow-x-auto pb-1">
                <Link
                  href={buildHref({
                    type: filters.type,
                    category: 'all',
                    query: filters.query,
                    date: filters.date,
                    year: period.year,
                    month: period.month
                  })}
                  className={`filter-chip ${filters.category === 'all' ? 'filter-chip-active' : ''}`}
                >
                  Todas
                </Link>
                {categories.map((category) => (
                  <Link
                    key={category}
                    href={buildHref({
                      type: filters.type,
                      category,
                      query: filters.query,
                      date: filters.date,
                      year: period.year,
                      month: period.month
                    })}
                    className={`filter-chip ${filters.category === category ? 'filter-chip-active' : ''}`}
                  >
                    {category}
                  </Link>
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
                  <div key={transaction.id} className="flex items-center justify-between rounded-[22px] border border-white/[0.06] bg-white/[0.03] px-4 py-3.5">
                    <div className="min-w-0 pr-4">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${transaction.type === 'income' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'}`}>
                          {transaction.type === 'income' ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white">{transaction.description}</p>
                          <p className="mt-1 text-xs text-white/44">{transaction.categoryName}</p>
                        </div>
                      </div>
                    </div>
                    <p className={`shrink-0 text-sm font-medium ${transaction.type === 'income' ? 'text-emerald-300' : 'text-rose-300'}`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </p>
                  </div>
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
  );
}

function MiniStat({
  label,
  value,
  tone,
  signed = false
}: {
  label: string;
  value: number;
  tone: 'income' | 'expense';
  signed?: boolean;
}) {
  return (
    <div className="rounded-[22px] border border-white/8 bg-white/[0.03] px-3 py-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-white/34">{label}</p>
      <p className={`mt-2 text-sm font-medium ${tone === 'income' ? 'text-emerald-300' : 'text-rose-300'}`}>
        {signed && value > 0 ? '+' : ''}{formatCurrency(value)}
      </p>
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

function buildHref({
  type,
  category,
  query,
  date,
  year,
  month
}: {
  type: string;
  category: string;
  query: string;
  date: string;
  year: number;
  month: number;
}) {
  const searchParams: Record<string, string> = {
    year: String(year),
    month: String(month)
  };

  if (type && type !== 'all') searchParams.type = type;
  if (category && category !== 'all') searchParams.category = category;
  if (query) searchParams.q = query;
  if (date) searchParams.date = date;

  return {
    pathname: '/movimientos',
    query: searchParams
  };
}
