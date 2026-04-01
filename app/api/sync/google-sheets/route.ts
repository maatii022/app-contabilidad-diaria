import { NextResponse } from 'next/server';

import { syncPeriodFromGoogleSheets, syncPeriodRangeFromGoogleSheets } from '@/lib/sync/google-sheets';
import { DEFAULT_PERIOD } from '@/lib/utils/period';

export const dynamic = 'force-dynamic';

const SYNC_API_KEY = process.env.SYNC_API_KEY;

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      key?: string;
      year?: number;
      month?: number;
      startYear?: number;
      startMonth?: number;
      endYear?: number;
      endMonth?: number;
    };

    if (!SYNC_API_KEY || body.key !== SYNC_API_KEY) {
      return NextResponse.json({ ok: false, error: 'Clave de sincronización inválida.' }, { status: 401 });
    }

    if (isValidYearMonth(body.startYear, body.startMonth) && isValidYearMonth(body.endYear, body.endMonth)) {
      const results = await syncPeriodRangeFromGoogleSheets({
        start: { year: body.startYear!, month: body.startMonth! },
        end: { year: body.endYear!, month: body.endMonth! }
      });

      return NextResponse.json({
        ok: true,
        mode: 'range',
        results
      });
    }

    const period = isValidYearMonth(body.year, body.month)
      ? { year: body.year!, month: body.month! }
      : DEFAULT_PERIOD;

    const result = await syncPeriodFromGoogleSheets(period);

    return NextResponse.json({
      ok: true,
      mode: 'single',
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
