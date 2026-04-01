export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';

export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();

  if (params.year) query.set('year', params.year);
  if (params.month) query.set('month', params.month);

  redirect(query.toString() ? `/resumen?${query.toString()}` : '/resumen');
}
