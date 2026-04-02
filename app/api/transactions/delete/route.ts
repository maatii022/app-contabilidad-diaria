import { NextResponse } from 'next/server';

import { getServerSupabase } from '@/lib/supabase/server';
import type { TransactionType } from '@/lib/domain/types';

export const dynamic = 'force-dynamic';

const APPS_SCRIPT_SYNC_URL = process.env.APPS_SCRIPT_SYNC_URL;
const APPS_SCRIPT_SYNC_TOKEN = process.env.APPS_SCRIPT_SYNC_TOKEN;

type DeletePayload = {
  transactionId?: string;
  sourceFileId?: string;
  sourceFileName?: string;
  sourceSheetName?: string;
  sourceRow?: number;
  type?: TransactionType;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as DeletePayload;

    if (!body.transactionId) {
      return NextResponse.json({ ok: false, error: 'Falta transactionId.' }, { status: 400 });
    }

    if (!body.sourceFileId) {
      return NextResponse.json({ ok: false, error: 'Falta sourceFileId para borrar en Google Sheets.' }, { status: 400 });
    }

    if (!body.sourceRow || !Number.isInteger(body.sourceRow) || body.sourceRow < 1) {
      return NextResponse.json({ ok: false, error: 'Falta sourceRow válido.' }, { status: 400 });
    }

    if (body.type !== 'income' && body.type !== 'expense') {
      return NextResponse.json({ ok: false, error: 'Tipo de movimiento inválido.' }, { status: 400 });
    }

    const supabase = getServerSupabase();

    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: 'Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno.' },
        { status: 500 }
      );
    }

    if (!APPS_SCRIPT_SYNC_URL || !APPS_SCRIPT_SYNC_TOKEN) {
      return NextResponse.json(
        { ok: false, error: 'Faltan APPS_SCRIPT_SYNC_URL o APPS_SCRIPT_SYNC_TOKEN en el entorno.' },
        { status: 500 }
      );
    }

    const sheetsResponse = await fetch(APPS_SCRIPT_SYNC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'delete',
        token: APPS_SCRIPT_SYNC_TOKEN,
        fileId: body.sourceFileId,
        fileName: body.sourceFileName ?? '',
        sheetName: body.sourceSheetName ?? 'Transacciones',
        sourceRow: body.sourceRow,
        type: body.type
      }),
      cache: 'no-store'
    });

    const sheetsPayload = (await sheetsResponse.json().catch(() => null)) as { ok?: boolean; error?: string } | null;

    if (!sheetsResponse.ok || !sheetsPayload?.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: sheetsPayload?.error || 'No se pudo eliminar el movimiento en Google Sheets.'
        },
        { status: 502 }
      );
    }

    const { error: deleteError } = await supabase.from('transactions').delete().eq('id', body.transactionId);

    if (deleteError) {
      return NextResponse.json(
        {
          ok: false,
          error: `Se eliminó en Google Sheets, pero falló el borrado en Supabase: ${deleteError.message}`
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      result: {
        transactionId: body.transactionId,
        sourceRow: body.sourceRow,
        type: body.type
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Error desconocido al eliminar el movimiento.'
      },
      { status: 500 }
    );
  }
}
