'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowRight, ArrowUp } from 'lucide-react';

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

      <div className="space-y-1.5">
        {rows.map((point) => {
          const active = point.date === selectedDate;
          const width = point.net === 0 ? 10 : Math.max(10, (Math.abs(point.net) / maxAbsNet) * 100);
          const tone = point.net < 0 ? 'expense' : 'income';
          const label = formatPulseDay(point.date);
          const amountText = `${point.net < 0 ? '-' : ''}${formatCurrency(Math.abs(point.net))}`;

          return (
            <button
              key={point.date}
              type="button"
              onClick={() => handleSelect(point)}
              className={`group flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left transition-all duration-200 ${
                active ? 'bg-white/[0.04]' : 'hover:bg-white/[0.025]'
              }`}
              aria-label={active ? `Abrir movimientos del ${label}` : `Seleccionar ${label}`}
            >
              <span className="w-[56px] shrink-0 text-[15px] text-white/68">{formatPulseDayShort(point.date)}</span>

              <div className="relative flex-1">
                <div className="h-3.5 rounded-full bg-white/[0.06]" />
                <div
                  className={`absolute left-0 top-0 h-3.5 rounded-full transition-all duration-300 ${
                    tone === 'income'
                      ? 'bg-[linear-gradient(90deg,rgba(44,207,181,0.95),rgba(72,220,203,0.92))] shadow-[0_0_18px_rgba(44,207,181,0.18)]'
                      : 'bg-[linear-gradient(90deg,rgba(255,121,146,0.95),rgba(255,164,73,0.82))] shadow-[0_0_18px_rgba(255,121,146,0.18)]'
                  } ${active ? 'brightness-110' : ''}`}
                  style={{ width: `${width}%` }}
                />
              </div>

              <div className={`flex min-w-[108px] items-center justify-end gap-2 ${tone === 'income' ? 'text-emerald-300' : 'text-rose-300'}`}>
                {tone === 'income' ? <ArrowUp size={16} strokeWidth={2.2} /> : <ArrowDown size={16} strokeWidth={2.2} />}
                <span className="text-[15px] font-medium">{amountText}</span>
                <ArrowRight size={14} className={`transition-opacity ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'}`} />
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
