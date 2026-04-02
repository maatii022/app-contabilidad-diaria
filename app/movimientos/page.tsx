export const dynamic = 'force-dynamic';

import { AppShell } from '@/components/shell/app-shell';
import { MovementsScreen } from '@/components/movements/movements-screen';
import { getTransactions } from '@/lib/data/repository';
import { resolvePeriod } from '@/lib/utils/period';

export default async function MovimientosPage({
  searchParams
}: {
  searchParams: Promise<{ type?: string; category?: string; q?: string; date?: string; year?: string; month?: string }>;
}) {
  const params = await searchParams;
  const period = resolvePeriod(params);
  const transactions = await getTransactions(period);

  return (
    <AppShell period={period}>
      <MovementsScreen
        transactions={transactions}
        period={period}
        filters={{
          type: params.type === 'expense' || params.type === 'income' ? params.type : 'all',
          category: params.category ?? 'all',
          query: params.q ?? '',
          date: params.date ?? ''
        }}
      />
    </AppShell>
  );
}
