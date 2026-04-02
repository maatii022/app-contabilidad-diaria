import type { ReactNode } from 'react';
import { ArrowUpRight, BanknoteArrowDown, CircleDollarSign } from 'lucide-react';

import { DailyPulseStrip } from '@/components/analytics/daily-pulse-strip';
import { SurfaceCard } from '@/components/shared/surface-card';
import type { DashboardData } from '@/lib/domain/types';
import { formatCurrency, formatPercent } from '@/lib/utils/currency';
import { formatShortDate } from '@/lib/utils/dates';
import type { Period } from '@/lib/utils/period';

export function AnalyticsScreen({
  period,
  data,
  previousData
}: {
  period: Period;
  data: DashboardData;
  previousData: DashboardData;
}) {
  const topExpense = data.expenseCategories[0] ?? null;
  const topIncome = data.incomeCategories[0] ?? null;
  const monthStatus = data.summary.netAmount >= 0 ? 'mes positivo' : 'mes negativo';
  const maxExpenseAmount = Math.max(...data.expenseCategories.map((item) => item.amount), 1);
  const maxIncomeAmount = Math.max(...data.incomeCategories.map((item) => item.amount), 1);
  const strongestExpenseMovements = data.latestTransactions
    .filter((item) => item.type === 'expense')
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 4);
  const strongestIncomeMovements = data.latestTransactions
    .filter((item) => item.type === 'income')
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 4);

  return (
    <div className="space-y-5">
      <SurfaceCard className="overflow-hidden p-5">
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm capitalize text-white/58">{data.summary.monthLabel.toLowerCase()}</p>
              <h1 className={`mt-2 text-[2.5rem] font-semibold leading-none tracking-tight ${data.summary.netAmount >= 0 ? 'text-white' : 'text-rose-300'}`}>
                {data.summary.netAmount > 0 ? '+' : data.summary.netAmount < 0 ? '-' : ''}
                {formatCurrency(Math.abs(data.summary.netAmount))}
              </h1>
            </div>
            <div className={`rounded-full px-3 py-1 text-xs ${data.summary.netAmount >= 0 ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'}`}>
              {monthStatus}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <DeltaChip
              label="ingresos"
              value={formatCurrency(data.summary.totalIncome)}
              delta={data.summary.totalIncome - previousData.summary.totalIncome}
              positiveDirection="up"
              icon={<ArrowUpRight size={16} />}
            />
            <DeltaChip
              label="gastos"
              value={formatCurrency(data.summary.totalExpense)}
              delta={data.summary.totalExpense - previousData.summary.totalExpense}
              positiveDirection="down"
              icon={<BanknoteArrowDown size={16} />}
            />
            <DeltaChip
              label="ahorro"
              value={formatPercent(data.summary.savingsRate)}
              delta={data.summary.netAmount - previousData.summary.netAmount}
              positiveDirection="up"
              icon={<CircleDollarSign size={16} />}
              percentValue
            />
          </div>
        </div>
      </SurfaceCard>

      <SurfaceCard className="p-5">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-white/55">pulso diario</p>
            <p className="mt-1 text-xs text-white/38">toque simple para leer el día, segundo toque para abrir movimientos</p>
          </div>
          <div className="text-right text-xs text-white/42">
            <p>balance de entrada y salida</p>
          </div>
        </div>

        <DailyPulseStrip period={period} trend={data.trend} />
      </SurfaceCard>

      <div className="grid grid-cols-2 gap-3">
        <InsightCard
          label="categoría dominante"
          value={topExpense?.categoryName ?? 'sin datos'}
          detail={topExpense ? `${formatCurrency(topExpense.amount)} del gasto total` : 'todavía sin gasto'}
        />
        <InsightCard
          label="fuente principal"
          value={topIncome?.categoryName ?? 'sin datos'}
          detail={topIncome ? `${formatCurrency(topIncome.amount)} del ingreso total` : 'todavía sin ingreso'}
        />
      </div>

      <SurfaceCard className="p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-medium text-white">categorías que más pesan</h3>
          <span className="text-xs text-white/45">gasto</span>
        </div>

        <div className="mt-5 space-y-4">
          {data.expenseCategories.length > 0 ? (
            data.expenseCategories.slice(0, 6).map((category) => (
              <div key={category.categoryName} className="space-y-2">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <div className="min-w-0">
                    <p className="truncate text-white/82">{category.categoryName}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-white/36">{formatPercent(category.percentage)} del gasto</p>
                  </div>
                  <span className="shrink-0 text-white">{formatCurrency(category.amount)}</span>
                </div>
                <div className="h-2 rounded-full bg-white/[0.06]">
                  <div
                    className="h-2 rounded-full bg-[linear-gradient(90deg,rgba(255,168,188,0.96),rgba(255,97,132,0.84))]"
                    style={{ width: `${Math.max(8, (category.amount / maxExpenseAmount) * 100)}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <EmptyCardText text="Todavía no hay gasto suficiente para analizar categorías." />
          )}
        </div>
      </SurfaceCard>

      <SurfaceCard className="p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-medium text-white">ingresos por categoría</h3>
          <span className="text-xs text-white/45">origen</span>
        </div>

        <div className="mt-5 space-y-4">
          {data.incomeCategories.length > 0 ? (
            data.incomeCategories.slice(0, 5).map((category) => (
              <div key={category.categoryName} className="space-y-2">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <div className="min-w-0">
                    <p className="truncate text-white/82">{category.categoryName}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-white/36">{formatPercent(category.percentage)} del ingreso</p>
                  </div>
                  <span className="shrink-0 text-emerald-300">{formatCurrency(category.amount)}</span>
                </div>
                <div className="h-2 rounded-full bg-white/[0.06]">
                  <div
                    className="h-2 rounded-full bg-[linear-gradient(90deg,rgba(150,223,255,0.95),rgba(72,126,255,0.82))]"
                    style={{ width: `${Math.max(8, (category.amount / maxIncomeAmount) * 100)}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <EmptyCardText text="Todavía no hay ingreso suficiente para analizar categorías." />
          )}
        </div>
      </SurfaceCard>

      <SurfaceCard className="p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-medium text-white">comparativa con el mes anterior</h3>
          <span className="text-xs text-white/45 capitalize">{previousData.summary.monthLabel.toLowerCase()}</span>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <CompareMetric label="ingresos" current={data.summary.totalIncome} previous={previousData.summary.totalIncome} positiveWhenHigher />
          <CompareMetric label="gastos" current={data.summary.totalExpense} previous={previousData.summary.totalExpense} />
          <CompareMetric label="neto" current={data.summary.netAmount} previous={previousData.summary.netAmount} positiveWhenHigher />
        </div>
      </SurfaceCard>

      <SurfaceCard className="p-5">
        <div className="grid grid-cols-2 gap-5">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-medium text-white">gastos altos</h3>
              <span className="text-xs text-white/45">top 4</span>
            </div>
            <MovementList items={strongestExpenseMovements} emptyText="Sin gastos relevantes este mes." amountClass="text-rose-300" />
          </div>

          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-medium text-white">ingresos altos</h3>
              <span className="text-xs text-white/45">top 4</span>
            </div>
            <MovementList items={strongestIncomeMovements} emptyText="Sin ingresos relevantes este mes." amountClass="text-emerald-300" />
          </div>
        </div>
      </SurfaceCard>
    </div>
  );
}

function DeltaChip({
  label,
  value,
  delta,
  icon,
  positiveDirection,
  percentValue = false
}: {
  label: string;
  value: string;
  delta: number;
  icon: ReactNode;
  positiveDirection: 'up' | 'down';
  percentValue?: boolean;
}) {
  const positive = positiveDirection === 'up' ? delta >= 0 : delta <= 0;

  return (
    <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-3">
      <div className={`inline-flex rounded-full p-2 ${positive ? 'bg-emerald-500/12 text-emerald-300' : 'bg-rose-500/12 text-rose-300'}`}>
        {icon}
      </div>
      <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-white/38">{label}</p>
      <p className="mt-1 text-sm font-medium text-white">{value}</p>
      <p className={`mt-2 text-xs ${positive ? 'text-emerald-300' : 'text-rose-300'}`}>
        {delta > 0 ? '+' : delta < 0 ? '-' : ''}
        {percentValue ? formatCurrency(Math.abs(delta)) : formatCurrency(Math.abs(delta))}
      </p>
    </div>
  );
}

function InsightCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <SurfaceCard className="p-4">
      <p className="text-sm text-white/55">{label}</p>
      <p className="mt-3 text-xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-xs leading-5 text-white/48">{detail}</p>
    </SurfaceCard>
  );
}

function CompareMetric({
  label,
  current,
  previous,
  positiveWhenHigher = false
}: {
  label: string;
  current: number;
  previous: number;
  positiveWhenHigher?: boolean;
}) {
  const delta = current - previous;
  const positive = positiveWhenHigher ? delta >= 0 : delta <= 0;

  return (
    <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
      <p className="text-[11px] uppercase tracking-[0.16em] text-white/38">{label}</p>
      <p className="mt-3 text-lg font-semibold text-white">{formatCurrency(current)}</p>
      <p className={`mt-2 text-xs ${positive ? 'text-emerald-300' : 'text-rose-300'}`}>
        {delta > 0 ? '+' : delta < 0 ? '-' : ''}{formatCurrency(Math.abs(delta))}
      </p>
    </div>
  );
}

function MovementList({
  items,
  emptyText,
  amountClass
}: {
  items: DashboardData['latestTransactions'];
  emptyText: string;
  amountClass: string;
}) {
  if (items.length === 0) {
    return <EmptyCardText text={emptyText} />;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="rounded-2xl bg-white/[0.03] px-3 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{item.description}</p>
              <p className="mt-1 text-xs text-white/44">{item.categoryName} · {formatShortDate(item.transactionDate).toLowerCase()}</p>
            </div>
            <p className={`shrink-0 text-sm font-medium ${amountClass}`}>
              {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyCardText({ text }: { text: string }) {
  return <div className="rounded-[24px] border border-dashed border-white/10 p-4 text-sm text-white/44">{text}</div>;
}
