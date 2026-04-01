import { ArrowDown, ArrowUp } from 'lucide-react';

import { PageHeader } from '@/components/shared/page-header';
import { SurfaceCard } from '@/components/shared/surface-card';
import type { DashboardData } from '@/lib/domain/types';
import { formatCurrency, formatPercent } from '@/lib/utils/currency';
import { formatShortDate } from '@/lib/utils/dates';

export function AnalyticsScreen({ data }: { data: DashboardData }) {
  const maxNetMagnitude = Math.max(...data.trend.map((point) => Math.abs(point.net)), 1);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Lectura del mes"
        title="Análisis directo"
        description="Qué categorías pesan más, cómo se reparte el ingreso y qué días han movido de verdad el balance."
      />

      <div className="grid grid-cols-2 gap-3">
        <SurfaceCard className="p-4">
          <p className="text-sm text-white/55">Ingreso principal</p>
          <p className="mt-3 text-xl font-semibold text-white">{data.incomeCategories[0]?.categoryName ?? 'Sin datos'}</p>
          <p className="mt-2 text-xs text-white/48">
            {data.incomeCategories[0] ? formatPercent(data.incomeCategories[0].percentage) : '0%'} del total de ingresos.
          </p>
        </SurfaceCard>

        <SurfaceCard className="p-4">
          <p className="text-sm text-white/55">Gasto dominante</p>
          <p className="mt-3 text-xl font-semibold text-white">{data.expenseCategories[0]?.categoryName ?? 'Sin datos'}</p>
          <p className="mt-2 text-xs text-white/48">
            {data.expenseCategories[0] ? formatPercent(data.expenseCategories[0].percentage) : '0%'} del total de gasto.
          </p>
        </SurfaceCard>
      </div>

      <SurfaceCard className="p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-medium text-white">Ingresos por categoría</h3>
          <span className="text-xs text-white/45">Ordenado por peso</span>
        </div>

        <div className="mt-5 space-y-4">
          {data.incomeCategories.map((category) => (
            <div key={category.categoryName} className="space-y-2">
              <div className="flex items-center justify-between text-sm text-white/72">
                <span>{category.categoryName}</span>
                <span>{formatCurrency(category.amount)}</span>
              </div>
              <div className="h-2 rounded-full bg-white/[0.06]">
                <div
                  className="h-2 rounded-full bg-[linear-gradient(90deg,rgba(52,211,153,0.95),rgba(20,184,166,0.78))]"
                  style={{ width: `${Math.max(8, category.percentage * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </SurfaceCard>

      <SurfaceCard className="p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-medium text-white">Pulso diario</h3>
          <span className="text-xs text-white/45">Impacto neto por día</span>
        </div>

        <div className="mt-5 space-y-3">
          {data.trend.map((point) => {
            const positive = point.net >= 0;
            return (
              <div key={point.date} className="grid grid-cols-[58px_1fr_auto] items-center gap-3">
                <span className="text-xs text-white/42">{formatShortDate(point.date)}</span>
                <div className="h-2 rounded-full bg-white/[0.06]">
                  <div
                    className={`h-2 rounded-full ${positive ? 'bg-[linear-gradient(90deg,rgba(52,211,153,0.95),rgba(20,184,166,0.78))]' : 'bg-[linear-gradient(90deg,rgba(248,113,113,0.95),rgba(251,146,60,0.75))]'}`}
                    style={{ width: `${Math.max(10, (Math.abs(point.net) / maxNetMagnitude) * 100)}%` }}
                  />
                </div>
                <div className={`inline-flex items-center gap-1 text-xs ${positive ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {positive ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                  {formatCurrency(Math.abs(point.net))}
                </div>
              </div>
            );
          })}
        </div>
      </SurfaceCard>
    </div>
  );
}
