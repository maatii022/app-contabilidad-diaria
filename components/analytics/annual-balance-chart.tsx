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
          <p className="text-sm text-white/55">evolución anual del saldo</p>
          <p className="mt-1 text-xs text-white/38">saldo de cierre por mes</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-white/40">{selected?.label ?? ''}</p>
          <p className={`mt-1 text-lg font-medium ${selected && selected.closingBalance >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
            <AnimatedValue value={selected?.closingBalance ?? 0} kind="currency" positivePrefix className="tabular-nums" />
          </p>
        </div>
      </div>

      {chart ? (
        <div className="rounded-[28px] border border-white/6 bg-white/[0.02] px-4 py-4">
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

              <path d={chart.path} fill="none" stroke="rgba(132,197,255,0.92)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

              {chart.points.map((point, index) => {
                const active = index === selectedIndex;
                return (
                  <g key={point.month} onClick={() => setSelectedIndex(index)} className="cursor-pointer">
                    <circle cx={point.x} cy={point.y} r={active ? 8 : 5.5} fill={active ? 'rgba(114,201,255,1)' : 'rgba(198,233,255,0.95)'} />
                    {active ? <circle cx={point.x} cy={point.y} r={14} fill="rgba(82,164,255,0.18)" /> : null}
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="mt-2 flex items-center justify-between gap-2 px-1 text-[11px] text-white/42">
            {months.map((month, index) => (
              <button
                key={month.month}
                type="button"
                onClick={() => setSelectedIndex(index)}
                className={`min-w-0 flex-1 rounded-full px-1 py-1 transition ${index === selectedIndex ? 'text-white' : 'hover:text-white/72'}`}
              >
                {month.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-white/10 px-4 py-8 text-sm text-white/42">
          Todavía no hay meses suficientes para dibujar la evolución anual.
        </div>
      )}
    </SurfaceCard>
  );
}
