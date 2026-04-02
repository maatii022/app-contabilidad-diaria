'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowRight, ArrowUp, Minus } from 'lucide-react';

import type { TrendPoint } from '@/lib/domain/types';
import { formatCurrency } from '@/lib/utils/currency';
import type { Period } from '@/lib/utils/period';

export function DailyPulseStrip({ period, trend }: { period: Period; trend: TrendPoint[] }) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const rows = useMemo(() => fillTrendDays(period, trend), [period, trend]);
  const maxAbsNet = useMemo(() => Math.max(...rows.map((point) => Math.abs(point.net)), 1), [rows]);

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
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 text-sm">
        <h3 className="text-lg font-semibold text-white">pulso diario</h3>
        <p className="text-white/45">impacto neto por día</p>
      </div>

      <div className="space-y-2">
        {rows.map((point) => {
          const active = point.date === selectedDate;
          const width = point.net === 0 ? 0 : Math.max(10, (Math.abs(point.net) / maxAbsNet) * 100);
          const tone = point.net > 0 ? 'income' : point.net < 0 ? 'expense' : 'neutral';
          const label = formatPulseDay(point.date);

          return (
            <button
              key={point.date}
              type="button"
              onClick={() => handleSelect(point)}
              className={`group flex w-full items-center gap-3 rounded-[22px] border px-3 py-2.5 text-left transition-all duration-200 ${
                active ? 'border-white/12 bg-white/[0.05] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]' : 'border-transparent bg-white/[0.02] hover:bg-white/[0.04]'
              }`}
              aria-label={active ? `Abrir movimientos del ${label}` : `Seleccionar ${label}`}
            >
              <span className="w-[58px] shrink-0 text-[15px] text-white/72">{formatPulseDayShort(point.date)}</span>

              <div className="relative h-4 flex-1 overflow-hidden rounded-full bg-white/[0.05]">
                <div
                  className={`absolute inset-y-0 left-0 rounded-full transition-all duration-300 ${
                    tone === 'income'
                      ? 'bg-[linear-gradient(90deg,rgba(72,220,203,0.92),rgba(95,126,255,0.88))] shadow-[0_0_22px_rgba(72,126,255,0.18)]'
                      : tone === 'expense'
                        ? 'bg-[linear-gradient(90deg,rgba(255,121,146,0.95),rgba(255,164,73,0.82))] shadow-[0_0_22px_rgba(255,99,132,0.18)]'
                        : 'bg-white/[0.12]'
                  }`}
                  style={{ width: `${width}%` }}
                />
              </div>

              <div className={`flex min-w-[104px] items-center justify-end gap-2 text-right ${
                tone === 'income' ? 'text-emerald-300' : tone === 'expense' ? 'text-rose-300' : 'text-white/45'
              }`}>
                {tone === 'income' ? (
                  <ArrowUp size={16} strokeWidth={2.2} />
                ) : tone === 'expense' ? (
                  <ArrowDown size={16} strokeWidth={2.2} />
                ) : (
                  <Minus size={16} strokeWidth={2.2} />
                )}
                <span className="text-[15px] font-medium">
                  {point.net > 0 ? '+' : point.net < 0 ? '-' : ''}
                  {formatCurrency(Math.abs(point.net))}
                </span>
                <ArrowRight size={14} className={`transition-opacity ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-70'}`} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function fillTrendDays(period: Period, trend: TrendPoint[]) {
  const byDate = new Map(trend.map((point) => [point.date, point]));
  const totalDays = new Date(period.year, period.month, 0).getDate();
  let runningBalance = 0;

  return Array.from({ length: totalDays }, (_, index) => {
    const date = `${period.year}-${String(period.month).padStart(2, '0')}-${String(index + 1).padStart(2, '0')}`;
    const existing = byDate.get(date);

    if (existing) {
      runningBalance = existing.runningBalance;
      return existing;
    }

    return { date, income: 0, expense: 0, net: 0, runningBalance };
  });
}

function formatPulseDay(value: string) {
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  })
    .format(new Date(`${value}T00:00:00`))
    .replace('.', '')
    .toLowerCase();
}

function formatPulseDayShort(value: string) {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short'
  })
    .format(new Date(`${value}T00:00:00`))
    .replace('.', '')
    .toLowerCase();
}
