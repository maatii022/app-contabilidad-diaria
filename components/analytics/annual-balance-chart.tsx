'use client';

import { useMemo, useState } from 'react';

import { AnimatedValue } from '@/components/shared/animated-value';
import { SurfaceCard } from '@/components/shared/surface-card';
import type { AnnualBalancePoint } from '@/lib/domain/types';

export function AnnualBalanceChart({ months }: { months: AnnualBalancePoint[] }) {
  const [selectedIndex, setSelectedIndex] = useState(Math.max(0, months.length - 1));

  const chart = useMemo(() => {
    if (months.length === 0) {
      return null;
    }

    const width = 620;
    const height = 180;
    const paddingX = 28;
    const paddingY = 18;
    const values = months.map((item) => item.closingBalance);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = Math.max(maxValue - minValue, Math.max(Math.abs(maxValue), Math.abs(minValue)) * 0.1, 1);
    const yMin = minValue - range * 0.14;
    const yMax = maxValue + range * 0.14;

    const stepX = months.length === 1 ? 0 : (width - paddingX * 2) / (months.length - 1);

    const points = months.map((month, index) => {
      const x = paddingX + stepX * index;
      const y = paddingY + ((yMax - month.closingBalance) / (yMax - yMin)) * (height - paddingY * 2);
      return { ...month, x, y };
    });

    const path = points
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
      .join(' ');

    return { width, height, points, path };
  }, [months]);

  const selected = months[selectedIndex] ?? null;

  return (
    <SurfaceCard className="p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-text-muted">evolución anual del saldo</p>
          <p className="mt-1 text-xs text-text-faint">saldo de cierre por mes</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-text-faint">{selected?.label ?? ''}</p>
          <p className={`tnum mt-1 text-lg font-medium ${selected && selected.closingBalance >= 0 ? 'text-pos' : 'text-neg'}`}>
            <AnimatedValue value={selected?.closingBalance ?? 0} kind="currency" positivePrefix className="tabular-nums" />
          </p>
        </div>
      </div>

      {chart ? (
        <div className="rounded-lg border border-white/[0.06] bg-black/20 px-4 py-4 shadow-[inset_0_2px_10px_rgba(0,0,0,0.35)]">
          <div className="relative h-[190px]">
            <svg viewBox={`0 0 ${chart.width} ${chart.height}`} className="h-[190px] w-full overflow-visible">
              {[0.25, 0.5, 0.75].map((ratio) => {
                const y = chart.height * ratio;
                return (
                  <line
                    key={ratio}
                    x1={18}
                    y1={y}
                    x2={chart.width - 18}
                    y2={y}
                    stroke="rgba(255,255,255,0.08)"
                    strokeDasharray="5 7"
                    strokeWidth="1"
                  />
                );
              })}

              <path d={chart.path} fill="none" stroke="var(--color-accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

              {chart.points.map((point, index) => {
                const active = index === selectedIndex;
                return (
                  <g key={point.month} onClick={() => setSelectedIndex(index)} className="cursor-pointer">
                    <circle cx={point.x} cy={point.y} r={active ? 8 : 5.5} fill={active ? 'var(--color-accent)' : 'rgba(255,255,255,0.45)'} />
                    {active ? <circle cx={point.x} cy={point.y} r={14} fill="var(--color-accent-soft)" /> : null}
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="mt-2 flex items-center justify-between gap-2 px-1 text-[11px] text-text-faint">
            {months.map((month, index) => (
              <button
                key={month.month}
                type="button"
                onClick={() => setSelectedIndex(index)}
                className={`min-w-0 flex-1 rounded-full px-1 py-1 transition ${index === selectedIndex ? 'text-text' : 'hover:text-text'}`}
              >
                {month.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-border px-4 py-8 text-sm text-text-faint">
          Todavía no hay meses suficientes para dibujar la evolución anual.
        </div>
      )}
    </SurfaceCard>
  );
}
