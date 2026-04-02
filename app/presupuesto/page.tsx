export const dynamic = 'force-dynamic';

import { BudgetScreen } from '@/components/budget/budget-screen';
import { AppShell } from '@/components/shell/app-shell';
import { getBudgetPageData } from '@/lib/data/repository';
import { resolvePeriod } from '@/lib/utils/period';

export default async function PresupuestoPage({
  searchParams
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const period = resolvePeriod(await searchParams);
  const { data, budgets, seededFromPrevious, expenseCatalog, incomeCatalog } = await getBudgetPageData(period);

  return (
    <AppShell period={period}>
      <BudgetScreen
        key={`${period.year}-${period.month}`}
        data={data}
        budgets={budgets}
        period={period}
        seededFromPrevious={seededFromPrevious}
        expenseCatalog={expenseCatalog}
        incomeCatalog={incomeCatalog}
      />
    </AppShell>
  );
}
