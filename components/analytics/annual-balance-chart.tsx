'use client';

import { useMemo } from 'react';

import { BalanceScrubberChart, type ScrubPoint } from '@/components/analytics/balance-scrubber-chart';
import type { AnnualBalancePoint } from '@/lib/domain/types';

export function AnnualBalanceChart({ months }: { months: AnnualBalancePoint[] }) {
  const points = useMemo<ScrubPoint[]>(
    () =>
      months.map((month) => ({
        key: String(month.month),
        axisLabel: month.label,
        headerLabel: month.label,
        closingBalance: month.closingBalance
      })),
    [months]
  );

  return (
    <BalanceScrubberChart
      title="evolución anual del saldo"
      subtitle="saldo de cierre por mes"
      points={points}
      maxAxisLabels={12}
      emptyText="Todavía no hay meses suficientes para dibujar la evolución anual."
    />
  );
}
