'use client';

import { useMemo, useState } from 'react';

import { AnimatedValue } from '@/components/shared/animated-value';
import { SurfaceCard } from '@/components/shared/surface-card';
import type { TrendPoint } from '@/lib/domain/types';
import type { Period } from '@/lib/utils/period';

export function MonthlyBalanceChart({
  trend,
  openingBalance,
  period
}: {
  trend: TrendPoint[];
  openingBalance: number;
  period: Period;
}) {
  const days = useMemo(() => {
    const byDate = new Map(trend.map((point) => [point.date, point]));
    const totalDays = new Date(period.year, period.month, 0).getDate();
    let running = openingBalance;

    return Array.from({ length: totalDays }, (_, index) => {
      const day = index + 1;
      const date = `${period.year}-${String(period.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const existing = byDate.get(date);

      if (existing) {
        running = existing.runningBalance;
      }

      return { day, date, closingBalance: running };
    });
  }, [trend, openingBalance, period.month, period.year]);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const activeIndex = selectedIndex ?? days.length - 1;

  const chart = useMemo(() => {
    if (days.length === 0) {
      return null;
    }

    const width = 620;
    const height = 180;
    const paddingX = 20;
    const paddingY = 18;
    const values = days.map((item) => item.closingBalance);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = Math.max(maxValue - minValue, Math.max(Math.abs(maxValue), Math.abs(minValue)) * 0.1, 1);
    const yMin = minValue - range * 0.16;
    const yMax = maxValue + range * 0.16;

    const stepX = days.length === 1 ? 0 : (width - paddingX * 2) / (days.length - 1);

    const points = days.map((day, index) => {
      const x = paddingX + stepX * index;
      const y = paddingY + ((yMax - day.closingBalance) / (yMax - yMin)) * (height - paddingY * 2);
      return { ...day, x, y };
    });

    const line = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' ');
    const area = `${line} L ${points[points.length - 1].x.toFixed(2)} ${height - paddingY} L ${points[0].x.toFixed(2)} ${height - paddingY} Z`;

    return { width, height, points, line, area };
  }, [days]);

  const selected = days[activeIndex] ?? null;

  const axisTicks = useMemo(() => {
    const total = days.length;
    if (total === 0) {
      return [] as number[];
    }
    const count = Math.min(6, total);
    return Array.from({ length: count }, (_, index) => Math.round((index * (total - 1)) / Math.max(count - 1, 1)));
  }, [days.length]);

  return (
    <SurfaceCard className="p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-text-muted">evolución del saldo</p>
          <p className="mt-1 text-xs text-text-faint">saldo diario del mes</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-text-faint">{selected ? formatDayLabel(selected.date) : ''}</p>
          <p className={`mt-1 text-lg font-medium ${selected && selected.closingBalance >= 0 ? 'text-pos' : 'text-neg'}`}>
            <AnimatedValue value={selected?.closingBalance ?? 0} kind="currency" className="tabular-nums" />
          </p>
        </div>
      </div>

      {chart ? (
        <div className="rounded-lg border border-white/[0.06] bg-black/20 px-4 py-4 shadow-[inset_0_2px_10px_rgba(0,0,0,0.35)]">
          <div className="relative h-[190px]">
            <svg viewBox={`0 0 ${chart.width} ${chart.height}`} className="h-[190px] w-full overflow-visible">
              <defs>
                <linearGradient id="monthly-balance-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
                </linearGradient>
              </defs>

              {[0.25, 0.5, 0.75].map((ratio) => {
                const y = chart.height * ratio;
                return (
                  <line
                    key={ratio}
                    x1={18}
                    y1={y}
                    x2={chart.width - 18}
                    y2={y}
                    stroke="rgba(255,255,255,0.06)"
                    strokeDasharray="5 7"
                    strokeWidth="1"
                  />
                );
              })}

              <path d={chart.area} fill="url(#monthly-balance-area)" stroke="none" />
              <path d={chart.line} fill="none" stroke="var(--color-accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

              {chart.points.map((point, index) => {
                const active = index === activeIndex;
                if (!active) {
                  return null;
                }
                return (
                  <g key={point.date}>
                    <circle cx={point.x} cy={point.y} r={14} fill="var(--color-accent-soft)" />
                    <circle cx={point.x} cy={point.y} r={7} fill="var(--color-accent)" />
                  </g>
                );
              })}

              {chart.points.map((point, index) => (
                <rect
                  key={`hit-${point.date}`}
                  x={point.x - Math.max(6, (chart.width - 40) / days.length / 2)}
                  y={0}
                  width={Math.max(12, (chart.width - 40) / days.length)}
                  height={chart.height}
                  fill="transparent"
                  className="cursor-pointer"
                  onClick={() => setSelectedIndex(index)}
                />
              ))}
            </svg>
          </div>

          <div className="mt-2 flex items-center justify-between px-1 text-[11px] text-text-faint">
            {axisTicks.map((tickIndex) => (
              <span key={tickIndex}>{days[tickIndex]?.day}</span>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border px-4 py-8 text-sm text-text-faint">
          Todavía no hay movimientos suficientes para dibujar la evolución del mes.
        </div>
      )}
    </SurfaceCard>
  );
}

function formatDayLabel(value: string) {
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' })
    .format(new Date(`${value}T00:00:00`))
    .replace('.', '')
    .toLowerCase();
}
