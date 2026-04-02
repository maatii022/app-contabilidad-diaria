import { NextResponse } from 'next/server';

import { getServerSupabase } from '@/lib/supabase/server';
import { writeBudgetValuesToGoogleSheets } from '@/lib/sync/google-sheets';
import type { TransactionType } from '@/lib/domain/types';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      year?: number;
      month?: number;
      type?: TransactionType;
      categoryName?: string;
      plannedAmount?: number;
    };

    const year = Number(body.year);
    const month = Number(body.month);
    const plannedAmount = Number(body.plannedAmount);
    const type = body.type;
    const categoryName = String(body.categoryName ?? '').trim();

    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
      return NextResponse.json({ ok: false, error: 'Periodo inválido.' }, { status: 400 });
    }

    if (type !== 'expense' && type !== 'income') {
      return NextResponse.json({ ok: false, error: 'Tipo inválido.' }, { status: 400 });
    }

    if (!categoryName) {
      return NextResponse.json({ ok: false, error: 'Falta la categoría.' }, { status: 400 });
    }

    if (!Number.isFinite(plannedAmount) || plannedAmount < 0) {
      return NextResponse.json({ ok: false, error: 'El presupuesto debe ser un número válido.' }, { status: 400 });
    }

    const supabase = getServerSupabase();

    if (!supabase) {
      return NextResponse.json({ ok: false, error: 'Supabase no está configurado.' }, { status: 500 });
    }

    const now = new Date();
    const currentPeriod = {
      year: now.getFullYear(),
      month: now.getMonth() + 1
    };

    const shouldUpdateTemplate = comparePeriods({ year, month }, currentPeriod) >= 0;

    await writeBudgetValuesToGoogleSheets(
      { year, month },
      [{ type, categoryName, plannedAmount }],
      {
        updateTemplate: shouldUpdateTemplate
      }
    );

    const { error } = await supabase.from('monthly_budgets').upsert(
      {
        year,
        month,
        type,
        category_name: categoryName,
        planned_amount: plannedAmount,
        updated_at: new Date().toISOString()
      },
      {
        onConflict: 'year,month,type,category_name'
      }
    );

    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true, updateTemplate: shouldUpdateTemplate });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'No se pudo guardar el presupuesto.' },
      { status: 500 }
    );
  }
}

function comparePeriods(a: { year: number; month: number }, b: { year: number; month: number }) {
  if (a.year !== b.year) {
    return a.year - b.year;
  }

  return a.month - b.month;
}
