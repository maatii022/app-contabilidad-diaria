export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';

import { getCurrentPeriod, resolvePeriod } from '@/lib/utils/period';

export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const params = await searchParams;
  const period = params.year || params.month ? resolvePeriod(params) : getCurrentPeriod();
  const query = new URLSearchParams();

  query.set('year', String(period.year));
  query.set('month', String(period.month));

  redirect(`/resumen?${query.toString()}`);
}
