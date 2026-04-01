'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { CalendarDays, ChevronLeft, ChevronRight, Wallet2 } from 'lucide-react';

import { formatNumericDate } from '@/lib/utils/dates';
import type { Period } from '@/lib/utils/period';
import { getPeriodDateRange, getPeriodLabel, shiftPeriod } from '@/lib/utils/period';

export function PeriodToolbar({ period }: { period: Period }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const prev = shiftPeriod(period, -1);
  const next = shiftPeriod(period, 1);
  const { start, end } = getPeriodDateRange(period);

  return (
    <header className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex min-w-0 items-center gap-2 rounded-[20px] border border-white/10 bg-white/[0.035] px-3 py-2 text-sm text-white/82 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-xl">
          <Wallet2 size={16} className="shrink-0 text-white/72" />
          <span className="truncate">Cuenta principal</span>
        </div>

        <div className="inline-flex items-center gap-2 rounded-[22px] border border-white/10 bg-white/[0.04] px-2 py-2 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-xl">
          <Link
            href={buildPeriodHref(pathname, searchParams, prev)}
            aria-label="Mes anterior"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.04] text-white/76 transition hover:bg-white/[0.08] hover:text-white"
          >
            <ChevronLeft size={16} />
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm text-white/90">
            <CalendarDays size={15} className="text-white/54" />
            <span className="whitespace-nowrap">{getPeriodLabel(period)}</span>
          </div>

          <Link
            href={buildPeriodHref(pathname, searchParams, next)}
            aria-label="Mes siguiente"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.04] text-white/76 transition hover:bg-white/[0.08] hover:text-white"
          >
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-white/42">
        <div className="h-px flex-1 bg-white/8" />
        <span>
          Periodo del {formatNumericDate(start)} al {formatNumericDate(end)}
        </span>
      </div>
    </header>
  );
}

function buildPeriodHref(pathname: string, currentSearchParams: { toString(): string }, period: Period) {
  const nextSearchParams = new URLSearchParams(currentSearchParams.toString());
  nextSearchParams.set('year', String(period.year));
  nextSearchParams.set('month', String(period.month));

  const search = nextSearchParams.toString();
  return search ? `${pathname}?${search}` : pathname;
}
