'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import type { TrendPoint } from '@/lib/domain/types';
import { formatCurrency } from '@/lib/utils/currency';

type Period = {
  year: number;
  month: number;
};

const ITEM_COLLAPSED_WIDTH = 32;
const ITEM_EXPANDED_WIDTH = 54;
const TRACK_COLLAPSED_WIDTH = 12;
const TRACK_EXPANDED_WIDTH = 28;
const COLUMN_GAP = 10;
const TRACK_HEIGHT = 152;
const ZERO_LINE_Y = TRACK_HEIGHT / 2;
const BAR_MAX_HEIGHT = 46;
const BAR_MIN_HEIGHT = 8;
const LABEL_HEIGHT = 24;

export function DailyFlowChart({ trend, period, openingBalance }: { trend: TrendPoint[]; period: Period; openingBalance: number }) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const selectedPoint = useMemo(
    () => trend.find((point) => point.date === selectedDate) ?? null,
    [selectedDate, trend]
  );

  const monthNet = useMemo(
    () => trend.reduce((sum, point) => sum + point.net, 0),
    [trend]
  );

  const maxDailyMagnitude = Math.max(...trend.map((point) => Math.abs(point.net)), 1);
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

      <div className="rounded-[24px] border border-white/[0.08] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.035),_transparent_60%),linear-gradient(180deg,rgba(255,255,255,0.022),rgba(255,255,255,0.01))] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
        <div className="mb-4 flex min-h-7 items-center justify-between gap-3">
          <p className="truncate text-[15px] font-medium text-white/78">
            {selectedPoint ? formatSelectedDate(selectedPoint.date) : formatMonthCaption(period.year, period.month)}
          </p>
          <p className={`shrink-0 text-[15px] font-semibold ${getValueTone((selectedPoint?.net ?? monthNet))}`}>
            {formatSignedCompactCurrency(selectedPoint?.net ?? monthNet)}
          </p>
        </div>

        <div className="scrollbar-none -mx-1 overflow-x-auto pb-1">
          <div className="relative px-1" style={{ width: `${chartWidth}px` }}>
            <div className="pointer-events-none absolute left-0 right-0 z-0 h-px bg-white/[0.07]" style={{ top: `${ZERO_LINE_Y}px` }} />

            <div className="relative z-10 flex items-end" style={{ gap: `${COLUMN_GAP}px` }}>
              {trend.map((point) => {
                const isSelected = selectedDate === point.date;
                const hasMovement = point.income > 0 || point.expense > 0;
                const isPositive = point.net > 0;
                const isNegative = point.net < 0;
                const magnitudeRatio = Math.abs(point.net) / maxDailyMagnitude;
                const barHeight = hasMovement ? Math.max(BAR_MIN_HEIGHT, Math.round(magnitudeRatio * BAR_MAX_HEIGHT)) : 0;
                const dateParts = formatChartDateParts(point.date);

                return (
                  <button
                    key={point.date}
                    type="button"
                    onClick={() => handleSelect(point)}
                    className="group flex shrink-0 flex-col items-center"
                    style={{ width: `${isSelected ? ITEM_EXPANDED_WIDTH : ITEM_COLLAPSED_WIDTH}px` }}
                    aria-pressed={isSelected}
                    aria-label={selectedPoint?.date === point.date ? `Abrir movimientos del ${formatSelectedDate(point.date)}` : `Seleccionar ${formatSelectedDate(point.date)}`}
                  >
                    <div className="relative" style={{ width: `${isSelected ? ITEM_EXPANDED_WIDTH : ITEM_COLLAPSED_WIDTH}px`, height: `${TRACK_HEIGHT}px` }}>
                      {isSelected && hasMovement ? (
                        <div
                          className={`pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 rounded-full px-2 py-1 text-[11px] font-semibold leading-none backdrop-blur-md ${
                            point.net >= 0 ? 'bg-emerald-500/16 text-emerald-300' : 'bg-rose-500/16 text-rose-300'
                          }`}
                          style={{ top: `${getLabelTop(point.net)}px` }}
                        >
                          {formatSignedCompactCurrency(point.net)}
                        </div>
                      ) : null}

                      <div
                        className={`absolute left-1/2 top-0 h-full -translate-x-1/2 overflow-hidden rounded-full border transition-all duration-300 ease-out ${
                          isSelected
                            ? 'border-white/[0.16] bg-white/[0.045] shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_10px_24px_rgba(3,10,26,0.28)]'
                            : 'border-white/[0.08] bg-white/[0.02]'
                        }`}
                        style={{ width: `${isSelected ? TRACK_EXPANDED_WIDTH : TRACK_COLLAPSED_WIDTH}px` }}
                      >
                        <div className="absolute left-1/2 top-6 bottom-6 w-px -translate-x-1/2 bg-white/[0.05]" />

                        {hasMovement ? (
                          <>
                            {isPositive ? (
                              <div
                                className={`absolute left-1/2 bottom-1/2 -translate-x-1/2 rounded-full bg-[linear-gradient(180deg,rgba(168,211,255,0.98),rgba(84,130,255,0.7))] shadow-[0_10px_24px_rgba(76,124,255,0.26)] transition-all duration-300 ease-out ${
                                  isSelected ? 'w-[22px]' : 'w-[10px]'
                                }`}
                                style={{ height: `${barHeight}px` }}
                              />
                            ) : null}

                            {isNegative ? (
                              <div
                                className={`absolute left-1/2 top-1/2 -translate-x-1/2 rounded-full bg-[linear-gradient(180deg,rgba(255,184,201,0.98),rgba(255,93,127,0.7))] shadow-[0_10px_24px_rgba(255,88,121,0.22)] transition-all duration-300 ease-out ${
                                  isSelected ? 'w-[22px]' : 'w-[10px]'
                                }`}
                                style={{ height: `${barHeight}px` }}
                              />
                            ) : null}
                          </>
                        ) : (
                          <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.14] transition-all duration-300 ${isSelected ? 'h-2.5 w-2.5' : 'h-1.5 w-1.5'}`} />
                        )}
                      </div>
                    </div>

                    <span
                      className={`mt-3 flex min-h-[38px] flex-col items-center justify-start text-center text-[11px] leading-4 transition-colors ${
                        hasMovement ? 'text-white/62' : 'text-white/30'
                      } ${isSelected ? 'text-white' : 'group-hover:text-white/78'}`}
                      style={{ width: `${Math.max(36, isSelected ? ITEM_EXPANDED_WIDTH : ITEM_COLLAPSED_WIDTH)}px` }}
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
    </div>
  );
}

function getLabelTop(net: number) {
  if (net >= 0) {
    return ZERO_LINE_Y + 8;
  }

  return ZERO_LINE_Y - LABEL_HEIGHT - 8;
}

function getValueTone(value: number) {
  if (value > 0) return 'text-emerald-300';
  if (value < 0) return 'text-rose-300';
  return 'text-white/62';
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

function formatMonthCaption(year: number, month: number) {
  return new Intl.DateTimeFormat('es-ES', {
    month: 'long',
    year: 'numeric'
  }).format(new Date(year, month - 1, 1));
}

function formatSignedCompactCurrency(value: number) {
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';
  return `${sign}${new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(Math.abs(value))}`;
}
