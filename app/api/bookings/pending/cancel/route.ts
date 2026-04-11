import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { isSafeBookingLookupId } from '@/lib/booking-lookup-id';

/**
 * Cancel an unpaid pending booking (no payment started) so the customer can checkout again.
 * Verifies email matches the booking — same trust model as duplicate detection on POST /pending.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { bookingId?: string; email?: string };
    const bookingId = typeof body.bookingId === 'string' ? body.bookingId.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

    if (!bookingId || !email) {
      return NextResponse.json({ ok: false, error: 'bookingId and email are required' }, { status: 400 });
    }
    if (!isSafeBookingLookupId(bookingId)) {
      return NextResponse.json({ ok: false, error: 'Invalid booking reference' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('id, customer_email, status, payment_reference, paystack_ref')
      .eq('id', bookingId)
      .maybeSingle();

    if (error || !booking) {
      return NextResponse.json({ ok: false, error: 'Booking not found' }, { status: 404 });
    }

    const bookingEmail = (booking.customer_email || '').trim().toLowerCase();
    if (bookingEmail !== email) {
      return NextResponse.json({ ok: false, error: 'Email does not match this booking' }, { status: 403 });
    }

    if (booking.status !== 'pending') {
      return NextResponse.json(
        { ok: false, error: 'Only unpaid pending bookings can be cancelled here' },
        { status: 409 },
      );
    }

    if (booking.payment_reference || booking.paystack_ref) {
      return NextResponse.json(
        { ok: false, error: 'This booking already has a payment in progress. Use Pay or contact support.' },
        { status: 409 },
      );
    }

    const { error: updateError } = await supabase
      .from('bookings')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', bookingId);

    if (updateError) {
      console.error('[bookings/pending/cancel]', updateError);
      return NextResponse.json({ ok: false, error: 'Could not cancel booking' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: 'Booking cancelled' });
  } catch (e) {
    console.error('[bookings/pending/cancel]', e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Failed to cancel' },
      { status: 500 },
    );
  }
}
