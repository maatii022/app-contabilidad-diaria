'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import type { TrendPoint } from '@/lib/domain/types';
import { formatCurrency } from '@/lib/utils/currency';

type Period = {
  year: number;
  month: number;
};

const DAY_WIDTH = 34;
const DAY_WIDTH_SELECTED = 58;
const DAY_GAP = 12;
const CHART_HEIGHT = 170;
const GRID_LINES = 4;
const BAR_WIDTH = 10;
const BAR_WIDTH_SELECTED = 16;
const MAX_BAR_HEIGHT = 118;

export function DailyFlowChart({ trend, period, openingBalance }: { trend: TrendPoint[]; period: Period; openingBalance: number }) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const selectedPoint = useMemo(
    () => trend.find((point) => point.date === selectedDate) ?? null,
    [selectedDate, trend]
  );

  const monthNet = useMemo(() => trend.reduce((sum, point) => sum + point.net, 0), [trend]);
  const monthLabel = useMemo(
    () => new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(new Date(period.year, period.month - 1, 1)),
    [period.month, period.year]
  );

  const maxValue = Math.max(
    ...trend.flatMap((point) => [point.income, point.expense]),
    1
  );

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

  const headerLabel = selectedPoint ? formatSelectedDate(selectedPoint.date) : monthLabel;
  const headerValue = selectedPoint ? selectedPoint.net : monthNet;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-white/58">
        <span>Evolución del saldo</span>
        <span>Desde {formatCurrency(openingBalance)}</span>
      </div>

      <div className="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.018))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-[15px] font-medium capitalize text-white/78">{headerLabel}</p>
            <div className="mt-2 flex items-center gap-3 text-[12px] text-white/42">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[linear-gradient(180deg,rgba(155,216,255,1),rgba(72,127,255,0.82))] shadow-[0_0_10px_rgba(94,146,255,0.28)]" />
                Ingresos
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[linear-gradient(180deg,rgba(255,184,202,0.96),rgba(255,95,130,0.82))] shadow-[0_0_10px_rgba(255,98,134,0.22)]" />
                Gastos
              </span>
            </div>
          </div>

          <p className={`shrink-0 pt-0.5 text-[15px] font-medium ${headerValue >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
            {headerValue > 0 ? '+' : headerValue < 0 ? '-' : ''}{formatCurrency(Math.abs(headerValue))}
          </p>
        </div>

        <div className="scrollbar-none -mx-1 overflow-x-auto pb-1">
          <div className="relative px-1" style={{ width: `${chartWidth}px` }}>
            <div className="pointer-events-none absolute inset-x-1 top-0" style={{ height: `${CHART_HEIGHT}px` }}>
              {Array.from({ length: GRID_LINES }).map((_, index) => {
                const ratio = index / (GRID_LINES - 1);
                const top = ratio * (CHART_HEIGHT - 12) + 6;
                return (
                  <div
                    key={index}
                    className="absolute inset-x-0 border-t border-dashed border-white/[0.045]"
                    style={{ top: `${top}px` }}
                  />
                );
              })}
            </div>

            <div className="flex items-end" style={{ gap: `${DAY_GAP}px` }}>
              {trend.map((point) => {
                const isSelected = selectedDate === point.date;
                const dayWidth = isSelected ? DAY_WIDTH_SELECTED : DAY_WIDTH;
                const incomeHeight = getBarHeight(point.income, maxValue);
                const expenseHeight = getBarHeight(point.expense, maxValue);
                const dateParts = formatChartDateParts(point.date);
                const groupHasData = point.income > 0 || point.expense > 0;

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
                      className={`relative rounded-[22px] border transition-all duration-300 ease-out ${
                        isSelected
                          ? 'border-white/14 bg-white/[0.04] shadow-[0_14px_36px_rgba(3,8,25,0.24),inset_0_0_0_1px_rgba(255,255,255,0.02)]'
                          : 'border-transparent bg-transparent'
                      }`}
                      style={{ height: `${CHART_HEIGHT}px` }}
                    >
                      <div className="absolute left-1/2 bottom-4 top-4 w-px -translate-x-1/2 bg-white/[0.035]" />

                      {isSelected && groupHasData ? (
                        <div className={`absolute left-1/2 z-10 -translate-x-1/2 rounded-full px-2.5 py-1 text-[11px] font-medium leading-none backdrop-blur-md ${point.net >= 0 ? 'bg-emerald-500/16 text-emerald-300' : 'bg-rose-500/16 text-rose-300'}`}
                          style={{ top: `${getNetLabelTop(point, maxValue)}px` }}
                        >
                          {point.net > 0 ? '+' : point.net < 0 ? '-' : ''}
                          {formatCompactCurrency(Math.abs(point.net))}
                        </div>
                      ) : null}

                      <div className="absolute inset-x-0 bottom-4 flex items-end justify-center gap-1.5">
                        <div
                          className={`rounded-[999px] bg-[linear-gradient(180deg,rgba(155,216,255,1),rgba(72,127,255,0.82))] shadow-[0_10px_24px_rgba(74,123,255,0.22)] transition-all duration-300 ease-out ${
                            isSelected ? 'w-[16px]' : 'w-[10px]'
                          } ${point.income === 0 ? 'opacity-20' : ''}`}
                          style={{ height: `${incomeHeight}px` }}
                        />
                        <div
                          className={`rounded-[999px] bg-[linear-gradient(180deg,rgba(255,184,202,0.96),rgba(255,95,130,0.82))] shadow-[0_10px_24px_rgba(255,98,134,0.18)] transition-all duration-300 ease-out ${
                            isSelected ? 'w-[16px]' : 'w-[10px]'
                          } ${point.expense === 0 ? 'opacity-20' : ''}`}
                          style={{ height: `${expenseHeight}px` }}
                        />
                      </div>
                    </div>

                    <div className={`mt-3 flex min-h-[34px] flex-col items-center justify-start text-center text-[11px] leading-4 transition-colors ${isSelected ? 'text-white' : 'text-white/58 group-hover:text-white/82'}`}>
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
    return 6;
  }

  return Math.max(12, Math.round((value / maxValue) * MAX_BAR_HEIGHT));
}

function getNetLabelTop(point: TrendPoint, maxValue: number) {
  const incomeHeight = getBarHeight(point.income, maxValue);
  const expenseHeight = getBarHeight(point.expense, maxValue);
  const topHeight = Math.max(incomeHeight, expenseHeight);
  const top = CHART_HEIGHT - 4 - topHeight;

  return Math.max(18, top - 26);
}

function formatChartDateParts(value: string) {
  const formatted = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short' })
    .format(new Date(`${value}T00:00:00`))
    .replace('.', '');

  const [day, month] = formatted.split(' ');
  return { day, month };
}

function formatSelectedDate(value: string) {
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'long'
  }).format(new Date(`${value}T00:00:00`));
}

function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(value);
}
