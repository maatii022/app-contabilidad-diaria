'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { CalendarDays, Check, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

import { WalletMenu } from '@/components/navigation/wallet-menu';
import type { AccountBalance } from '@/lib/domain/types';
import { formatNumericDate } from '@/lib/utils/dates';
import { comparePeriods, getCurrentPeriod, getPeriodDateRange, getPeriodLabel, MIN_PERIOD, shiftPeriod, type Period } from '@/lib/utils/period';

export function PeriodToolbar({ period, accounts }: { period: Period; accounts: AccountBalance[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const prev = shiftPeriod(period, -1);
  const next = shiftPeriod(period, 1);
  const currentPeriod = getCurrentPeriod();
  const canGoPrev = comparePeriods(prev, MIN_PERIOD) >= 0;
  const canGoNext = comparePeriods(next, currentPeriod) <= 0;
  const { start, end } = getPeriodDateRange(period);

  return (
    <header className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {accounts.length > 0 ? <WalletMenu accounts={accounts} /> : null}
          <ManualSyncButton period={period} />
        </div>

        <div className="glass inline-flex items-center gap-2 px-2 py-2 text-white" style={{ borderRadius: 22 }}>
          {canGoPrev ? (
            <Link
              href={buildPeriodHref(pathname, searchParams, prev)}
              aria-label="Mes anterior"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.04] text-white/76 transition hover:bg-white/[0.08] hover:text-white"
            >
              <ChevronLeft size={16} />
            </Link>
          ) : (
            <div className="h-9 w-9" />
          )}

          <div className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm text-white/90">
            <CalendarDays size={15} className="text-white/54" />
            <span className="whitespace-nowrap">{getPeriodLabel(period)}</span>
          </div>

          {canGoNext ? (
            <Link
              href={buildPeriodHref(pathname, searchParams, next)}
              aria-label="Mes siguiente"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.04] text-white/76 transition hover:bg-white/[0.08] hover:text-white"
            >
              <ChevronRight size={16} />
            </Link>
          ) : (
            <div className="h-9 w-9" />
          )}
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

function ManualSyncButton({ period }: { period: Period }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  useEffect(() => {
    setStatus('idle');
  }, [pathname, searchParams]);

  useEffect(() => {
    if (status !== 'success') return;

    const timeout = window.setTimeout(() => setStatus('idle'), 1800);
    return () => window.clearTimeout(timeout);
  }, [status]);

  const icon = useMemo(() => {
    if (status === 'success') {
      return <Check size={16} className="text-pos" />;
    }

    return <RefreshCw size={16} className={`${status === 'loading' ? 'animate-spin text-white' : 'text-white/78'}`} />;
  }, [status]);

  async function handleSync() {
    if (status === 'loading') return;

    setStatus('loading');

    try {
      const response = await fetch('/api/sync/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ year: period.year, month: period.month })
      });

      if (!response.ok) {
        throw new Error('No se pudo sincronizar');
      }

      setStatus('success');
      router.refresh();
    } catch {
      setStatus('error');
      window.setTimeout(() => setStatus('idle'), 1800);
    }
  }

  return (
    <button
      type="button"
      onClick={handleSync}
      className="neu inline-flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[18px] transition active:scale-95"
      aria-label="Sincronizar mes manualmente"
      title="Sincronizar mes manualmente"
    >
      {status === 'error' ? <RefreshCw size={16} className="text-neg" /> : icon}
    </button>
  );
}

function buildPeriodHref(pathname: string, currentSearchParams: { toString(): string }, period: Period) {
  const nextSearchParams = new URLSearchParams(currentSearchParams.toString());
  nextSearchParams.set('year', String(period.year));
  nextSearchParams.set('month', String(period.month));

  const search = nextSearchParams.toString();
  return search ? `${pathname}?${search}` : pathname;
}
