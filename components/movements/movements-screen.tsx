import Link from 'next/link';

import { PageHeader } from '@/components/shared/page-header';
import { SurfaceCard } from '@/components/shared/surface-card';
import type { Transaction, TransactionType } from '@/lib/domain/types';
import { formatCurrency } from '@/lib/utils/currency';
import { formatShortDate } from '@/lib/utils/dates';
import { filterTransactions } from '@/lib/utils/finance';

export function MovementsScreen({
  transactions,
  filters,
  categories
}: {
  transactions: Transaction[];
  filters: {
    type: TransactionType | 'all';
    category: string;
    query: string;
  };
  categories: string[];
}) {
  const filtered = filterTransactions(transactions, filters).sort((a, b) => (a.transactionDate < b.transactionDate ? 1 : -1));

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Movimiento diario"
        title="Todo el histórico útil"
        description="Vista compacta para revisar importes, localizar descripciones y filtrar por categoría sin perder contexto."
      />

      <SurfaceCard className="p-5">
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/38">Búsqueda</label>
            <form className="flex gap-2" action="/movimientos">
              <input
                name="q"
                defaultValue={filters.query}
                placeholder="Buscar por descripción o categoría"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/28"
              />
              <input type="hidden" name="type" value={filters.type} />
              <input type="hidden" name="category" value={filters.category} />
              <button className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-slate-950" type="submit">
                Filtrar
              </button>
            </form>
          </div>

          <div className="space-y-3">
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.18em] text-white/38">Tipo</p>
              <div className="flex flex-wrap gap-2">
                {(['all', 'expense', 'income'] as const).map((value) => {
                  const active = filters.type === value;
                  const label = value === 'all' ? 'Todos' : value === 'expense' ? 'Gastos' : 'Ingresos';

                  return (
                    <Link key={value} href={buildHref({ type: value, category: filters.category, query: filters.query })} className={`filter-chip ${active ? 'filter-chip-active' : ''}`}>
                      {label}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.18em] text-white/38">Categoría</p>
              <div className="scrollbar-none flex gap-2 overflow-x-auto pb-1">
                <Link href={buildHref({ type: filters.type, category: 'all', query: filters.query })} className={`filter-chip ${filters.category === 'all' ? 'filter-chip-active' : ''}`}>
                  Todas
                </Link>
                {categories.map((category) => (
                  <Link
                    key={category}
                    href={buildHref({ type: filters.type, category, query: filters.query })}
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

      <SurfaceCard className="p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-medium text-white">Resultados</h3>
          <span className="text-xs text-white/45">{filtered.length} movimientos</span>
        </div>

        <div className="mt-4 space-y-3">
          {filtered.map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between rounded-2xl bg-white/[0.03] px-4 py-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${transaction.type === 'income' ? 'bg-emerald-300' : 'bg-white/55'}`} />
                  <p className="truncate text-sm font-medium text-white">{transaction.description}</p>
                </div>
                <p className="mt-1 text-xs text-white/45">
                  {transaction.categoryName}, {formatShortDate(transaction.transactionDate)}
                </p>
              </div>
              <p className={`ml-4 text-sm font-medium ${transaction.type === 'income' ? 'text-emerald-300' : 'text-white'}`}>
                {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
              </p>
            </div>
          ))}

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-white/48">
              No hay resultados con los filtros actuales.
            </div>
          ) : null}
        </div>
      </SurfaceCard>
    </div>
  );
}

function buildHref({
  type,
  category,
  query
}: {
  type: string;
  category: string;
  query: string;
}) {
  const searchParams: Record<string, string> = {};

  if (type && type !== 'all') searchParams.type = type;
  if (category && category !== 'all') searchParams.category = category;
  if (query) searchParams.q = query;

  return {
    pathname: '/movimientos',
    query: searchParams
  };
}
