import { formatMonthLabel } from '@/lib/utils/dates';

export type Period = {
  year: number;
  month: number;
};

export function getCurrentPeriod(now = new Date()): Period {
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1
  };
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

  return {
    year: next.getFullYear(),
    month: next.getMonth() + 1
  };
}

export function getPeriodLabel(period: Period) {
  const label = formatMonthLabel(period.year, period.month);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function getPeriodDateRange(period: Period) {
  const start = new Date(period.year, period.month - 1, 1);
  const end = new Date(period.year, period.month, 0);

  return {
    start,
    end
  };
}

export function isCurrentPeriod(period: Period, now = new Date()) {
  const current = getCurrentPeriod(now);
  return current.year === period.year && current.month === period.month;
}
