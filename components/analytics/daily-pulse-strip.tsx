'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import type { TrendPoint } from '@/lib/domain/types';
import { formatCurrency } from '@/lib/utils/currency';
import type { Period } from '@/lib/utils/period';

const DAY_WIDTH = 20;
const DAY_WIDTH_SELECTED = 32;
const GAP = 10;
const CHART_HEIGHT = 126;
const BASELINE_OFFSET = 58;
const MAX_BAR_HEIGHT = 46;

export function DailyPulseStrip({ period, trend }: { period: Period; trend: TrendPoint[] }) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const series = useMemo(() => fillTrendDays(period, trend), [period, trend]);
  const maxValue = useMemo(() => Math.max(...series.flatMap((point) => [point.income, point.expense]), 1), [series]);
  const selected = useMemo(() => series.find((point) => point.date === selectedDate) ?? null, [selectedDate, series]);
  const monthNet = useMemo(() => series.reduce((sum, point) => sum + point.net, 0), [series]);
  const headerLabel = selected ? formatSelectedDate(selected.date) : formatMonth(period);
  const headerValue = selected ? selected.net : monthNet;
  const chartWidth = series.reduce((acc, point, index) => acc + (selectedDate === point.date ? DAY_WIDTH_SELECTED : DAY_WIDTH) + (index === 0 ? 0 : GAP), 0);

  function handlePress(point: TrendPoint) {
    if (selectedDate === point.date) {
      const query = new URLSearchParams({
        year: String(period.year),
        month: String(period.month),
        date: point.date
      });

      router.push(`/movimientos?${query.toString()}`);
      return;
    }

    setSelectedDate(point.date);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-[15px] font-medium text-white/82">{headerLabel}</p>
        <p className={`shrink-0 text-[15px] font-medium ${headerValue >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
          {headerValue > 0 ? '+' : headerValue < 0 ? '-' : ''}
          {formatCurrency(Math.abs(headerValue))}
        </p>
      </div>

      <div className="scrollbar-none -mx-1 overflow-x-auto pb-1">
        <div className="relative px-1" style={{ width: `${chartWidth}px`, minWidth: '100%' }}>
          <div className="pointer-events-none absolute inset-x-1 top-[58px] border-t border-white/[0.06]" />
          <div className="flex items-end" style={{ gap: `${GAP}px` }}>
            {series.map((point) => {
              const selectedPoint = selectedDate === point.date;
              const width = selectedPoint ? DAY_WIDTH_SELECTED : DAY_WIDTH;
              const incomeHeight = scaleHeight(point.income, maxValue);
              const expenseHeight = scaleHeight(point.expense, maxValue);
              const parts = formatChartDay(point.date);

              return (
                <button
                  key={point.date}
                  type="button"
                  onClick={() => handlePress(point)}
                  className="group shrink-0 text-left"
                  style={{ width: `${width}px` }}
                  aria-label={selectedPoint ? `Abrir movimientos del ${formatSelectedDate(point.date)}` : `Seleccionar ${formatSelectedDate(point.date)}`}
                >
                  <div className="relative" style={{ height: `${CHART_HEIGHT}px` }}>
                    {selectedPoint && (point.income > 0 || point.expense > 0) ? (
                      <div
                        className={`absolute left-1/2 z-10 -translate-x-1/2 rounded-full px-2 py-1 text-[11px] font-medium leading-none backdrop-blur-md ${point.net >= 0 ? 'bg-emerald-500/16 text-emerald-300' : 'bg-rose-500/16 text-rose-300'}`}
                        style={{ top: `${getBadgeTop(point, maxValue)}px` }}
                      >
                        {point.net > 0 ? '+' : point.net < 0 ? '-' : ''}
                        {formatCompactCurrency(Math.abs(point.net))}
                      </div>
                    ) : null}

                    <div className="absolute left-1/2 top-0 flex -translate-x-1/2 items-end gap-1.5" style={{ height: `${BASELINE_OFFSET}px` }}>
                      <div
                        className={`rounded-[999px] bg-[linear-gradient(180deg,rgba(145,214,255,0.95),rgba(73,126,255,0.76))] transition-all duration-300 ${selectedPoint ? 'w-[7px] shadow-[0_10px_18px_rgba(73,126,255,0.22)]' : 'w-[5px]'} ${point.income === 0 ? 'opacity-20' : ''}`}
                        style={{ height: `${incomeHeight}px` }}
                      />
                    </div>

                    <div className="absolute left-1/2 top-[58px] flex -translate-x-1/2 items-start gap-1.5" style={{ height: `${CHART_HEIGHT - BASELINE_OFFSET}px` }}>
                      <div
                        className={`rounded-[999px] bg-[linear-gradient(180deg,rgba(255,175,186,0.96),rgba(255,96,129,0.82))] transition-all duration-300 ${selectedPoint ? 'w-[7px] shadow-[0_10px_18px_rgba(255,96,129,0.18)]' : 'w-[5px]'} ${point.expense === 0 ? 'opacity-20' : ''}`}
                        style={{ height: `${expenseHeight}px` }}
                      />
                    </div>
                  </div>

                  <div className={`mt-3 flex min-h-[30px] flex-col items-center justify-start text-center text-[11px] leading-4 transition-colors ${selectedPoint ? 'text-white' : 'text-white/48 group-hover:text-white/78'}`}>
                    <span>{parts.day}</span>
                    <span>{parts.month}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function fillTrendDays(period: Period, trend: TrendPoint[]) {
  const byDate = new Map(trend.map((point) => [point.date, point]));
  const totalDays = new Date(period.year, period.month, 0).getDate();

  return Array.from({ length: totalDays }, (_, index) => {
    const date = `${period.year}-${String(period.month).padStart(2, '0')}-${String(index + 1).padStart(2, '0')}`;
    return byDate.get(date) ?? { date, income: 0, expense: 0, net: 0, runningBalance: 0 };
  });
}

function scaleHeight(value: number, maxValue: number) {
  if (value <= 0) return 4;
  return Math.max(10, Math.round((value / maxValue) * MAX_BAR_HEIGHT));
}

function getBadgeTop(point: TrendPoint, maxValue: number) {
  const height = Math.max(scaleHeight(point.income, maxValue), scaleHeight(point.expense, maxValue));
  return Math.max(6, BASELINE_OFFSET - height - 28);
}

function formatChartDay(value: string) {
  const formatted = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short' })
    .format(new Date(`${value}T00:00:00`))
    .replace('.', '')
    .toLowerCase();
  const [day, month] = formatted.split(' ');
  return { day, month };
}

function formatSelectedDate(value: string) {
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'long'
  })
    .format(new Date(`${value}T00:00:00`))
    .replace(',', '')
    .toLowerCase();
}

function formatMonth(period: Period) {
  return new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' })
    .format(new Date(period.year, period.month - 1, 1))
    .toLowerCase();
}

function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(value);
}
