export const dynamic = 'force-dynamic';

import { AppShell } from '@/components/shell/app-shell';
import { SummaryScreen } from '@/components/summary/summary-screen';
import { getDashboardData } from '@/lib/data/repository';
import { resolvePeriod } from '@/lib/utils/period';

export default async function ResumenPage({
  searchParams
}: {
  searchParams: Promise<{ year?: string; month?: string; account?: string }>;
}) {
  const params = await searchParams;
  const period = resolvePeriod(params);
  const data = await getDashboardData(period, params.account);

  return (
    <AppShell period={period}>
      <SummaryScreen data={data} period={period} />
    </AppShell>
  );
}
