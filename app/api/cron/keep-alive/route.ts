import { getServerSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Llamado a diario por el cron de Vercel (vercel.json). Hace una consulta
// mínima para que Supabase no pause el proyecto por inactividad.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }

  const supabase = getServerSupabase();

  if (!supabase) {
    return Response.json({ ok: false, error: 'Supabase no configurado' }, { status: 500 });
  }

  const { error } = await supabase.from('accounts').select('id', { head: true, count: 'exact' }).limit(1);

  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true, pingedAt: new Date().toISOString() });
}
