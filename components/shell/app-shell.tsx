import type { ReactNode } from 'react';

import { BottomNav } from '@/components/navigation/bottom-nav';
import { PeriodToolbar } from '@/components/navigation/period-toolbar';
import type { Period } from '@/lib/utils/period';

type AppShellProps = {
  children: ReactNode;
  period?: Period;
};

export function AppShell({ children, period }: AppShellProps) {
  return (
    <div className="min-h-screen bg-bg text-text">
      <div
        className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 20px)',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)'
        }}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,_var(--color-accent-soft),_transparent_70%)]" />

        <div className="relative z-10 flex-1 space-y-5">
          {period ? <PeriodToolbar period={period} /> : null}
          <main className="space-y-5">{children}</main>
        </div>

        <BottomNav />
      </div>
    </div>
  );
}
