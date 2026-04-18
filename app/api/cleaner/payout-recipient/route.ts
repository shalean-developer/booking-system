import { NextRequest, NextResponse } from 'next/server';
import { getCleanerSession, cleanerIdToUuid, createCleanerSupabaseClient } from '@/lib/cleaner-auth';
import { createPaystackTransferRecipient } from '@/lib/paystack';

export const dynamic = 'force-dynamic';

/**
 * POST /api/cleaner/payout-recipient
 * Register bank details with Paystack and store `recipient_code` for automatic payouts.
 * Body: { name, account_number, bank_code, currency? } — must match Paystack country (e.g. ZAR + SA bank_code).
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getCleanerSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const name = String(body.name || session.name || '').trim();
    const account_number = String(body.account_number || '').trim();
    const bank_code = String(body.bank_code || '').trim();
    const currency = String(body.currency || process.env.PAYSTACK_PAYOUT_CURRENCY || 'ZAR').trim();
    const type = String(body.type || process.env.PAYSTACK_RECIPIENT_TYPE || 'basa').trim();

    if (!account_number || !bank_code) {
      return NextResponse.json(
        { ok: false, error: 'account_number and bank_code are required' },
        { status: 400 }
      );
    }

    const created = await createPaystackTransferRecipient({
      type,
      name: name || 'Cleaner',
      currency,
      account_number,
      bank_code,
    });

    if (!created.ok) {
      return NextResponse.json({ ok: false, error: created.message, details: created.raw }, { status: 400 });
    }

    const cleanerId = cleanerIdToUuid(session.id);
    const supabase = await createCleanerSupabaseClient();

    const { error: upsertErr } = await supabase.from('payout_recipients').upsert(
      {
        cleaner_id: cleanerId,
        recipient_code: created.recipient_code,
        bank_name: body.bank_name ?? null,
        account_number,
        created_at: new Date().toISOString(),
      },
      { onConflict: 'cleaner_id' }
    );

    if (upsertErr) {
      console.error('[payout-recipient] upsert', upsertErr);
      return NextResponse.json(
        { ok: false, error: 'Paystack OK but failed to save recipient — contact support', recipient_code: created.recipient_code },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      recipient_code: created.recipient_code,
    });
  } catch (e) {
    console.error('[payout-recipient]', e);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
