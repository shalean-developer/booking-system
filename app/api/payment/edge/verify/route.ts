import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import {
  fetchBookingForPaymentVerificationById,
  isBookingPaidInDatabase,
} from '@/lib/booking-paid-server';

export const dynamic = 'force-dynamic';

/**
 * Edge-style verify: reads booking payment state from DB (same as polling verify).
 * Fulfillment is performed by the Paystack webhook, not this route.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const reference = typeof body.reference === 'string' ? body.reference.trim() : '';
    const booking_id = typeof body.booking_id === 'string' ? body.booking_id.trim() : '';

    if (!reference || !booking_id) {
      return NextResponse.json({ ok: false, error: 'reference and booking_id are required' }, { status: 400 });
    }

    const expected = `booking-${booking_id}`;
    if (reference !== booking_id && reference !== expected) {
      return NextResponse.json({ ok: false, error: 'reference must match this booking' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const booking = await fetchBookingForPaymentVerificationById(supabase, booking_id);

    if (!booking) {
      return NextResponse.json({ ok: false, error: 'Booking not found' }, { status: 404 });
    }

    if (!isBookingPaidInDatabase(booking)) {
      return NextResponse.json({
        ok: false,
        status: 'pending',
        error:
          'Payment not confirmed in our records yet. Wait for webhook processing or poll again shortly.',
      });
    }

    const amount_zar = Math.round(Number(booking.total_amount ?? 0)) / 100;

    return NextResponse.json({
      ok: true,
      duplicate: true,
      booking_id: booking.id,
      zoho_invoice_id: booking.zoho_invoice_id ?? null,
      amount_zar,
      service_type: booking.service_type,
      customer_name: booking.customer_name,
    });
  } catch (e) {
    console.error('[payment/edge/verify]', e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Verification failed' },
      { status: 500 },
    );
  }
}
