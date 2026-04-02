'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import type { TrendPoint } from '@/lib/domain/types';
import { formatCurrency } from '@/lib/utils/currency';

type Period = {
  year: number;
  month: number;
};

const SLOT_WIDTH = 44;
const COLUMN_GAP = 8;
const CHART_HEIGHT = 164;
const BAR_MAX_HEIGHT = 58;
const BAR_MIN_HEIGHT = 12;
const ZERO_LINE_Y = CHART_HEIGHT / 2;

export function DailyFlowChart({ trend, period, openingBalance }: { trend: TrendPoint[]; period: Period; openingBalance: number }) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const selectedPoint = useMemo(
    () => trend.find((point) => point.date === selectedDate) ?? null,
    [selectedDate, trend]
  );

  const maxDailyMagnitude = Math.max(...trend.map((point) => Math.abs(point.net)), 1);
  const chartWidth = trend.length * SLOT_WIDTH + Math.max(0, trend.length - 1) * COLUMN_GAP;

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

      <div className="rounded-[24px] border border-white/8 bg-white/[0.028] p-4">
        <div className="mb-3 min-h-6 text-[12px] leading-5">
          {selectedPoint ? (
            <div className="flex items-center justify-between gap-3">
              <p className="truncate text-white/72">{formatSelectedDate(selectedPoint.date)}</p>
              <p className={`shrink-0 font-medium ${selectedPoint.net >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                {selectedPoint.net > 0 ? '+' : selectedPoint.net < 0 ? '-' : ''}
                {formatCurrency(Math.abs(selectedPoint.net))}
              </p>
            </div>
          ) : (
            <p className="text-white/40">Toca un día para ver su neto, vuelve a tocar para abrir Movimientos.</p>
          )}
        </div>

        <div className="scrollbar-none -mx-1 overflow-x-auto pb-1">
          <div className="flex items-end px-1" style={{ gap: `${COLUMN_GAP}px`, width: `${chartWidth}px` }}>
            {trend.map((point) => {
              const isSelected = selectedDate === point.date;
              const hasMovement = point.income > 0 || point.expense > 0;
              const isPositive = point.net > 0;
              const isNegative = point.net < 0;
              const magnitudeRatio = Math.abs(point.net) / maxDailyMagnitude;
              const barHeight = hasMovement ? Math.max(BAR_MIN_HEIGHT, Math.round(magnitudeRatio * BAR_MAX_HEIGHT)) : 8;
              const dateParts = formatChartDateParts(point.date);

              return (
                <button
                  key={point.date}
                  type="button"
                  onClick={() => handleSelect(point)}
                  className="group flex shrink-0 flex-col items-center"
                  style={{ width: `${SLOT_WIDTH}px` }}
                  aria-label={selectedPoint?.date === point.date ? `Abrir movimientos del ${formatSelectedDate(point.date)}` : `Seleccionar ${formatSelectedDate(point.date)}`}
                >
                  <div
                    className={`relative w-full overflow-hidden rounded-[18px] border bg-white/[0.03] transition-all duration-200 ease-out ${
                      isSelected
                        ? 'scale-x-[1.08] border-white/18 bg-white/[0.055] shadow-[0_8px_24px_rgba(7,12,28,0.24),inset_0_0_0_1px_rgba(255,255,255,0.03)]'
                        : 'border-white/7'
                    }`}
                    style={{ height: `${CHART_HEIGHT}px` }}
                  >
                    <div className="absolute left-1/2 top-3 bottom-3 w-px -translate-x-1/2 bg-white/[0.05]" />
                    <div className="absolute inset-x-2 top-1/2 h-px -translate-y-1/2 bg-white/[0.08]" />

                    {hasMovement ? (
                      <>
                        {isPositive ? (
                          <div
                            className={`absolute left-1/2 bottom-1/2 -translate-x-1/2 rounded-full bg-[linear-gradient(180deg,rgba(160,208,255,0.98),rgba(77,124,255,0.6))] shadow-[0_10px_24px_rgba(76,124,255,0.24)] transition-all duration-200 ${isSelected ? 'w-[18px]' : 'w-[14px]'}`}
                            style={{ height: `${barHeight}px` }}
                          />
                        ) : null}

                        {isNegative ? (
                          <div
                            className={`absolute left-1/2 top-1/2 -translate-x-1/2 rounded-full bg-[linear-gradient(180deg,rgba(255,180,199,0.98),rgba(255,86,118,0.6))] shadow-[0_10px_24px_rgba(255,88,121,0.2)] transition-all duration-200 ${isSelected ? 'w-[18px]' : 'w-[14px]'}`}
                            style={{ height: `${barHeight}px` }}
                          />
                        ) : null}
                      </>
                    ) : (
                      <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.16] transition-all duration-200 ${isSelected ? 'h-2.5 w-2.5' : 'h-1.5 w-1.5'}`} />
                    )}

                    {isSelected && hasMovement ? (
                      <div
                        className={`absolute left-1/2 z-10 -translate-x-1/2 rounded-full px-2 py-1 text-[11px] font-medium leading-none backdrop-blur-md ${
                          point.net >= 0 ? 'bg-emerald-500/16 text-emerald-300' : 'bg-rose-500/16 text-rose-300'
                        }`}
                        style={{ top: `${getLabelTop(point.net, barHeight)}px` }}
                      >
                        {point.net > 0 ? '+' : point.net < 0 ? '-' : ''}
                        {formatCompactCurrency(Math.abs(point.net))}
                      </div>
                    ) : null}
                  </div>

                  <span className={`mt-3 flex min-h-[34px] flex-col items-center justify-start text-center text-[11px] leading-4 transition-colors ${hasMovement ? 'text-white/58' : 'text-white/30'} ${isSelected ? 'text-white' : 'group-hover:text-white/82'}`}>
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

function getLabelTop(net: number, barHeight: number) {
  const pillHeight = 24;

  if (net >= 0) {
    const centerY = ZERO_LINE_Y - barHeight / 2;
    return clamp(centerY - pillHeight / 2, 12, ZERO_LINE_Y - pillHeight - 6);
  }

  const centerY = ZERO_LINE_Y + barHeight / 2;
  return clamp(centerY - pillHeight / 2, ZERO_LINE_Y + 6, CHART_HEIGHT - pillHeight - 12);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
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
