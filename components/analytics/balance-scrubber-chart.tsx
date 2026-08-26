'use client';

import { useId, useMemo, useRef, useState } from 'react';

import { AnimatedValue } from '@/components/shared/animated-value';
import { SurfaceCard } from '@/components/shared/surface-card';

export type ScrubPoint = {
  key: string;
  axisLabel: string;
  headerLabel: string;
  closingBalance: number;
};

export function BalanceScrubberChart({
  title,
  subtitle,
  points,
  maxAxisLabels = 6,
  emptyText
}: {
  title: string;
  subtitle: string;
  points: ScrubPoint[];
  maxAxisLabels?: number;
  emptyText: string;
}) {
  const gradientId = useId();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const activeIndex = selectedIndex ?? points.length - 1;

  const svgRef = useRef<SVGSVGElement | null>(null);
  const draggingRef = useRef(false);

  const chart = useMemo(() => {
    if (points.length === 0) {
      return null;
    }

    const width = 620;
    const height = 180;
    const paddingX = 20;
    const paddingY = 18;
    const values = points.map((item) => item.closingBalance);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = Math.max(maxValue - minValue, Math.max(Math.abs(maxValue), Math.abs(minValue)) * 0.1, 1);
    const yMin = minValue - range * 0.16;
    const yMax = maxValue + range * 0.16;

    const stepX = points.length === 1 ? 0 : (width - paddingX * 2) / (points.length - 1);

    const plotted = points.map((point, index) => {
      const x = paddingX + stepX * index;
      const y = paddingY + ((yMax - point.closingBalance) / (yMax - yMin)) * (height - paddingY * 2);
      return { ...point, x, y };
    });

    const line = plotted.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' ');
    const area = `${line} L ${plotted[plotted.length - 1].x.toFixed(2)} ${height - paddingY} L ${plotted[0].x.toFixed(2)} ${height - paddingY} Z`;

    return { width, height, paddingX, paddingY, stepX, plotted, line, area };
  }, [points]);

  const selected = points[activeIndex] ?? null;
  const activePoint = chart?.plotted[activeIndex] ?? null;

  function updateFromClientX(clientX: number) {
    const svg = svgRef.current;
    if (!svg || !chart) {
      return;
    }

    const rect = svg.getBoundingClientRect();
    if (rect.width === 0) {
      return;
    }

    const ratio = (clientX - rect.left) / rect.width;
    const xView = ratio * chart.width;
    const rawIndex = chart.stepX === 0 ? 0 : Math.round((xView - chart.paddingX) / chart.stepX);
    const index = Math.min(points.length - 1, Math.max(0, rawIndex));

    setSelectedIndex((current) => (current === index ? current : index));
  }

  const axisTicks = useMemo(() => {
    const total = points.length;
    if (total === 0) {
      return [] as number[];
    }
    if (total <= maxAxisLabels) {
      return points.map((_, index) => index);
    }
    return Array.from({ length: maxAxisLabels }, (_, index) => Math.round((index * (total - 1)) / Math.max(maxAxisLabels - 1, 1)));
  }, [points, maxAxisLabels]);

  return (
    <SurfaceCard className="p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-text-muted">{title}</p>
          <p className="mt-1 text-xs text-text-faint">{subtitle}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-text-faint">{selected ? selected.headerLabel : ''}</p>
          <p className={`mt-1 text-lg font-medium ${selected && selected.closingBalance >= 0 ? 'text-pos' : 'text-neg'}`}>
            <AnimatedValue value={selected?.closingBalance ?? 0} kind="currency" className="tabular-nums" />
          </p>
        </div>
      </div>

      {chart && activePoint ? (
        <div className="rounded-lg border border-white/[0.06] bg-black/20 px-4 py-4 shadow-[inset_0_2px_10px_rgba(0,0,0,0.35)]">
          <div className="relative h-[190px]">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${chart.width} ${chart.height}`}
              className="h-[190px] w-full touch-pan-y select-none overflow-visible"
              onPointerDown={(event) => {
                draggingRef.current = true;
                event.currentTarget.setPointerCapture(event.pointerId);
                updateFromClientX(event.clientX);
              }}
              onPointerMove={(event) => {
                if (draggingRef.current) {
                  updateFromClientX(event.clientX);
                }
              }}
              onPointerUp={() => {
                draggingRef.current = false;
              }}
              onPointerCancel={() => {
                draggingRef.current = false;
              }}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
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

              <path d={chart.area} fill={`url(#${gradientId})`} stroke="none" />
              <path d={chart.line} fill="none" stroke="var(--color-accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

              <line
                x1={activePoint.x}
                y1={6}
                x2={activePoint.x}
                y2={chart.height - 6}
                stroke="rgba(255,255,255,0.28)"
                strokeWidth="1.5"
              />
              <circle cx={activePoint.x} cy={activePoint.y} r={14} fill="var(--color-accent-soft)" />
              <circle cx={activePoint.x} cy={activePoint.y} r={7} fill="var(--color-accent)" stroke="#fff" strokeWidth="1.5" />
            </svg>
          </div>

          <div className="mt-2 flex items-center justify-between px-1 text-[11px] text-text-faint">
            {axisTicks.map((tickIndex) => (
              <span key={points[tickIndex]?.key ?? tickIndex}>{points[tickIndex]?.axisLabel}</span>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border px-4 py-8 text-sm text-text-faint">{emptyText}</div>
      )}
    </SurfaceCard>
  );
}
