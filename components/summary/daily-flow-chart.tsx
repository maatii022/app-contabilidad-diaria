'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import type { TrendPoint } from '@/lib/domain/types';
import { formatCurrency } from '@/lib/utils/currency';

type Period = {
  year: number;
  month: number;
};

const COLUMN_WIDTH = 34;
const COLUMN_WIDTH_SELECTED = 46;
const COLUMN_GAP = 10;
const CHART_HEIGHT = 188;
const BAR_MAX_HEIGHT = 76;
const BAR_MIN_HEIGHT = 14;

export function DailyFlowChart({ trend, period, openingBalance }: { trend: TrendPoint[]; period: Period; openingBalance: number }) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const selectedPoint = useMemo(
    () => trend.find((point) => point.date === selectedDate) ?? null,
    [selectedDate, trend]
  );

  const maxDailyMagnitude = Math.max(...trend.map((point) => Math.abs(point.net)), 1);
  const chartWidth = trend.reduce(
    (sum, point, index) => sum + (point.date === selectedDate ? COLUMN_WIDTH_SELECTED : COLUMN_WIDTH) + (index === trend.length - 1 ? 0 : COLUMN_GAP),
    0
  );

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
        <div className="mb-3 flex min-h-6 items-center justify-between gap-3 text-[12px] leading-5">
          {selectedPoint ? (
            <>
              <p className="truncate text-white/72">
                {formatSelectedDate(selectedPoint.date)}
              </p>
              <p className={`shrink-0 font-medium ${selectedPoint.net >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                {selectedPoint.net > 0 ? '+' : selectedPoint.net < 0 ? '-' : ''}{formatCurrency(Math.abs(selectedPoint.net))}
              </p>
            </>
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
              const widthClass = isSelected ? 'w-[46px]' : 'w-[34px]';

              return (
                <button
                  key={point.date}
                  type="button"
                  onClick={() => handleSelect(point)}
                  className={`group flex shrink-0 flex-col items-center transition-all duration-200 ease-out ${widthClass}`}
                  aria-label={selectedPoint?.date === point.date ? `Abrir movimientos del ${formatSelectedDate(point.date)}` : `Seleccionar ${formatSelectedDate(point.date)}`}
                >
                  <div
                    className={`relative w-full overflow-hidden rounded-[18px] border bg-white/[0.03] transition-all duration-200 ${
                      isSelected
                        ? 'border-white/16 bg-white/[0.05] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]'
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
                            className={`absolute left-1/2 bottom-1/2 -translate-x-1/2 rounded-full bg-[linear-gradient(180deg,rgba(160,208,255,0.98),rgba(77,124,255,0.6))] shadow-[0_10px_24px_rgba(76,124,255,0.26)] transition-all duration-200 ${isSelected ? 'w-[18px]' : 'w-[14px]'}`}
                            style={{ height: `${barHeight}px` }}
                          />
                        ) : null}

                        {isNegative ? (
                          <div
                            className={`absolute left-1/2 top-1/2 -translate-x-1/2 rounded-full bg-[linear-gradient(180deg,rgba(255,180,199,0.98),rgba(255,86,118,0.6))] shadow-[0_10px_24px_rgba(255,88,121,0.22)] transition-all duration-200 ${isSelected ? 'w-[18px]' : 'w-[14px]'}`}
                            style={{ height: `${barHeight}px` }}
                          />
                        ) : null}
                      </>
                    ) : (
                      <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.16] transition-all duration-200 ${isSelected ? 'h-2.5 w-2.5' : 'h-1.5 w-1.5'}`} />
                    )}

                    {isSelected ? (
                      <div
                        className={`absolute left-1/2 z-10 -translate-x-1/2 rounded-full px-2 py-1 text-[11px] font-medium leading-none backdrop-blur-md ${
                          point.net >= 0
                            ? 'bg-emerald-500/14 text-emerald-300'
                            : 'bg-rose-500/14 text-rose-300'
                        } ${point.net >= 0 ? 'top-3' : 'bottom-3'}`}
                      >
                        {point.net > 0 ? '+' : point.net < 0 ? '-' : ''}
                        {formatCompactCurrency(Math.abs(point.net))}
                      </div>
                    ) : null}
                  </div>

                  <span className={`mt-3 text-center text-[11px] leading-4 transition-colors ${hasMovement ? 'text-white/58' : 'text-white/30'} ${isSelected ? 'text-white' : 'group-hover:text-white/82'}`}>
                    {formatChartDate(point.date)}
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

function formatChartDate(value: string) {
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short' })
    .format(new Date(`${value}T00:00:00`))
    .replace('.', '');
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
