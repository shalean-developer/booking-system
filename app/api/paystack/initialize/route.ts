import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { createBookingLookupToken } from '@/lib/booking-lookup-token';
import { resolvePublicBaseUrl } from '@/lib/public-base-url';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY?.trim();
    if (!secret) {
      return NextResponse.json({ ok: false, error: 'Payment provider not configured' }, { status: 500 });
    }

    const body = await req.json();
    const booking_id = typeof body.booking_id === 'string' ? body.booking_id.trim() : '';

    if (!booking_id) {
      return NextResponse.json({ ok: false, error: 'booking_id is required' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('id, customer_email, total_amount, status, payment_reference, paystack_ref, pricing_snapshot_id')
      .eq('id', booking_id)
      .maybeSingle();

    if (error || !booking) {
      return NextResponse.json({ ok: false, error: 'Booking not found' }, { status: 404 });
    }

    const statusNorm = String(booking.status || '').toLowerCase();
    const hasPaymentRef = Boolean(String(booking.payment_reference || '').trim());

    if (statusNorm === 'paid' || hasPaymentRef) {
      return NextResponse.json(
        { ok: false, code: 'ALREADY_PAID', error: 'This booking is already paid' },
        { status: 409 },
      );
    }

    const existingRef = String(booking.paystack_ref || '').trim();
    if (existingRef && !hasPaymentRef) {
      return NextResponse.json(
        {
          ok: false,
          code: 'PAYMENT_LINK_ACTIVE',
          error:
            'A payment was already started for this booking. Complete checkout in your browser or open your payment status page. Contact support if you need a new payment link.',
        },
        { status: 409 },
      );
    }

    if (statusNorm !== 'pending') {
      return NextResponse.json({ ok: false, error: 'Booking is not available for payment' }, { status: 409 });
    }

    const email = (booking.customer_email || '').trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ ok: false, error: 'Booking has no customer email' }, { status: 400 });
    }

    const kobo = Math.round(Number(booking.total_amount ?? 0));
    if (!Number.isFinite(kobo) || kobo < 100) {
      return NextResponse.json({ ok: false, error: 'Invalid booking amount' }, { status: 400 });
    }

    let snapshotMeta: { snapshot_id: string; pricing_hash: string; pricing_version: string } | null = null;
    if (booking.pricing_snapshot_id) {
      const { data: snap, error: snapErr } = await supabase
        .from('booking_pricing_snapshots')
        .select('id, pricing_hash, pricing_version, final_price')
        .eq('id', booking.pricing_snapshot_id)
        .maybeSingle();
      if (snapErr || !snap) {
        return NextResponse.json({ ok: false, error: 'Pricing snapshot not found' }, { status: 400 });
      }
      const expectedMinor = Math.round(Number(snap.final_price) * 100);
      if (!Number.isFinite(expectedMinor) || Math.abs(expectedMinor - kobo) > 1) {
        return NextResponse.json({ ok: false, error: 'Booking amount does not match locked pricing' }, { status: 409 });
      }
      snapshotMeta = {
        snapshot_id: snap.id,
        pricing_hash: snap.pricing_hash,
        pricing_version: snap.pricing_version,
      };
    }

    const reference = `booking-${booking.id}-${Date.now()}`;
    const base = resolvePublicBaseUrl(req);
    if (!base) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Could not determine public site URL for Paystack callbacks. Set NEXT_PUBLIC_BASE_URL (or NEXT_PUBLIC_SITE_URL) in .env.local — e.g. http://localhost:3000 for local dev, or your production domain.',
        },
        { status: 500 },
      );
    }

    const ct = createBookingLookupToken(booking.id);
    let callbackUrl = `${base}/payment/status?reference=${encodeURIComponent(reference)}&ref=${encodeURIComponent(booking.id)}`;
    if (ct) {
      callbackUrl += `&ct=${encodeURIComponent(ct)}`;
    }

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: kobo,
        reference,
        callback_url: callbackUrl,
        metadata: {
          booking_id: booking.id,
          ...(snapshotMeta
            ? {
                snapshot_id: snapshotMeta.snapshot_id,
                pricing_hash: snapshotMeta.pricing_hash,
                pricing_version: snapshotMeta.pricing_version,
              }
            : {}),
        },
      }),
    });

    const data = await response.json();

    if (!response.ok || !data?.status) {
      return NextResponse.json(
        { ok: false, error: data?.message || 'Paystack init failed' },
        { status: 400 },
      );
    }

    const paystackAuthorizationUrl =
      typeof data?.data?.authorization_url === 'string' ? data.data.authorization_url.trim() : '';
    const paystackReference =
      typeof data?.data?.reference === 'string' && data.data.reference.trim()
        ? data.data.reference.trim()
        : reference;
    if (!paystackAuthorizationUrl || !paystackReference) {
      return NextResponse.json(
        { ok: false, error: 'Paystack init returned invalid response' },
        { status: 502 },
      );
    }

    const { data: persistedBooking, error: persistErr } = await supabase
      .from('bookings')
      .update({ paystack_ref: paystackReference })
      .eq('id', booking_id)
      .eq('status', 'pending')
      .select('id')
      .maybeSingle();
    if (persistErr || !persistedBooking) {
      console.error('[api/paystack/initialize] paystack_ref persist failed', {
        booking_id,
        reference: paystackReference,
        error: persistErr?.message ?? 'No pending booking row updated',
      });
      return NextResponse.json(
        { ok: false, error: 'Failed to save payment reference. Please try again.' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      authorization_url: paystackAuthorizationUrl,
      reference: paystackReference,
      booking_id: booking_id,
    });
  } catch (e) {
    console.error('[api/paystack/initialize]', e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Initialize failed' },
      { status: 500 },
    );
  }
}
