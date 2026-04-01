import { AppShell } from '@/components/shell/app-shell';
import { SummaryScreen } from '@/components/summary/summary-screen';
import { getDashboardData } from '@/lib/data/repository';

export default async function ResumenPage() {
  const data = await getDashboardData();

  return (
    <AppShell>
      <SummaryScreen data={data} />
    </AppShell>
  );
}
