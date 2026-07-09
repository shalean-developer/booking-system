import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import {
  fetchBookingForPaymentVerificationById,
  isBookingPaidInDatabase,
  parseBookingIdFromBookingPrefixedReference,
  resolveBookingForVerify,
} from '@/lib/booking-paid-server';
import { pollPublicErrorMessage } from '@/lib/paystack-verify-poll';

export const dynamic = 'force-dynamic';

type PaystackProbe = 'success' | 'pending' | 'failed';

/**
 * GET /api/paystack/verify
 *
 * **Primary:** booking row from Postgres (via Supabase) — same reference resolution as checkout
 * (`paystack_ref`, `payment_reference`, `booking-{uuid}-…`).
 *
 * **Optional:** if DB is still `pending`, one Paystack `transaction/verify` call is made for
 * diagnostics / UX hints only (`paystack_probe`). Fulfillment stays on the signed webhook.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const reference =
    searchParams.get('reference')?.trim() || searchParams.get('trxref')?.trim() || '';

  if (!reference) {
    const body = {
      status: 'not_found' as const,
      success: false,
      message: 'reference is required',
    };
    return NextResponse.json(body, { status: 200 });
  }

  let supabase;
  try {
    supabase = createServiceClient();
  } catch {
    return NextResponse.json(
      { status: 'failed' as const, success: false, message: 'Server configuration error' },
      { status: 200 },
    );
  }

  let bookingIdHint =
    searchParams.get('booking_id')?.trim() ||
    searchParams.get('id')?.trim() ||
    searchParams.get('ref')?.trim() ||
    '';
  if (!bookingIdHint && reference.startsWith('booking-')) {
    bookingIdHint = parseBookingIdFromBookingPrefixedReference(reference) ?? '';
  }

  const { booking, error: resolveErr } = await resolveBookingForVerify(
    supabase,
    reference,
    bookingIdHint || null,
  );

  if (resolveErr) {
    return NextResponse.json(
      {
        status: 'failed' as const,
        success: false,
        message: pollPublicErrorMessage(resolveErr),
      },
      { status: 200 },
    );
  }

  if (!booking) {
    return NextResponse.json(
      {
        status: 'not_found' as const,
        success: false,
        message: 'Booking not found',
      },
      { status: 200 },
    );
  }

  const row = (await fetchBookingForPaymentVerificationById(supabase, booking.id)) ?? booking;
  const bookingStatusRaw = String(row.status || '').toLowerCase();

  if (isBookingPaidInDatabase(row)) {
    const amount_zar = Math.round(Number(row.total_amount ?? 0)) / 100;
    const body = {
      status: 'success' as const,
      booking_status: 'paid' as const,
      ok: true,
      success: true,
      duplicate: true,
      bookingId: row.id,
      booking_id: row.id,
      zoho_invoice_id: row.zoho_invoice_id ?? null,
      amount_zar,
      message: 'Confirmed from database',
      service_type: row.service_type,
      customer_name: row.customer_name,
    };
    return NextResponse.json(body, { status: 200 });
  }

  let paystack_probe: PaystackProbe | null = null;
  const secret = process.env.PAYSTACK_SECRET_KEY?.trim();
  if (secret && bookingStatusRaw === 'pending') {
    const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: {
        Authorization: `Bearer ${secret}`,
      },
    });
    const data = (await res.json()) as { data?: { status?: string } };

    if (data?.data?.status === 'success') {
      const now = new Date().toISOString();
      await supabase
        .from('bookings')
        .update({
          status: 'paid',
          paystack_verified_at: now,
          updated_at: now,
        })
        .eq('id', row.id)
        .eq('status', 'pending');

      return NextResponse.json(
        {
          status: 'success' as const,
          success: true,
          recovered: true,
          bookingId: row.id,
          booking_id: row.id,
        },
        { status: 200 },
      );
    }

    paystack_probe = 'pending';
  }

  const body = {
    status: 'pending' as const,
    success: false,
    booking_status: bookingStatusRaw || 'pending',
    bookingId: row.id,
    booking_id: row.id,
    message:
      'We are confirming your payment. This page will update automatically once your booking is marked paid (usually within a few seconds).',
    paystack_probe,
  };

  return NextResponse.json(body, { status: 200 });
}
