import { formatMonthLabel } from '@/lib/utils/dates';

export type Period = {
  year: number;
  month: number;
};

export const MIN_PERIOD: Period = { year: 2026, month: 1 };

export function getCurrentPeriod(): Period {
  const now = new Date();
  const raw = { year: now.getFullYear(), month: now.getMonth() + 1 };
  return comparePeriods(raw, MIN_PERIOD) < 0 ? MIN_PERIOD : raw;
}

export function resolvePeriod(input?: { year?: string; month?: string }): Period {
  const year = Number(input?.year);
  const month = Number(input?.month);

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return getCurrentPeriod();
  }

  return { year, month };
}

export function shiftPeriod(period: Period, delta: number): Period {
  const next = new Date(period.year, period.month - 1 + delta, 1);
  return { year: next.getFullYear(), month: next.getMonth() + 1 };
}

export function comparePeriods(a: Period, b: Period) {
  if (a.year !== b.year) return a.year - b.year;
  return a.month - b.month;
}

export function isCurrentPeriod(period: Period) {
  return comparePeriods(period, getCurrentPeriod()) === 0;
}

export function getPeriodLabel(period: Period) {
  const label = formatMonthLabel(period.year, period.month);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function getPeriodDateRange(period: Period) {
  return {
    start: new Date(period.year, period.month - 1, 1),
    end: new Date(period.year, period.month, 0)
  };
}
