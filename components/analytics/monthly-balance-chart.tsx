'use client';

import { useMemo } from 'react';

import { BalanceScrubberChart, type ScrubPoint } from '@/components/analytics/balance-scrubber-chart';
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
  const points = useMemo<ScrubPoint[]>(() => {
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

      return {
        key: date,
        axisLabel: String(day),
        headerLabel: formatDayLabel(date),
        closingBalance: running
      };
    });
  }, [trend, openingBalance, period.month, period.year]);

  return (
    <BalanceScrubberChart
      title="evolución del saldo"
      subtitle="saldo diario del mes"
      points={points}
      maxAxisLabels={6}
      emptyText="Todavía no hay movimientos suficientes para dibujar la evolución del mes."
    />
  );
}

function formatDayLabel(value: string) {
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' })
    .format(new Date(`${value}T00:00:00`))
    .replace('.', '')
    .toLowerCase();
}
