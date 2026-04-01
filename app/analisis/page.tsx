export const dynamic = 'force-dynamic';

import { AnalyticsScreen } from '@/components/analytics/analytics-screen';
import { AppShell } from '@/components/shell/app-shell';
import { getDashboardData } from '@/lib/data/repository';
import { resolvePeriod } from '@/lib/utils/period';

export default async function AnalisisPage({
  searchParams
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const period = resolvePeriod(await searchParams);
  const data = await getDashboardData(period);

  return (
    <AppShell period={period}>
      <AnalyticsScreen data={data} />
    </AppShell>
  );
}
