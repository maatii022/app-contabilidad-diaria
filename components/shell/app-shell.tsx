import type { ReactNode } from 'react';

import { PeriodToolbar } from '@/components/navigation/period-toolbar';
import type { Period } from '@/lib/utils/period';

type AppShellProps = {
  children: ReactNode;
  period?: Period;
};

export function AppShell({ children, period }: AppShellProps) {
  return (
    <>
      {period ? <PeriodToolbar period={period} /> : null}
      <main className="space-y-5">{children}</main>
    </>
  );
}
