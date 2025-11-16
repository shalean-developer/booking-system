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
    // Use service role to bypass RLS; we still authorize via cleaner session above
    const supabase = createServiceClient();
    const cleanerId = cleanerIdToUuid(session.id);
    const { data, error } = await supabase
      .from('cleaner_payout_settings')
      .select('*')
      .eq('cleaner_id', cleanerId)
      .maybeSingle();
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, settings: data || null });
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
    // Use service role to bypass RLS for inserts/updates
    const supabase = createServiceClient();
    const cleaner_id = cleanerIdToUuid(session.id);

    const payload = {
      cleaner_id,
      bank_name: (body.bank_name ?? '').toString().slice(0, 120),
      account_holder: (body.account_holder ?? '').toString().slice(0, 160),
      account_number: (body.account_number ?? '').toString().slice(0, 64),
      account_type: (body.account_type ?? '').toString().slice(0, 40),
      branch_code: (body.branch_code ?? '').toString().slice(0, 32),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('cleaner_payout_settings')
      .upsert(payload, { onConflict: 'cleaner_id' })
      .select()
      .maybeSingle();
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, settings: data });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// no-op


