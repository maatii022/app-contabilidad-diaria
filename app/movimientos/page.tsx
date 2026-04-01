import { AppShell } from '@/components/shell/app-shell';
import { MovementsScreen } from '@/components/movements/movements-screen';
import { getTransactions } from '@/lib/data/repository';

export default async function MovimientosPage({
  searchParams
}: {
  searchParams: Promise<{ type?: string; category?: string; q?: string }>;
}) {
  const transactions = await getTransactions();
  const params = await searchParams;

  const categories = [...new Set(transactions.map((transaction) => transaction.categoryName))].sort((a, b) => a.localeCompare(b));

  return (
    <AppShell>
      <MovementsScreen
        transactions={transactions}
        categories={categories}
        filters={{
          type: params.type === 'expense' || params.type === 'income' ? params.type : 'all',
          category: params.category ?? 'all',
          query: params.q ?? ''
        }}
      />
    </AppShell>
  );
}
