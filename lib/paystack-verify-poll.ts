import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import {
  fetchBookingForPaymentVerificationById,
  isBookingPaidInDatabase,
  parseBookingIdFromBookingPrefixedReference,
  resolveBookingForVerify,
} from '@/lib/booking-paid-server';

/** Never expose raw Postgres / internal errors to payment clients. */
export function pollPublicErrorMessage(internal?: string): string {
  const trimmed = internal?.trim();
  if (!trimmed) {
    return 'Could not verify payment. Please try again or contact support if you were charged.';
  }
  const lower = trimmed.toLowerCase();
  if (
    lower.includes('column') ||
    lower.includes('does not exist') ||
    lower.includes('relation ') ||
    lower.includes('permission denied')
  ) {
    return 'Could not verify payment. Please try again or contact support if you were charged.';
  }
  if (trimmed.length > 220) {
    return 'Could not verify payment. Please try again or contact support if you were charged.';
  }
  return trimmed;
}

/**
 * Polling-friendly verify: HTTP 200 with `{ status: 'success' | 'pending' | 'failed' }`.
 * **DB is authoritative:** success is returned only when the booking row is already paid
 * (typically via Paystack `charge.success` webhook). While still pending, returns `pending`
 * so the client keeps polling — no client-side finalize from Paystack API alone.
 */
export async function handlePaystackVerifyPoll(req: Request): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const referenceParam =
    searchParams.get('reference')?.trim() || searchParams.get('trxref')?.trim() || '';

  if (!referenceParam) {
    return NextResponse.json(
      { status: 'failed' as const, message: 'reference is required', success: false },
      { status: 200 },
    );
  }

  let bookingIdHint =
    searchParams.get('booking_id')?.trim() ||
    searchParams.get('id')?.trim() ||
    searchParams.get('ref')?.trim() ||
    '';
  if (!bookingIdHint && referenceParam.startsWith('booking-')) {
    bookingIdHint = parseBookingIdFromBookingPrefixedReference(referenceParam) ?? '';
  }

  let supabase;
  try {
    supabase = createServiceClient();
  } catch {
    return NextResponse.json(
      { status: 'failed' as const, message: 'Server configuration error', success: false },
      { status: 200 },
    );
  }

  const { booking, error: resolveErr } = await resolveBookingForVerify(
    supabase,
    referenceParam,
    bookingIdHint || null,
  );
  if (resolveErr) {
    console.error('[paystack-verify-poll] resolve', resolveErr);
    return NextResponse.json({
      status: 'failed' as const,
      message: pollPublicErrorMessage(resolveErr),
      success: false,
    });
  }
  if (!booking) {
    return NextResponse.json({
      status: 'failed' as const,
      message: 'Booking not found',
      success: false,
    });
  }

  const fresh = await fetchBookingForPaymentVerificationById(supabase, booking.id);
  const row = fresh ?? booking;

  if (isBookingPaidInDatabase(row)) {
    const amount_zar = Math.round(Number(row.total_amount ?? 0)) / 100;
    return NextResponse.json({
      status: 'success' as const,
      ok: true,
      success: true,
      duplicate: true,
      bookingId: row.id,
      booking_id: row.id,
      zoho_invoice_id: row.zoho_invoice_id ?? null,
      amount_zar,
      message: 'Already confirmed',
      service_type: row.service_type,
      customer_name: row.customer_name,
    });
  }

  return NextResponse.json({
    status: 'pending' as const,
    message:
      'We are confirming your payment. This page will update automatically once your booking is marked paid (usually within a few seconds).',
    success: false,
  });
}
