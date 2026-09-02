import type { ReactNode } from 'react';

import { PeriodToolbar } from '@/components/navigation/period-toolbar';
import { getAccountsWithBalances } from '@/lib/data/repository';
import type { Period } from '@/lib/utils/period';

type AppShellProps = {
  children: ReactNode;
  period?: Period;
};

export async function AppShell({ children, period }: AppShellProps) {
  const accounts = period ? await getAccountsWithBalances(period) : [];

  return (
    <>
      {period ? <PeriodToolbar period={period} accounts={accounts} /> : null}
      <main className="space-y-5">{children}</main>
    </>
  );
}
