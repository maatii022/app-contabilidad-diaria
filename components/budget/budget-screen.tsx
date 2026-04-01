import { AlertTriangle, CheckCircle2, CircleEqual } from 'lucide-react';

import { PageHeader } from '@/components/shared/page-header';
import { SurfaceCard } from '@/components/shared/surface-card';
import type { DashboardData } from '@/lib/domain/types';
import { formatCurrency } from '@/lib/utils/currency';

export function BudgetScreen({ data }: { data: DashboardData }) {
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Previsto vs real"
        title="Presupuesto mensual"
        description="Aquí es donde esta app deja de ser un listado y se convierte en un panel de control."
      />

      <SurfaceCard className="p-5">
        <div className="grid grid-cols-3 gap-3 text-center">
          <BudgetKpi label="Correctas" value={data.budgetInsights.filter((item) => item.status === 'under').length} />
          <BudgetKpi label="Ajustadas" value={data.budgetInsights.filter((item) => item.status === 'balanced').length} />
          <BudgetKpi label="Excedidas" value={data.budgetInsights.filter((item) => item.status === 'over').length} />
        </div>
      </SurfaceCard>

      <SurfaceCard className="p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-medium text-white">Seguimiento por categoría</h3>
          <span className="text-xs text-white/45">Gastos del mes</span>
        </div>

        <div className="mt-5 space-y-4">
          {data.budgetInsights.map((item) => {
            const Icon = item.status === 'over' ? AlertTriangle : item.status === 'balanced' ? CircleEqual : CheckCircle2;
            const accent = item.status === 'over' ? 'text-amber-300' : item.status === 'balanced' ? 'text-blue-300' : 'text-emerald-300';
            const barWidth = `${Math.min(100, Math.max(6, item.usageRatio * 100))}%`;

            return (
              <div key={item.categoryName} className="rounded-3xl bg-white/[0.03] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">{item.categoryName}</p>
                    <p className="mt-1 text-xs text-white/45">
                      Previsto {formatCurrency(item.plannedAmount)}, real {formatCurrency(item.actualAmount)}
                    </p>
                  </div>
                  <div className={`inline-flex items-center gap-2 text-xs ${accent}`}>
                    <Icon size={14} />
                    {item.status === 'over' ? 'Pasada' : item.status === 'balanced' ? 'Exacta' : 'Bajo control'}
                  </div>
                </div>

                <div className="mt-4 h-2 rounded-full bg-white/[0.06]">
                  <div
                    className={`h-2 rounded-full ${item.status === 'over' ? 'bg-[linear-gradient(90deg,rgba(251,191,36,0.95),rgba(245,158,11,0.78))]' : 'bg-[linear-gradient(90deg,rgba(96,165,250,0.95),rgba(52,211,153,0.78))]'}`}
                    style={{ width: barWidth }}
                  />
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-white/44">
                  <span>Uso {(item.usageRatio * 100).toFixed(0)}%</span>
                  <span>
                    {item.remainingAmount >= 0 ? 'Restante' : 'Exceso'} {formatCurrency(Math.abs(item.remainingAmount))}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </SurfaceCard>
    </div>
  );
}

function BudgetKpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl bg-white/[0.03] p-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-white/38">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}
