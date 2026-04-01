import { BudgetScreen } from '@/components/budget/budget-screen';
import { AppShell } from '@/components/shell/app-shell';
import { getDashboardData } from '@/lib/data/repository';

export default async function PresupuestoPage() {
  const data = await getDashboardData();

  return (
    <AppShell>
      <BudgetScreen data={data} />
    </AppShell>
  );
}
