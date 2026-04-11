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
      .select('id, customer_email, total_amount, status, payment_reference, paystack_ref')
      .eq('id', booking_id)
      .maybeSingle();

    if (error || !booking) {
      return NextResponse.json({ ok: false, error: 'Booking not found' }, { status: 404 });
    }

    if (booking.status !== 'pending' || booking.payment_reference || booking.paystack_ref) {
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

    const reference = `booking-${booking.id}`;
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
    let callbackUrl = `${base}/booking/confirmation?reference=${encodeURIComponent(reference)}&ref=${encodeURIComponent(booking.id)}`;
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

    return NextResponse.json({
      ok: true,
      authorization_url: data.data.authorization_url,
      reference: data.data.reference,
    });
  } catch (e) {
    console.error('[api/paystack/initialize]', e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Initialize failed' },
      { status: 500 },
    );
  }
}
