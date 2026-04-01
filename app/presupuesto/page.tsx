export const dynamic = 'force-dynamic';

import { BudgetScreen } from '@/components/budget/budget-screen';
import { AppShell } from '@/components/shell/app-shell';
import { getDashboardData } from '@/lib/data/repository';
import { resolvePeriod } from '@/lib/utils/period';

export default async function PresupuestoPage({
  searchParams
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const period = resolvePeriod(await searchParams);
  const data = await getDashboardData(period);

  return (
    <AppShell period={period}>
      <BudgetScreen data={data} />
    </AppShell>
  );
}
