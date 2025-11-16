import { NextRequest, NextResponse } from 'next/server';
import { getCleanerSession, cleanerIdToUuid } from '@/lib/cleaner-auth';
import { createServiceClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getCleanerSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }
    const supabase = createServiceClient();
    const cleaner_id = cleanerIdToUuid(session.id);
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('cleaner_id', cleaner_id)
      .maybeSingle();
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, preferences: data || null });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getCleanerSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    const supabase = createServiceClient();
    const cleaner_id = cleanerIdToUuid(session.id);

    const payload = {
      cleaner_id,
      email_opt_in: !!body.email_opt_in,
      whatsapp_opt_in: !!body.whatsapp_opt_in,
      // basic sanitation
      email: (body.email ?? '').toString().slice(0, 160),
      phone: (body.phone ?? '').toString().slice(0, 32),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('notification_preferences')
      .upsert(payload, { onConflict: 'cleaner_id' })
      .select()
      .maybeSingle();
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, preferences: data });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500 }
    );
  }
}


