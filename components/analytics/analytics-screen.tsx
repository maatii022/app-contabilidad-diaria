import type { ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight, Coins } from 'lucide-react';

import { DailyPulseStrip } from '@/components/analytics/daily-pulse-strip';
import { AnimatedValue } from '@/components/shared/animated-value';
import { SurfaceCard } from '@/components/shared/surface-card';
import type { CategoryTotal, DashboardData, Transaction } from '@/lib/domain/types';
import { formatCurrency, formatPercent } from '@/lib/utils/currency';
import { formatShortDate } from '@/lib/utils/dates';
import type { Period } from '@/lib/utils/period';

export function AnalyticsScreen({
  period,
  data,
  previousData,
  transactions
}: {
  period: Period;
  data: DashboardData;
  previousData: DashboardData;
  transactions: Transaction[];
}) {
  const topExpenseCategory = data.expenseCategories[0] ?? null;
  const topIncomeCategory = data.incomeCategories[0] ?? null;
  const topExpenseMovements = transactions
    .filter((item) => item.type === 'expense')
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 4);
  const topIncomeMovements = transactions
    .filter((item) => item.type === 'income')
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 4);
  const netDelta = data.summary.netAmount - previousData.summary.netAmount;

  return (
    <div className="space-y-5">
      <SurfaceCard className="overflow-hidden p-5">
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-white/58">{data.summary.monthLabel.toLowerCase()}</p>
              <h1 className={`mt-2 text-[2.5rem] font-semibold leading-none tracking-tight ${data.summary.netAmount >= 0 ? 'text-white' : 'text-rose-300'}`}>
                <AnimatedValue value={data.summary.netAmount} kind="currency" positivePrefix />
              </h1>
              <div className="mt-3 flex items-center gap-2 text-sm text-white/45">
                <span>vs {previousData.summary.monthLabel.toLowerCase()}</span>
                <span className={netDelta >= 0 ? 'text-emerald-300' : 'text-rose-300'}>
                  <AnimatedValue value={netDelta} kind="currency" positivePrefix />
                </span>
              </div>
            </div>
            <div className={`rounded-full px-3 py-1 text-xs ${data.summary.netAmount >= 0 ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'}`}>
              {data.summary.netAmount >= 0 ? 'mes positivo' : 'mes negativo'}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <MetricTile label="ingresos" value={<AnimatedValue value={data.summary.totalIncome} kind="currency" />} delta={data.summary.totalIncome - previousData.summary.totalIncome} tone="income" icon={<ArrowUpRight size={16} />} />
            <MetricTile label="gastos" value={<AnimatedValue value={data.summary.totalExpense} kind="currency" />} delta={data.summary.totalExpense - previousData.summary.totalExpense} tone="expense" icon={<ArrowDownRight size={16} />} />
            <MetricTile label="ahorro" value={<AnimatedValue value={data.summary.savingsRate} kind="percent" />} delta={data.summary.netAmount - previousData.summary.netAmount} tone={data.summary.savingsRate >= 0 ? 'income' : 'expense'} icon={<Coins size={16} />} />
          </div>
        </div>
      </SurfaceCard>

      <div className="grid grid-cols-2 gap-3">
        <InsightCard
          label="categoría que más gasta"
          value={topExpenseCategory?.categoryName ?? 'sin datos'}
          detail={topExpenseCategory ? formatCurrency(topExpenseCategory.amount) : '0 €'}
          tone="expense"
        />
        <InsightCard
          label="categoría que más ingresa"
          value={topIncomeCategory?.categoryName ?? 'sin datos'}
          detail={topIncomeCategory ? formatCurrency(topIncomeCategory.amount) : '0 €'}
          tone="income"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <CategoryWeightPanel
          title="más peso en gasto"
          items={data.expenseCategories}
          tone="expense"
          emptyText="todavía sin gasto este mes"
        />
        <CategoryWeightPanel
          title="más peso en ingreso"
          items={data.incomeCategories}
          tone="income"
          emptyText="todavía sin ingreso este mes"
        />
      </div>

      <SurfaceCard className="p-5">
        <div className="grid grid-cols-2 gap-5">
          <MovementColumn title="gastos altos" items={topExpenseMovements} amountClass="text-rose-300" emptyText="Sin gastos relevantes este mes." />
          <MovementColumn title="ingresos altos" items={topIncomeMovements} amountClass="text-emerald-300" emptyText="Sin ingresos relevantes este mes." />
        </div>
      </SurfaceCard>

      <SurfaceCard className="p-5">
        <DailyPulseStrip period={period} trend={data.trend} />
      </SurfaceCard>
    </div>
  );
}

function MetricTile({
  label,
  value,
  delta,
  tone,
  icon
}: {
  label: string;
  value: ReactNode;
  delta: number;
  tone: 'income' | 'expense';
  icon: ReactNode;
}) {
  const positive = tone === 'income' ? delta >= 0 : delta <= 0;

  return (
    <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-3">
      <div className={`inline-flex rounded-full p-2 ${tone === 'income' ? 'bg-emerald-500/12 text-emerald-300' : 'bg-rose-500/12 text-rose-300'}`}>
        {icon}
      </div>
      <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-white/38">{label}</p>
      <p className={`mt-1 text-sm font-medium ${tone === 'income' ? 'text-emerald-300' : 'text-rose-300'}`}>{value}</p>
      <p className={`mt-2 text-xs ${positive ? 'text-emerald-300' : 'text-rose-300'}`}>
        <AnimatedValue value={delta} kind="currency" positivePrefix />
      </p>
    </div>
  );
}

function InsightCard({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: 'income' | 'expense' }) {
  return (
    <SurfaceCard className="p-4">
      <p className="text-sm text-white/55">{label}</p>
      <p className="mt-3 text-xl font-semibold text-white">{value}</p>
      <p className={`mt-2 text-sm ${tone === 'income' ? 'text-emerald-300' : 'text-rose-300'}`}>{detail}</p>
    </SurfaceCard>
  );
}

function CategoryWeightPanel({
  title,
  items,
  tone,
  emptyText
}: {
  title: string;
  items: CategoryTotal[];
  tone: 'income' | 'expense';
  emptyText: string;
}) {
  if (items.length === 0) {
    return (
      <SurfaceCard className="p-4">
        <p className="text-sm text-white/55">{title}</p>
        <p className="mt-3 text-sm text-white/42">{emptyText}</p>
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-white/55">{title}</p>
        <span className="text-xs text-white/38">top {Math.min(4, items.length)}</span>
      </div>

      <div className="space-y-3">
        {items.slice(0, 4).map((item) => (
          <div key={item.categoryName}>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate text-white/88">{item.categoryName}</span>
              <span className="shrink-0 text-white/48">{formatPercent(item.percentage)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3 text-sm">
              <span className={tone === 'income' ? 'text-emerald-300' : 'text-rose-300'}>{formatCurrency(item.amount)}</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-white/[0.06]">
              <div
                className={`h-2 rounded-full ${tone === 'income' ? 'bg-[linear-gradient(90deg,rgba(72,220,203,0.92),rgba(95,126,255,0.88))]' : 'bg-[linear-gradient(90deg,rgba(255,121,146,0.95),rgba(255,164,73,0.82))]'}`}
                style={{ width: `${Math.max(10, item.percentage * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </SurfaceCard>
  );
}

function MovementColumn({
  title,
  items,
  amountClass,
  emptyText
}: {
  title: string;
  items: Transaction[];
  amountClass: string;
  emptyText: string;
}) {
  const slots = normalizeMovementSlots(items);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-medium text-white">{title}</h3>
        <span className="text-xs text-white/45">top 4</span>
      </div>

      <div className="space-y-3">
        {slots.every((item) => item === null) ? (
          <EmptyCardText text={emptyText} />
        ) : (
          slots.map((item, index) =>
            item ? (
              <MovementCard key={item.id} item={item} amountClass={amountClass} />
            ) : (
              <div key={`empty-${title}-${index}`} className="min-h-[116px] rounded-2xl border border-dashed border-white/8 bg-white/[0.02]" />
            )
          )
        )}
      </div>
    </div>
  );
}

function MovementCard({ item, amountClass }: { item: Transaction; amountClass: string }) {
  return (
    <div className="min-h-[116px] rounded-2xl bg-white/[0.03] px-3 py-3">
      <div className="flex h-full items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">{item.description}</p>
          <p className="mt-2 text-xs leading-6 text-white/44">{item.categoryName} · {formatShortDate(item.transactionDate).toLowerCase()}</p>
        </div>
        <p className={`shrink-0 text-sm font-medium ${amountClass}`}>
          {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
        </p>
      </div>
    </div>
  );
}

function normalizeMovementSlots(items: Transaction[]) {
  const base = items.slice(0, 4);
  return [...base, ...Array.from({ length: Math.max(0, 4 - base.length) }, () => null)];
}

function EmptyCardText({ text }: { text: string }) {
  return <div className="rounded-[24px] border border-dashed border-white/10 p-4 text-sm text-white/44">{text}</div>;
}
