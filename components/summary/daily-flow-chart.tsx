'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import type { TrendPoint } from '@/lib/domain/types';
import { formatCurrency } from '@/lib/utils/currency';

type Period = {
  year: number;
  month: number;
};

const ITEM_COLLAPSED_WIDTH = 34;
const ITEM_EXPANDED_WIDTH = 58;
const TRACK_COLLAPSED_WIDTH = 22;
const TRACK_EXPANDED_WIDTH = 42;
const COLUMN_GAP = 10;
const CHART_HEIGHT = 166;
const BAR_MAX_HEIGHT = 52;
const BAR_MIN_HEIGHT = 8;
const ZERO_LINE_Y = CHART_HEIGHT / 2;
const LABEL_HEIGHT = 24;

export function DailyFlowChart({ trend, period, openingBalance }: { trend: TrendPoint[]; period: Period; openingBalance: number }) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const selectedPoint = useMemo(
    () => trend.find((point) => point.date === selectedDate) ?? null,
    [selectedDate, trend]
  );

  const maxDailyMagnitude = Math.max(...trend.map((point) => Math.abs(point.net)), 1);
  const monthNet = trend.reduce((sum, point) => sum + point.net, 0);
  const chartWidth = trend.reduce((sum, point, index) => {
    const itemWidth = selectedDate === point.date ? ITEM_EXPANDED_WIDTH : ITEM_COLLAPSED_WIDTH;
    return sum + itemWidth + (index === 0 ? 0 : COLUMN_GAP);
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-white/58">
        <span>Evolución del saldo</span>
        <span>Desde {formatCurrency(openingBalance)}</span>
      </div>

      <div className="rounded-[26px] border border-white/8 bg-white/[0.028] px-4 pb-4 pt-4 sm:px-5">
        <div className="mb-4 flex items-center justify-between gap-3 text-[13px] leading-5">
          <p className="truncate text-white/70">{selectedPoint ? formatSelectedDate(selectedPoint.date) : formatMonthTitle(period.year, period.month)}</p>
          <p className={`shrink-0 font-medium ${selectedPoint ? (selectedPoint.net >= 0 ? 'text-emerald-300' : 'text-rose-300') : monthNet >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
            {formatSignedCurrency(selectedPoint ? selectedPoint.net : monthNet)}
          </p>
        </div>

        <div className="scrollbar-none -mx-1 overflow-x-auto pb-1">
          <div className="flex items-end px-1" style={{ gap: `${COLUMN_GAP}px`, width: `${chartWidth}px` }}>
            {trend.map((point) => {
              const isSelected = selectedDate === point.date;
              const hasMovement = point.income > 0 || point.expense > 0;
              const isPositive = point.net > 0;
              const isNegative = point.net < 0;
              const magnitudeRatio = Math.abs(point.net) / maxDailyMagnitude;
              const barHeight = hasMovement ? Math.max(BAR_MIN_HEIGHT, Math.round(magnitudeRatio * BAR_MAX_HEIGHT)) : 0;
              const itemWidth = isSelected ? ITEM_EXPANDED_WIDTH : ITEM_COLLAPSED_WIDTH;
              const trackWidth = isSelected ? TRACK_EXPANDED_WIDTH : TRACK_COLLAPSED_WIDTH;
              const dateParts = formatChartDateParts(point.date);

              return (
                <button
                  key={point.date}
                  type="button"
                  onClick={() => handleSelect(point)}
                  className="group flex shrink-0 flex-col items-center"
                  style={{ width: `${itemWidth}px` }}
                  aria-pressed={isSelected}
                  aria-label={isSelected ? `Abrir movimientos del ${formatSelectedDate(point.date)}` : `Seleccionar ${formatSelectedDate(point.date)}`}
                >
                  <div
                    className={`relative rounded-[20px] border transition-all duration-250 ease-out ${
                      isSelected
                        ? 'border-white/18 bg-white/[0.05] shadow-[0_10px_28px_rgba(7,12,28,0.26),inset_0_0_0_1px_rgba(255,255,255,0.03)]'
                        : 'border-white/7 bg-white/[0.02]'
                    }`}
                    style={{
                      width: `${trackWidth}px`,
                      height: `${CHART_HEIGHT}px`
                    }}
                  >
                    <div className="absolute left-1/2 top-3 bottom-3 w-px -translate-x-1/2 bg-white/[0.055]" />
                    <div className="absolute inset-x-1 top-1/2 h-px -translate-y-1/2 bg-white/[0.08]" />

                    {hasMovement ? (
                      <>
                        {isPositive ? (
                          <div
                            className={`absolute left-1/2 bottom-1/2 -translate-x-1/2 rounded-full bg-[linear-gradient(180deg,rgba(160,208,255,1),rgba(77,124,255,0.62))] shadow-[0_10px_24px_rgba(76,124,255,0.24)] transition-all duration-250 ${
                              isSelected ? 'w-[28px]' : 'w-[14px]'
                            }`}
                            style={{ height: `${barHeight}px` }}
                          />
                        ) : null}

                        {isNegative ? (
                          <div
                            className={`absolute left-1/2 top-1/2 -translate-x-1/2 rounded-full bg-[linear-gradient(180deg,rgba(255,180,199,1),rgba(255,86,118,0.65))] shadow-[0_10px_24px_rgba(255,88,121,0.22)] transition-all duration-250 ${
                              isSelected ? 'w-[28px]' : 'w-[14px]'
                            }`}
                            style={{ height: `${barHeight}px` }}
                          />
                        ) : null}
                      </>
                    ) : (
                      <div
                        className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.16] transition-all duration-250 ${
                          isSelected ? 'h-2.5 w-2.5' : 'h-1.5 w-1.5'
                        }`}
                      />
                    )}

                    {isSelected && hasMovement ? (
                      <div
                        className={`absolute left-1/2 z-10 -translate-x-1/2 rounded-full px-2.5 py-1 text-[11px] font-medium leading-none backdrop-blur-md ${
                          point.net >= 0 ? 'bg-emerald-500/16 text-emerald-300' : 'bg-rose-500/16 text-rose-300'
                        }`}
                        style={{ top: `${getLabelTop(point.net)}px`, height: `${LABEL_HEIGHT}px` }}
                      >
                        {formatSignedShortCurrency(point.net)}
                      </div>
                    ) : null}
                  </div>

                  <span
                    className={`mt-3 flex min-h-[34px] flex-col items-center justify-start text-center text-[11px] leading-4 transition-colors ${
                      hasMovement ? 'text-white/58' : 'text-white/30'
                    } ${isSelected ? 'text-white' : 'group-hover:text-white/82'}`}
                    style={{ width: `${itemWidth}px` }}
                  >
                    <span>{dateParts.day}</span>
                    <span>{dateParts.month}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function getLabelTop(net: number) {
  if (net >= 0) {
    return ZERO_LINE_Y + 12;
  }

  return ZERO_LINE_Y - LABEL_HEIGHT - 12;
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

function formatMonthTitle(year: number, month: number) {
  return new Intl.DateTimeFormat('es-ES', {
    month: 'long',
    year: 'numeric'
  }).format(new Date(year, month - 1, 1));
}

function formatSignedCurrency(value: number) {
  return `${value > 0 ? '+' : value < 0 ? '-' : ''}${formatCurrency(Math.abs(value))}`;
}

function formatSignedShortCurrency(value: number) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(value);
}
