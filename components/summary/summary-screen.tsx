import type { ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight, Wallet } from 'lucide-react';

import { AnimatedValue } from '@/components/shared/animated-value';
import { SurfaceCard } from '@/components/shared/surface-card';
import type { DashboardData } from '@/lib/domain/types';
import { formatCurrency } from '@/lib/utils/currency';
import { formatShortDate } from '@/lib/utils/dates';
import type { Period } from '@/lib/utils/period';
import { DailyFlowChart } from '@/components/summary/daily-flow-chart';

export function SummaryScreen({ data, period }: { data: DashboardData; period: Period }) {
  const maxExpenseCategory = Math.max(...data.expenseCategories.map((item) => item.amount), 1);

  return (
    <div className="space-y-5">
      <SurfaceCard className="overflow-hidden p-5">
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-white/55">Saldo del periodo</p>
              <h1 className="mt-2 text-[2.75rem] font-semibold leading-none tracking-tight text-white">
                <AnimatedValue value={data.summary.closingBalance} kind="currency" />
              </h1>
            </div>
            <div className={`rounded-full px-3 py-1 text-xs ${data.summary.netAmount >= 0 ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'}`}>
              {data.summary.netAmount >= 0 ? 'Mes positivo' : 'Mes negativo'}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <MetricChip label="Ingresos" value={<AnimatedValue value={data.summary.totalIncome} kind="currency" />} icon={<ArrowUpRight size={16} />} tone="income" />
            <MetricChip label="Gastos" value={<AnimatedValue value={data.summary.totalExpense} kind="currency" />} icon={<ArrowDownRight size={16} />} tone="expense" />
            <MetricChip
              label="Ahorro"
              value={<AnimatedValue value={data.summary.savingsRate} kind="percent" />}
              icon={<Wallet size={16} />}
              tone={data.summary.savingsRate >= 0 ? 'income' : 'expense'}
            />
          </div>

          <DailyFlowChart trend={data.trend} period={period} openingBalance={data.summary.openingBalance} />
        </div>
      </SurfaceCard>

      <div className="grid grid-cols-2 gap-3">
        <SurfaceCard className="p-4">
          <p className="text-sm text-white/55">Flujo neto</p>
          <p className={`mt-3 text-2xl font-semibold ${data.summary.netAmount >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
            <AnimatedValue value={data.summary.netAmount} kind="currency" positivePrefix />
          </p>
          <p className="mt-2 text-xs leading-5 text-white/48">Diferencia entre ingresos y gastos del mes activo.</p>
        </SurfaceCard>

        <SurfaceCard className="p-4">
          <p className="text-sm text-white/55">Categoría dominante</p>
          <p className="mt-3 text-xl font-semibold text-white">{data.expenseCategories[0]?.categoryName ?? 'Sin datos'}</p>
          <p className="mt-2 text-xs leading-5 text-white/48">
            {data.expenseCategories[0] ? formatCurrency(data.expenseCategories[0].amount) : '0 €'} del gasto total.
          </p>
        </SurfaceCard>
      </div>

      <SurfaceCard className="p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-medium text-white">Peso por categoría</h3>
          <span className="text-xs text-white/45">Gastos</span>
        </div>
        <div className="mt-5 space-y-4">
          {data.expenseCategories.length > 0 ? (
            data.expenseCategories.slice(0, 6).map((category) => (
              <div key={category.categoryName} className="space-y-2">
                <div className="flex items-center justify-between text-sm text-white/72">
                  <span>{category.categoryName}</span>
                  <span>{formatCurrency(category.amount)}</span>
                </div>
                <div className="h-2 rounded-full bg-white/[0.06]">
                  <div
                    className="h-2 rounded-full bg-[linear-gradient(90deg,rgba(76,196,255,0.95),rgba(120,117,255,0.85))]"
                    style={{ width: `${(category.amount / maxExpenseCategory) * 100}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[24px] border border-dashed border-white/10 p-4 text-sm text-white/44">
              Todavía no hay categorías con gasto para este mes.
            </div>
          )}
        </div>
      </SurfaceCard>

      <SurfaceCard className="p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-medium text-white">Últimos movimientos</h3>
          <span className="text-xs text-white/45">{data.latestTransactions.length} recientes</span>
        </div>

        <div className="mt-4 space-y-3">
          {data.latestTransactions.length > 0 ? (
            data.latestTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between rounded-2xl bg-white/[0.03] px-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{transaction.description}</p>
                  <p className="mt-1 text-xs text-white/44">
                    {transaction.categoryName}, {formatShortDate(transaction.transactionDate)}
                  </p>
                </div>
                <p className={`ml-4 text-sm font-medium ${transaction.type === 'income' ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                </p>
              </div>
            ))
          ) : (
            <div className="rounded-[24px] border border-dashed border-white/10 p-4 text-sm text-white/44">
              No hay movimientos recientes en el periodo seleccionado.
            </div>
          )}
        </div>
      </SurfaceCard>
    </div>
  );
}

function MetricChip({
  label,
  value,
  icon,
  tone
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  tone: 'income' | 'expense';
}) {
  const toneClasses = tone === 'income' ? 'text-emerald-300' : 'text-rose-300';
  const iconClasses = tone === 'income' ? 'bg-emerald-500/12 text-emerald-300' : 'bg-rose-500/12 text-rose-300';

  return (
    <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-3">
      <div className={`inline-flex rounded-full p-2 ${iconClasses}`}>{icon}</div>
      <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-white/40">{label}</p>
      <div className={`mt-1 text-sm font-medium ${toneClasses}`}>{value}</div>
    </div>
  );
}
