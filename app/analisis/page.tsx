export const dynamic = 'force-dynamic';

import { AnalyticsScreen } from '@/components/analytics/analytics-screen';
import { AppShell } from '@/components/shell/app-shell';
import { getDashboardData } from '@/lib/data/repository';
import { resolvePeriod, shiftPeriod } from '@/lib/utils/period';

export default async function AnalisisPage({
  searchParams
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const period = resolvePeriod(await searchParams);
  const previousPeriod = shiftPeriod(period, -1);
  const [data, previousData] = await Promise.all([getDashboardData(period), getDashboardData(previousPeriod)]);

  return (
    <AppShell period={period}>
      <AnalyticsScreen period={period} data={data} previousData={previousData} />
    </AppShell>
  );
}
