import { NextRequest, NextResponse } from 'next/server';
import { getCleanerSession, cleanerIdToUuid } from '@/lib/cleaner-auth';
import { createServiceClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getCleanerSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }
    const supabase = createServiceClient();
    const cleanerId = cleanerIdToUuid(session.id);
    const [settingsRes, cleanerRes, recipientRes] = await Promise.all([
      supabase.from('cleaner_payout_settings').select('*').eq('cleaner_id', cleanerId).maybeSingle(),
      supabase.from('cleaners').select('payout_schedule, payout_day').eq('id', cleanerId).maybeSingle(),
      supabase
        .from('payout_recipients')
        .select('bank_name, account_number, recipient_code')
        .eq('cleaner_id', cleanerId)
        .maybeSingle(),
    ]);
    if (settingsRes.error) {
      return NextResponse.json({ ok: false, error: settingsRes.error.message }, { status: 500 });
    }
    const row = settingsRes.data;
    const merged = {
      ...(row || {}),
      cleaner_id: cleanerId,
      payout_schedule: cleanerRes.data?.payout_schedule ?? 'weekly',
      payout_day: cleanerRes.data?.payout_day ?? 5,
      paystack_recipient: recipientRes.data ?? null,
    };
    return NextResponse.json({ ok: true, settings: merged });
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

    if (body.payout_schedule != null || body.payout_day != null) {
      const upd: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (body.payout_schedule === 'weekly' || body.payout_schedule === 'monthly') {
        upd.payout_schedule = body.payout_schedule;
      }
      if (body.payout_day !== undefined && body.payout_day !== null) {
        const n = Number(body.payout_day);
        if (Number.isFinite(n)) {
          upd.payout_day = Math.round(n);
        }
      }
      if (Object.keys(upd).length > 1) {
        const { error: cErr } = await supabase.from('cleaners').update(upd).eq('id', cleaner_id);
        if (cErr) {
          return NextResponse.json({ ok: false, error: cErr.message }, { status: 500 });
        }
      }
    }

    const hasBankFields = ['bank_name', 'account_holder', 'account_number', 'account_type', 'branch_code'].some(
      k => body[k] !== undefined && body[k] !== null && String(body[k]).trim() !== '',
    );

    if (hasBankFields) {
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
    }

    return NextResponse.json({ ok: true, settings: null });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

