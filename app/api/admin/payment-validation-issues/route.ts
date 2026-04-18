import { NextRequest, NextResponse } from 'next/server';
import { assertAdmin, createServiceClient } from '@/lib/supabase-server';
import { redactPaymentReference } from '@/lib/payment-integrity-log';

export const dynamic = 'force-dynamic';

type CounterRow = {
  payment_reference: string;
  failure_count: number;
  last_failure_type: string | null;
  updated_at: string;
};

async function lookupBookingSummary(
  supabase: ReturnType<typeof createServiceClient>,
  paymentRef: string,
): Promise<{ booking_id: string; payment_status: string | null } | null> {
  const ref = paymentRef.trim();
  if (!ref) return null;

  const { data: byPr } = await supabase
    .from('bookings')
    .select('id, payment_status')
    .eq('payment_reference', ref)
    .maybeSingle();
  if (byPr?.id) {
    return { booking_id: byPr.id, payment_status: (byPr as { payment_status?: string | null }).payment_status ?? null };
  }

  const { data: byPs } = await supabase
    .from('bookings')
    .select('id, payment_status')
    .eq('paystack_ref', ref)
    .maybeSingle();
  if (byPs?.id) {
    return { booking_id: byPs.id, payment_status: (byPs as { payment_status?: string | null }).payment_status ?? null };
  }

  const idCandidate = ref.startsWith('booking-') ? ref.slice('booking-'.length) : ref;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idCandidate)) {
    const { data: byId } = await supabase
      .from('bookings')
      .select('id, payment_status')
      .eq('id', idCandidate)
      .maybeSingle();
    if (byId?.id) {
      return { booking_id: byId.id, payment_status: (byId as { payment_status?: string | null }).payment_status ?? null };
    }
  }

  return null;
}

/**
 * GET /api/admin/payment-validation-issues?minFailures=3&limit=50
 * Operational view of payment validation failure counters (no raw Paystack references).
 */
export async function GET(req: NextRequest) {
  const denied = await assertAdmin();
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const minFailuresRaw = searchParams.get('minFailures');
  const limitRaw = searchParams.get('limit');

  const minFailures = Math.min(
    10_000,
    Math.max(1, minFailuresRaw ? parseInt(minFailuresRaw, 10) : 1),
  );
  const limit = Math.min(200, Math.max(1, limitRaw ? parseInt(limitRaw, 10) : 50));

  if (!Number.isFinite(minFailures) || !Number.isFinite(limit)) {
    return NextResponse.json({ ok: false, error: 'Invalid query parameters' }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: rows, error } = await supabase
    .from('payment_validation_failure_counters')
    .select('payment_reference, failure_count, last_failure_type, updated_at')
    .gte('failure_count', minFailures)
    .order('failure_count', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[admin/payment-validation-issues]', error);
    return NextResponse.json({ ok: false, error: 'Failed to load counters' }, { status: 500 });
  }

  const list = (rows || []) as CounterRow[];
  const issues = await Promise.all(
    list.map(async (row) => {
      const booking = await lookupBookingSummary(supabase, row.payment_reference);
      return {
        payment_reference_redacted: redactPaymentReference(row.payment_reference),
        failure_count: row.failure_count,
        last_failure_type: row.last_failure_type,
        updated_at: row.updated_at,
        booking_id: booking?.booking_id ?? null,
        payment_status: booking?.payment_status ?? null,
      };
    }),
  );

  return NextResponse.json({
    ok: true,
    minFailures,
    limit,
    count: issues.length,
    issues,
  });
}
