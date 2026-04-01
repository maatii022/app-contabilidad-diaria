import Link from 'next/link';

import type { TrendPoint } from '@/lib/domain/types';
import { formatCurrency } from '@/lib/utils/currency';

type Period = {
  year: number;
  month: number;
};

const CHART_HEIGHT = 188;
const PLOT_TOP = 18;
const PLOT_BOTTOM = 18;
const DAY_WIDTH = 36;
const DAY_GAP = 10;

export function DailyFlowChart({ trend, period, openingBalance }: { trend: TrendPoint[]; period: Period; openingBalance: number }) {
  const maxDailyMagnitude = Math.max(...trend.map((point) => Math.abs(point.net)), 1);
  const balanceValues = trend.map((point) => point.runningBalance);
  const minBalance = Math.min(openingBalance, ...balanceValues);
  const maxBalance = Math.max(openingBalance, ...balanceValues);
  const balanceRange = Math.max(maxBalance - minBalance, 1);
  const chartWidth = trend.length * DAY_WIDTH + Math.max(trend.length - 1, 0) * DAY_GAP;
  const chartMidY = CHART_HEIGHT / 2;
  const linePath = buildBalancePath({
    trend,
    minBalance,
    balanceRange,
    chartHeight: CHART_HEIGHT,
    plotTop: PLOT_TOP,
    plotBottom: PLOT_BOTTOM,
    dayWidth: DAY_WIDTH,
    dayGap: DAY_GAP
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-white/58">
        <span>Evolución del saldo</span>
        <span>Desde {formatCurrency(openingBalance)}</span>
      </div>

      <div className="rounded-[24px] border border-white/8 bg-white/[0.028] p-3">
        <div className="mb-3 flex items-center gap-4 text-[11px] text-white/40">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[rgba(129,172,255,0.95)]" />
            <span>Flujo diario</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-px w-4 bg-white/30" />
            <span>Saldo acumulado</span>
          </div>
        </div>

        <div className="scrollbar-none -mx-1 overflow-x-auto pb-1">
          <div className="relative px-1" style={{ width: `${chartWidth}px`, height: `${CHART_HEIGHT + 34}px` }}>
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-1 top-0"
              width={chartWidth}
              height={CHART_HEIGHT}
              viewBox={`0 0 ${chartWidth} ${CHART_HEIGHT}`}
              fill="none"
            >
              <line x1="0" y1={chartMidY} x2={chartWidth} y2={chartMidY} stroke="rgba(255,255,255,0.09)" strokeWidth="1" strokeDasharray="2 6" />
              <path d={linePath} stroke="rgba(255,255,255,0.28)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>

            <div className="absolute inset-x-1 top-0 flex items-start gap-[10px]" style={{ height: `${CHART_HEIGHT + 34}px` }}>
              {trend.map((point) => {
                const magnitudeRatio = Math.abs(point.net) / maxDailyMagnitude;
                const barHeight = point.net === 0 ? 6 : Math.max(22, Math.round(magnitudeRatio * 72));
                const isPositive = point.net > 0;
                const isNegative = point.net < 0;
                const hasMovement = point.income > 0 || point.expense > 0;
                const href = {
                  pathname: '/movimientos',
                  query: {
                    year: String(period.year),
                    month: String(period.month),
                    date: point.date
                  }
                };

                return (
                  <Link
                    key={point.date}
                    href={href}
                    className="group relative flex h-full w-[36px] shrink-0 flex-col items-center"
                    aria-label={`Ver movimientos del ${formatLongDate(point.date)}`}
                  >
                    <div className="relative h-[188px] w-full overflow-hidden rounded-[18px] border border-white/7 bg-white/[0.03] transition group-hover:border-white/14 group-hover:bg-white/[0.045]">
                      <div className="absolute inset-x-0 top-0 bottom-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.018),rgba(255,255,255,0))]" />

                      {hasMovement ? (
                        <>
                          {isPositive ? (
                            <div
                              className="absolute left-1/2 bottom-1/2 w-[12px] -translate-x-1/2 rounded-full bg-[linear-gradient(180deg,rgba(157,206,255,0.98),rgba(84,126,255,0.62))] shadow-[0_12px_26px_rgba(76,124,255,0.28)]"
                              style={{ height: `${barHeight}px` }}
                            />
                          ) : null}

                          {isNegative ? (
                            <div
                              className="absolute left-1/2 top-1/2 w-[12px] -translate-x-1/2 rounded-full bg-[linear-gradient(180deg,rgba(255,165,190,0.98),rgba(255,86,118,0.58))] shadow-[0_12px_26px_rgba(255,88,121,0.24)]"
                              style={{ height: `${barHeight}px` }}
                            />
                          ) : null}
                        </>
                      ) : (
                        <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.16]" />
                      )}
                    </div>

                    <span className={`mt-3 text-center text-[11px] leading-4 ${hasMovement ? 'text-white/58' : 'text-white/30'} group-hover:text-white/82`}>
                      {formatChartDate(point.date)}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function buildBalancePath({
  trend,
  minBalance,
  balanceRange,
  chartHeight,
  plotTop,
  plotBottom,
  dayWidth,
  dayGap
}: {
  trend: TrendPoint[];
  minBalance: number;
  balanceRange: number;
  chartHeight: number;
  plotTop: number;
  plotBottom: number;
  dayWidth: number;
  dayGap: number;
}) {
  if (trend.length === 0) return '';

  const usableHeight = chartHeight - plotTop - plotBottom;

  return trend
    .map((point, index) => {
      const x = index * (dayWidth + dayGap) + dayWidth / 2;
      const normalized = (point.runningBalance - minBalance) / balanceRange;
      const y = chartHeight - plotBottom - normalized * usableHeight;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');
}

function formatChartDate(value: string) {
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short' })
    .format(new Date(`${value}T00:00:00`))
    .replace('.', '');
}

function formatLongDate(value: string) {
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: '2-digit',
    month: 'long'
  }).format(new Date(`${value}T00:00:00`));
}
