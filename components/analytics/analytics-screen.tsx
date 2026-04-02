import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowUpRight, BanknoteArrowDown, CircleDollarSign } from 'lucide-react';

import { AnnualBalanceChart } from '@/components/analytics/annual-balance-chart';
import { DailyPulseStrip } from '@/components/analytics/daily-pulse-strip';
import { AnimatedValue } from '@/components/shared/animated-value';
import { SurfaceCard } from '@/components/shared/surface-card';
import type { AnnualAnalyticsData, CategoryTotal, DashboardData, Transaction } from '@/lib/domain/types';
import { formatCurrency, formatPercent } from '@/lib/utils/currency';
import { formatShortDate } from '@/lib/utils/dates';
import type { Period } from '@/lib/utils/period';

export function AnalyticsScreen({
  period,
  viewMode,
  data,
  previousData,
  annualData
}: {
  period: Period;
  viewMode: 'monthly' | 'annual';
  data: DashboardData;
  previousData: DashboardData;
  annualData: AnnualAnalyticsData;
}) {
  const modeHrefBase = `year=${period.year}&month=${period.month}`;

  if (viewMode === 'annual') {
    const topExpense = annualData.expenseCategories[0] ?? null;
    const topIncome = annualData.incomeCategories[0] ?? null;
    const maxExpenseAmount = Math.max(...annualData.expenseCategories.map((item) => item.amount), 1);
    const maxIncomeAmount = Math.max(...annualData.incomeCategories.map((item) => item.amount), 1);

    return (
      <div className="space-y-5">
        <ModeSwitch monthlyHref={`/analisis?${modeHrefBase}`} annualHref={`/analisis?${modeHrefBase}&view=annual`} active="annual" />

        <SurfaceCard className="overflow-hidden p-5">
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-white/58">{period.year}, acumulado hasta {annualData.months.at(-1)?.label ?? ''}</p>
                <h1 className={`mt-2 text-[2.5rem] font-semibold leading-none tracking-tight ${annualData.netAmount >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                  <AnimatedValue value={annualData.netAmount} kind="currency" positivePrefix className="tabular-nums" />
                </h1>
              </div>
              <div className={`rounded-full px-3 py-1 text-xs ${annualData.netAmount >= 0 ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'}`}>
                {annualData.netAmount >= 0 ? 'año positivo' : 'año negativo'}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <DeltaChip label="ingresos" value={annualData.totalIncome} kind="currency" icon={<ArrowUpRight size={16} />} forcePositive />
              <DeltaChip label="gastos" value={annualData.totalExpense} kind="currency" icon={<BanknoteArrowDown size={16} />} />
              <DeltaChip label="ahorro" value={annualData.savingsRate} kind="percent" icon={<CircleDollarSign size={16} />} forcePositive={annualData.netAmount >= 0} />
            </div>
          </div>
        </SurfaceCard>

        <AnnualBalanceChart months={annualData.months} />

        <div className="grid grid-cols-2 gap-3">
          <InsightCard
            label="categoría dominante"
            value={topExpense?.categoryName ?? 'sin datos'}
            detail={topExpense ? `${formatCurrency(topExpense.amount)} del gasto anual` : 'todavía sin gasto'}
          />
          <InsightCard
            label="fuente principal"
            value={topIncome?.categoryName ?? 'sin datos'}
            detail={topIncome ? `${formatCurrency(topIncome.amount)} del ingreso anual` : 'todavía sin ingreso'}
          />
        </div>

        <CategoryListCard title="categorías que más pesan" subtitle="gasto anual" categories={annualData.expenseCategories} maxAmount={maxExpenseAmount} tone="expense" emptyText="Todavía no hay gasto suficiente para analizar categorías." />
        <CategoryListCard title="ingresos por categoría" subtitle="origen anual" categories={annualData.incomeCategories} maxAmount={maxIncomeAmount} tone="income" emptyText="Todavía no hay ingreso suficiente para analizar categorías." />

        <SurfaceCard className="p-5">
          <div className="grid grid-cols-2 gap-5">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-medium text-white">gastos altos</h3>
                <span className="text-xs text-white/45">top 4</span>
              </div>
              <MovementList items={annualData.topExpenseTransactions} emptyText="Sin gastos relevantes este año." amountClass="text-rose-300" />
            </div>
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-medium text-white">ingresos altos</h3>
                <span className="text-xs text-white/45">top 4</span>
              </div>
              <MovementList items={annualData.topIncomeTransactions} emptyText="Sin ingresos relevantes este año." amountClass="text-emerald-300" />
            </div>
          </div>
        </SurfaceCard>
      </div>
    );
  }

  const topExpense = data.expenseCategories[0] ?? null;
  const topIncome = data.incomeCategories[0] ?? null;
  const monthStatus = data.summary.netAmount >= 0 ? 'mes positivo' : 'mes negativo';
  const maxExpenseAmount = Math.max(...data.expenseCategories.map((item) => item.amount), 1);
  const maxIncomeAmount = Math.max(...data.incomeCategories.map((item) => item.amount), 1);
  const strongestExpenseMovements = [...data.monthTransactions].filter((item) => item.type === 'expense').sort((a, b) => b.amount - a.amount).slice(0, 4);
  const strongestIncomeMovements = [...data.monthTransactions].filter((item) => item.type === 'income').sort((a, b) => b.amount - a.amount).slice(0, 4);

  return (
    <div className="space-y-5">
      <ModeSwitch monthlyHref={`/analisis?${modeHrefBase}`} annualHref={`/analisis?${modeHrefBase}&view=annual`} active="monthly" />

      <SurfaceCard className="overflow-hidden p-5">
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm capitalize text-white/58">{data.summary.monthLabel.toLowerCase()}</p>
              <h1 className={`mt-2 text-[2.5rem] font-semibold leading-none tracking-tight ${data.summary.netAmount >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                <AnimatedValue value={data.summary.netAmount} kind="currency" positivePrefix className="tabular-nums" />
              </h1>
            </div>
            <div className={`rounded-full px-3 py-1 text-xs ${data.summary.netAmount >= 0 ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'}`}>
              {monthStatus}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <DeltaChip label="ingresos" value={data.summary.totalIncome} delta={data.summary.totalIncome - previousData.summary.totalIncome} positiveDirection="up" icon={<ArrowUpRight size={16} />} />
            <DeltaChip label="gastos" value={data.summary.totalExpense} delta={data.summary.totalExpense - previousData.summary.totalExpense} positiveDirection="down" icon={<BanknoteArrowDown size={16} />} />
            <DeltaChip label="ahorro" value={data.summary.savingsRate} delta={data.summary.netAmount - previousData.summary.netAmount} positiveDirection="up" icon={<CircleDollarSign size={16} />} kind="percent" />
          </div>
        </div>
      </SurfaceCard>

      <div className="grid grid-cols-2 gap-3">
        <InsightCard label="categoría dominante" value={topExpense?.categoryName ?? 'sin datos'} detail={topExpense ? `${formatCurrency(topExpense.amount)} del gasto total` : 'todavía sin gasto'} />
        <InsightCard label="fuente principal" value={topIncome?.categoryName ?? 'sin datos'} detail={topIncome ? `${formatCurrency(topIncome.amount)} del ingreso total` : 'todavía sin ingreso'} />
      </div>

      <CategoryListCard title="categorías que más pesan" subtitle="gasto" categories={data.expenseCategories} maxAmount={maxExpenseAmount} tone="expense" emptyText="Todavía no hay gasto suficiente para analizar categorías." />
      <CategoryListCard title="ingresos por categoría" subtitle="origen" categories={data.incomeCategories} maxAmount={maxIncomeAmount} tone="income" emptyText="Todavía no hay ingreso suficiente para analizar categorías." />

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

      <SurfaceCard className="p-5">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-white/55">pulso diario</p>
            <p className="mt-1 text-xs text-white/38">toque simple para leer el día, segundo toque para abrir movimientos</p>
          </div>
        </div>

        <DailyPulseStrip period={period} trend={data.trend} />
      </SurfaceCard>
    </div>
  );
}

function ModeSwitch({ monthlyHref, annualHref, active }: { monthlyHref: string; annualHref: string; active: 'monthly' | 'annual' }) {
  return (
    <div className="inline-flex rounded-[20px] border border-white/10 bg-white/[0.04] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-xl">
      <Link href={monthlyHref} className={`rounded-[14px] px-4 py-2 text-sm transition ${active === 'monthly' ? 'bg-white/[0.08] text-white' : 'text-white/52 hover:text-white/76'}`}>
        mensual
      </Link>
      <Link href={annualHref} className={`rounded-[14px] px-4 py-2 text-sm transition ${active === 'annual' ? 'bg-white/[0.08] text-white' : 'text-white/52 hover:text-white/76'}`}>
        anual
      </Link>
    </div>
  );
}

function DeltaChip({
  label,
  value,
  delta,
  icon,
  positiveDirection,
  kind = 'currency',
  forcePositive
}: {
  label: string;
  value: number;
  delta?: number;
  icon: ReactNode;
  positiveDirection?: 'up' | 'down';
  kind?: 'currency' | 'percent';
  forcePositive?: boolean;
}) {
  const positive = forcePositive ?? (positiveDirection === 'up' ? (delta ?? 0) >= 0 : (delta ?? 0) <= 0);

  return (
    <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-3">
      <div className={`inline-flex rounded-full p-2 ${positive ? 'bg-emerald-500/12 text-emerald-300' : 'bg-rose-500/12 text-rose-300'}`}>{icon}</div>
      <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-white/38">{label}</p>
      <p className="mt-1 text-sm font-medium text-white">
        <AnimatedValue value={value} kind={kind} positivePrefix={false} className="tabular-nums" />
      </p>
      {typeof delta === 'number' ? (
        <p className={`mt-2 text-xs ${positive ? 'text-emerald-300' : 'text-rose-300'}`}>
          <AnimatedValue value={delta} kind="currency" positivePrefix className="tabular-nums" />
        </p>
      ) : null}
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

function CategoryListCard({ title, subtitle, categories, maxAmount, tone, emptyText }: { title: string; subtitle: string; categories: CategoryTotal[]; maxAmount: number; tone: 'expense' | 'income'; emptyText: string; }) {
  const gradient = tone === 'expense'
    ? 'bg-[linear-gradient(90deg,rgba(255,168,188,0.96),rgba(255,97,132,0.84))]'
    : 'bg-[linear-gradient(90deg,rgba(150,223,255,0.95),rgba(72,126,255,0.82))]';
  const amountClass = tone === 'expense' ? 'text-white' : 'text-emerald-300';
  const percentageLabel = tone === 'expense' ? 'del gasto' : 'del ingreso';

  return (
    <SurfaceCard className="p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium text-white">{title}</h3>
        <span className="text-xs text-white/45">{subtitle}</span>
      </div>

      <div className="mt-5 space-y-4">
        {categories.length > 0 ? (
          categories.slice(0, 6).map((category) => (
            <div key={category.categoryName} className="space-y-2">
              <div className="flex items-center justify-between gap-4 text-sm">
                <div className="min-w-0">
                  <p className="truncate text-white/82">{category.categoryName}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-white/36">{formatPercent(category.percentage)} {percentageLabel}</p>
                </div>
                <span className={`shrink-0 ${amountClass}`}>{formatCurrency(category.amount)}</span>
              </div>
              <div className="h-2 rounded-full bg-white/[0.06]">
                <div className={`h-2 rounded-full ${gradient}`} style={{ width: `${Math.max(8, (category.amount / maxAmount) * 100)}%` }} />
              </div>
            </div>
          ))
        ) : (
          <EmptyCardText text={emptyText} />
        )}
      </div>
    </SurfaceCard>
  );
}

function MovementList({ items, emptyText, amountClass }: { items: Transaction[]; emptyText: string; amountClass: string; }) {
  if (items.length === 0) {
    return <EmptyCardText text={emptyText} />;
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      {items.map((transaction) => (
        <div key={transaction.id} className="flex min-h-[132px] flex-col justify-between rounded-[24px] bg-white/[0.03] px-4 py-4">
          <p className="text-[1.15rem] font-medium leading-6 text-white break-words">
            {transaction.description}
          </p>

          <div className="mt-4 flex items-end justify-between gap-3">
            <p className="text-sm text-white/48">
              {transaction.categoryName} · {formatShortDate(transaction.transactionDate)}
            </p>
            <span className={`shrink-0 text-[1.1rem] font-medium ${amountClass}`}>
              {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyCardText({ text }: { text: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-white/10 px-4 py-5 text-sm text-white/42">
      {text}
    </div>
  );
}
