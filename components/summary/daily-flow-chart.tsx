'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import type { TrendPoint } from '@/lib/domain/types';
import { formatCurrency } from '@/lib/utils/currency';

type Period = {
  year: number;
  month: number;
};

const DAY_WIDTH = 58;
const DAY_WIDTH_SELECTED = 74;
const DAY_GAP = 12;
const CHART_HEIGHT = 208;
const GRID_LINES = 4;
const MAX_BAR_HEIGHT = 126;
const MIN_BAR_HEIGHT = 8;

export function DailyFlowChart({ trend, period, openingBalance }: { trend: TrendPoint[]; period: Period; openingBalance: number }) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSelectedDate(null);
    setReady(false);

    const frame = window.requestAnimationFrame(() => {
      setReady(true);

      const container = scrollRef.current;
      if (!container) return;

      container.scrollLeft = container.scrollWidth - container.clientWidth;
    });

    return () => window.cancelAnimationFrame(frame);
  }, [period.month, period.year, trend.length]);

  const selectedPoint = useMemo(
    () => trend.find((point) => point.date === selectedDate) ?? null,
    [selectedDate, trend]
  );

  const monthNet = useMemo(() => trend.reduce((sum, point) => sum + point.net, 0), [trend]);
  const monthLabel = useMemo(
    () => new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(new Date(period.year, period.month - 1, 1)),
    [period.month, period.year]
  );

  const maxValue = Math.max(...trend.flatMap((point) => [point.income, point.expense]), 1);

  const chartWidth = trend.reduce((sum, point, index) => {
    return sum + (selectedDate === point.date ? DAY_WIDTH_SELECTED : DAY_WIDTH) + (index === 0 ? 0 : DAY_GAP);
  }, 0);

  function handleSelect(point: TrendPoint) {
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

  const headerLabel = selectedPoint ? formatSelectedDate(selectedPoint.date) : monthLabel.toLowerCase();
  const headerValue = selectedPoint ? selectedPoint.net : monthNet;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm text-text-muted">
        <span>Evolución del saldo</span>
        <span className="tnum">Desde {formatCurrency(openingBalance)}</span>
      </div>

      <div className="rounded-lg border border-border bg-surface-2 p-5">
        <div className="mb-4 flex items-start justify-between gap-4">
          <p className="text-[15px] font-medium text-text">{headerLabel}</p>
          <p className={`tnum shrink-0 text-[15px] font-medium ${headerValue >= 0 ? 'text-pos' : 'text-neg'}`}>
            {headerValue > 0 ? '+' : headerValue < 0 ? '-' : ''}{formatCurrency(Math.abs(headerValue))}
          </p>
        </div>

        <div ref={scrollRef} className="scrollbar-none -mx-1 overflow-x-auto pb-1">
          <div className="relative px-1" style={{ width: `${chartWidth}px`, height: `${CHART_HEIGHT + 44}px` }}>
            <div className="pointer-events-none absolute inset-x-1 top-4" style={{ height: `${CHART_HEIGHT - 18}px` }}>
              {Array.from({ length: GRID_LINES }).map((_, index) => {
                const ratio = index / (GRID_LINES - 1);
                const top = ratio * (CHART_HEIGHT - 28);
                return (
                  <div
                    key={index}
                    className="absolute inset-x-0 border-t border-dashed border-white/[0.05]"
                    style={{ top: `${top}px` }}
                  />
                );
              })}
            </div>

            <div className="flex items-end" style={{ gap: `${DAY_GAP}px` }}>
              {trend.map((point, index) => {
                const isSelected = selectedDate === point.date;
                const dayWidth = isSelected ? DAY_WIDTH_SELECTED : DAY_WIDTH;
                const incomeHeight = getBarHeight(point.income, maxValue);
                const expenseHeight = getBarHeight(point.expense, maxValue);
                const dateParts = formatChartDateParts(point.date);
                const groupHasData = point.income > 0 || point.expense > 0;
                const delay = `${Math.min(index * 18, 280)}ms`;

                return (
                  <button
                    key={point.date}
                    type="button"
                    onClick={() => handleSelect(point)}
                    aria-pressed={isSelected}
                    aria-label={isSelected ? `Abrir movimientos del ${formatSelectedDate(point.date)}` : `Seleccionar ${formatSelectedDate(point.date)}`}
                    className="group shrink-0 text-left"
                    style={{ width: `${dayWidth}px` }}
                  >
                    <div
                      className={`relative rounded-md border transition-all duration-300 ease-out ${
                        isSelected
                          ? 'border-accent bg-accent-soft'
                          : 'border-transparent bg-transparent'
                      }`}
                      style={{ height: `${CHART_HEIGHT}px` }}
                    >
                      {Array.from({ length: GRID_LINES - 1 }).map((_, index) => {
                        const ratio = (index + 1) / GRID_LINES;
                        const top = ratio * (CHART_HEIGHT - 40);
                        return (
                          <div
                            key={index}
                            className="pointer-events-none absolute left-1/2 w-px -translate-x-1/2 bg-white/[0.04]"
                            style={{ top: `${top - 24}px`, height: '48px' }}
                          />
                        );
                      })}

                      {isSelected && groupHasData ? (
                        <div
                          className={`tnum absolute left-1/2 z-10 -translate-x-1/2 rounded-full px-2.5 py-1 text-[11px] font-medium leading-none backdrop-blur-md ${
                            point.net >= 0 ? 'bg-pos-soft text-pos' : 'bg-neg-soft text-neg'
                          }`}
                          style={{ top: `${getNetLabelTop(point, maxValue)}px` }}
                        >
                          {point.net > 0 ? '+' : point.net < 0 ? '-' : ''}
                          {formatCompactCurrency(Math.abs(point.net))}
                        </div>
                      ) : null}

                      <div className="absolute inset-x-0 bottom-6 flex items-end justify-center gap-2">
                        <div
                          className={`bar-pos-v rounded-full transition-[width,transform,opacity] duration-500 ease-out ${
                            isSelected ? 'w-[18px]' : 'w-[14px]'
                          } ${point.income === 0 ? 'opacity-20' : ''}`}
                          style={{
                            height: `${incomeHeight}px`,
                            transform: ready ? 'scaleY(1)' : 'scaleY(0.12)',
                            transformOrigin: 'bottom',
                            transitionDelay: delay
                          }}
                        />
                        <div
                          className={`bar-neg-v rounded-full transition-[width,transform,opacity] duration-500 ease-out ${
                            isSelected ? 'w-[18px]' : 'w-[14px]'
                          } ${point.expense === 0 ? 'opacity-20' : ''}`}
                          style={{
                            height: `${expenseHeight}px`,
                            transform: ready ? 'scaleY(1)' : 'scaleY(0.12)',
                            transformOrigin: 'bottom',
                            transitionDelay: delay
                          }}
                        />
                      </div>
                    </div>

                    <div className={`mt-3 flex min-h-[34px] flex-col items-center justify-start text-center text-[11px] leading-4 transition-colors ${isSelected ? 'text-text' : 'text-text-muted group-hover:text-text'}`}>
                      <span>{dateParts.day}</span>
                      <span>{dateParts.month}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getBarHeight(value: number, maxValue: number) {
  if (value <= 0) {
    return MIN_BAR_HEIGHT;
  }

  return Math.max(18, Math.round((value / maxValue) * MAX_BAR_HEIGHT));
}

function getNetLabelTop(point: TrendPoint, maxValue: number) {
  const incomeHeight = getBarHeight(point.income, maxValue);
  const expenseHeight = getBarHeight(point.expense, maxValue);
  const topHeight = Math.max(incomeHeight, expenseHeight);
  const top = CHART_HEIGHT - 26 - topHeight;

  return Math.max(18, top - 36);
}

function formatChartDateParts(value: string) {
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
    .replace('.', '')
    .toLowerCase();
}

function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(value);
}
