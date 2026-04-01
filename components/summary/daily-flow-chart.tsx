'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, TrendingDown, TrendingUp } from 'lucide-react';

import type { TrendPoint } from '@/lib/domain/types';
import { formatCurrency } from '@/lib/utils/currency';

type Period = {
  year: number;
  month: number;
};

export function DailyFlowChart({ trend, period, openingBalance }: { trend: TrendPoint[]; period: Period; openingBalance: number }) {
  const latestActiveDate = useMemo(() => {
    const latestWithMovement = [...trend].reverse().find((point) => point.income > 0 || point.expense > 0);
    return latestWithMovement?.date ?? trend.at(-1)?.date ?? '';
  }, [trend]);

  const [selectedDate, setSelectedDate] = useState(latestActiveDate);

  useEffect(() => {
    setSelectedDate(latestActiveDate);
  }, [latestActiveDate, period.month, period.year]);

  const selectedPoint = trend.find((point) => point.date === selectedDate) ?? trend.at(-1);
  const maxDailyMagnitude = Math.max(...trend.map((point) => Math.abs(point.net)), 1);

  const movementHref = selectedPoint
    ? {
        pathname: '/movimientos',
        query: {
          year: String(period.year),
          month: String(period.month),
          date: selectedPoint.date
        }
      }
    : {
        pathname: '/movimientos',
        query: {
          year: String(period.year),
          month: String(period.month)
        }
      };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-white/58">
        <span>Flujo diario</span>
        <span>Desde {formatCurrency(openingBalance)}</span>
      </div>

      {selectedPoint ? (
        <div className="rounded-[24px] border border-white/8 bg-white/[0.035] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-white/36">Día seleccionado</p>
              <p className="mt-2 text-sm text-white/62">{formatLongDate(selectedPoint.date)}</p>
            </div>
            <Link
              href={movementHref}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/74 transition hover:bg-white/[0.08]"
            >
              Ver movimientos
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <DetailPill
              label="Neto"
              value={formatSignedCurrency(selectedPoint.net)}
              tone={selectedPoint.net > 0 ? 'income' : selectedPoint.net < 0 ? 'expense' : 'neutral'}
              icon={selectedPoint.net >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            />
            <DetailPill label="Ingresos" value={formatCurrency(selectedPoint.income)} tone="income" />
            <DetailPill label="Gastos" value={formatCurrency(selectedPoint.expense)} tone="expense" />
          </div>
        </div>
      ) : null}

      <div className="-mx-1 overflow-x-auto pb-2 scrollbar-none">
        <div className="flex min-w-max items-end gap-2 px-1">
          {trend.map((point) => {
            const magnitudeRatio = Math.abs(point.net) / maxDailyMagnitude;
            const fillHeight = point.net === 0 ? 8 : Math.max(18, Math.round(magnitudeRatio * 64));
            const isPositive = point.net > 0;
            const isNegative = point.net < 0;
            const isSelected = point.date === selectedDate;
            const hasMovement = point.income > 0 || point.expense > 0;

            return (
              <button
                key={point.date}
                type="button"
                onClick={() => setSelectedDate(point.date)}
                className="group flex w-[26px] shrink-0 flex-col items-center gap-2"
                aria-label={`Seleccionar ${formatLongDate(point.date)}`}
              >
                <div
                  className={`relative h-44 w-full overflow-hidden rounded-[18px] border bg-white/[0.035] transition ${
                    isSelected
                      ? 'border-white/16 bg-white/[0.06] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]'
                      : 'border-white/6 group-hover:border-white/12 group-hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="absolute left-1/2 top-2 bottom-2 w-px -translate-x-1/2 bg-white/[0.04]" />
                  <div className="absolute inset-x-[5px] top-1/2 h-px -translate-y-1/2 bg-white/[0.1]" />

                  {hasMovement ? (
                    <>
                      {isPositive ? (
                        <div
                          className="absolute left-1/2 bottom-1/2 w-[12px] -translate-x-1/2 rounded-full bg-[linear-gradient(180deg,rgba(145,200,255,0.98),rgba(82,126,255,0.52))] shadow-[0_12px_26px_rgba(76,124,255,0.34)]"
                          style={{ height: `${fillHeight}px` }}
                        />
                      ) : null}

                      {isNegative ? (
                        <div
                          className="absolute left-1/2 top-1/2 w-[12px] -translate-x-1/2 rounded-full bg-[linear-gradient(180deg,rgba(255,160,188,0.98),rgba(255,78,114,0.52))] shadow-[0_12px_26px_rgba(255,88,121,0.28)]"
                          style={{ height: `${fillHeight}px` }}
                        />
                      ) : null}

                      {isSelected ? (
                        <div
                          className={`absolute left-1/2 -translate-x-1/2 rounded-full px-2 py-1 text-[10px] font-medium backdrop-blur-sm ${
                            isPositive
                              ? 'bottom-[calc(50%+8px)] mb-[var(--label-offset)] bg-emerald-500/12 text-emerald-300'
                              : isNegative
                                ? 'top-[calc(50%+8px)] mt-[var(--label-offset)] bg-rose-500/12 text-rose-300'
                                : 'top-1/2 -translate-y-1/2 bg-white/8 text-white/60'
                          }`}
                          style={{ ['--label-offset' as string]: `${Math.min(fillHeight + 6, 70)}px` }}
                        >
                          {formatCompactSigned(point.net)}
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <div className={`absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${isSelected ? 'bg-white/40' : 'bg-white/[0.13]'}`} />
                  )}
                </div>

                <span className={`text-center text-[11px] leading-4 ${isSelected ? 'text-white/78' : hasMovement ? 'text-white/54' : 'text-white/28'}`}>
                  {formatChartDate(point.date)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DetailPill({
  label,
  value,
  tone,
  icon
}: {
  label: string;
  value: string;
  tone: 'income' | 'expense' | 'neutral';
  icon?: ReactNode;
}) {
  const toneClass = tone === 'income' ? 'text-emerald-300' : tone === 'expense' ? 'text-rose-300' : 'text-white/72';
  const iconClass = tone === 'income' ? 'bg-emerald-500/12 text-emerald-300' : tone === 'expense' ? 'bg-rose-500/12 text-rose-300' : 'bg-white/[0.06] text-white/64';

  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
      <div className="flex items-center gap-2">
        {icon ? <span className={`inline-flex rounded-full p-1.5 ${iconClass}`}>{icon}</span> : null}
        <p className="text-[11px] uppercase tracking-[0.18em] text-white/36">{label}</p>
      </div>
      <p className={`mt-2 text-sm font-medium ${toneClass}`}>{value}</p>
    </div>
  );
}

function formatChartDate(value: string) {
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short' })
    .format(new Date(`${value}T00:00:00`))
    .replace('.', '');
}

function formatLongDate(value: string) {
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'short',
    day: '2-digit',
    month: 'long'
  })
    .format(new Date(`${value}T00:00:00`))
    .replace(',', '');
}

function formatSignedCurrency(value: number) {
  const amount = formatCurrency(Math.abs(value));
  if (value > 0) return `+${amount}`;
  if (value < 0) return `-${amount}`;
  return amount;
}

function formatCompactSigned(value: number) {
  if (value === 0) return '0 €';

  const absolute = Math.abs(value);
  const output = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    notation: absolute >= 1000 ? 'compact' : 'standard'
  }).format(absolute);

  return `${value > 0 ? '+' : '-'}${output}`;
}
