import { AnalyticsScreen } from '@/components/analytics/analytics-screen';
import { AppShell } from '@/components/shell/app-shell';
import { getDashboardData } from '@/lib/data/repository';

export default async function AnalisisPage() {
  const data = await getDashboardData();

  return (
    <AppShell>
      <AnalyticsScreen data={data} />
    </AppShell>
  );
}
