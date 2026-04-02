import { NextResponse } from 'next/server';

import { syncPeriodFromGoogleSheets } from '@/lib/sync/google-sheets';
import { getCurrentPeriod } from '@/lib/utils/period';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      year?: number;
      month?: number;
    };

    const period = isValidYearMonth(body.year, body.month)
      ? { year: body.year!, month: body.month! }
      : getCurrentPeriod();

    const result = await syncPeriodFromGoogleSheets(period);

    return NextResponse.json({
      ok: true,
      result
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

function isValidYearMonth(year?: number, month?: number) {
  return Number.isInteger(year) && Number.isInteger(month) && month! >= 1 && month! <= 12;
}
