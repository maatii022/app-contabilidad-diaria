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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(111,159,255,0.18),_transparent_28%),radial-gradient(circle_at_bottom,_rgba(90,255,177,0.08),_transparent_20%),linear-gradient(180deg,_#09101f_0%,_#050814_100%)] text-white">
      <div
        className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 20px)',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)'
        }}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-400/12 blur-3xl" />
          <div className="absolute bottom-24 right-0 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />
        </div>

        <div className="relative z-10 flex-1 space-y-5">
          {period ? <PeriodToolbar period={period} /> : null}
          <main className="space-y-5">{children}</main>
        </div>

        <BottomNav />
      </div>
    </div>
  );
}
