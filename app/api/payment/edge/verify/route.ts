import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import type { BookingPaidRow } from '@/lib/booking-paid-server';
import { fulfillPaidBooking, paystackVerifyDetailed } from '@/lib/booking-paid-server';

export const dynamic = 'force-dynamic';

/**
 * Verify Paystack + fulfill booking on the Next.js server (same pipeline as /api/payment/verify).
 * Replaces the old Supabase Edge Function proxy.
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

    const secret = process.env.PAYSTACK_SECRET_KEY?.trim();
    if (!secret) {
      return NextResponse.json({ ok: false, error: 'Payment provider not configured' }, { status: 500 });
    }

    const verified = await paystackVerifyDetailed(secret, reference);
    if (verified.outcome !== 'success') {
      const msg =
        verified.outcome === 'pending'
          ? verified.detail || 'Payment not confirmed yet'
          : verified.reason;
      return NextResponse.json({ ok: false, error: msg }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(
        'id, cleaner_id, booking_date, booking_time, expected_end_time, service_type, customer_name, customer_email, customer_phone, address_line1, address_suburb, address_city, total_amount, price, tip_amount, service_fee, frequency_discount, frequency, surge_pricing_applied, surge_amount, requires_team, notes, price_snapshot, status, payment_reference, paystack_ref, zoho_invoice_id, invoice_url, payment_status, equipment_required, equipment_fee, manage_token',
      )
      .eq('id', booking_id)
      .maybeSingle();

    if (error || !booking) {
      return NextResponse.json({ ok: false, error: 'Booking not found' }, { status: 404 });
    }

    const result = await fulfillPaidBooking({
      supabase,
      booking: booking as BookingPaidRow,
      reference,
      paystackAmountKobo: verified.amountKobo,
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error ?? 'Finalize failed' }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      duplicate: result.duplicate === true,
      booking_id: booking.id,
      zoho_invoice_id: result.zoho_invoice_id ?? null,
      amount_zar: verified.amountKobo / 100,
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
