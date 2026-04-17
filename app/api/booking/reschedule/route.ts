import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { isValidManageTokenFormat } from '@/lib/manage-booking-token';
import {
  canManageBooking,
  isBookingDateInPast,
  type BookingRowForManage,
} from '@/lib/booking-manage';
import { sendBookingRescheduledNotice } from '@/lib/booking-manage-notify';
import { STANDARD_BOOKING_TIME_IDS } from '@/lib/booking-time-slots';

export const dynamic = 'force-dynamic';

const ALLOWED_TIMES = new Set<string>(STANDARD_BOOKING_TIME_IDS);

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    token?: string;
    booking_date?: string;
    booking_time?: string;
  } | null;

  const token = body?.token?.trim();
  const booking_date = body?.booking_date?.trim();
  const booking_time = body?.booking_time?.trim();

  if (!isValidManageTokenFormat(token) || !booking_date || !booking_time) {
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(booking_date)) {
    return NextResponse.json({ ok: false, error: 'Invalid date' }, { status: 400 });
  }

  if (!ALLOWED_TIMES.has(booking_time)) {
    return NextResponse.json({ ok: false, error: 'Invalid time slot' }, { status: 400 });
  }

  if (isBookingDateInPast(booking_date)) {
    return NextResponse.json({ ok: false, error: 'Please choose a future date.' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const normalized = token!.toLowerCase();

  const { data: row, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('manage_token', normalized)
    .maybeSingle();

  if (error || !row) {
    return NextResponse.json({ ok: false, error: 'Invalid or expired link' }, { status: 404 });
  }

  const booking = row as BookingRowForManage;

  if (!canManageBooking(booking)) {
    return NextResponse.json(
      { ok: false, error: 'This booking can no longer be changed online.' },
      { status: 400 },
    );
  }

  if (isBookingDateInPast(booking.booking_date)) {
    return NextResponse.json(
      { ok: false, error: 'This booking has already passed.' },
      { status: 400 },
    );
  }

  const { error: upErr } = await supabase
    .from('bookings')
    .update({
      booking_date,
      booking_time,
      updated_at: new Date().toISOString(),
    })
    .eq('id', booking.id);

  if (upErr) {
    console.error('[booking/reschedule]', upErr);
    return NextResponse.json({ ok: false, error: 'Could not update booking' }, { status: 500 });
  }

  await sendBookingRescheduledNotice(booking.customer_email, {
    bookingDate: booking_date,
    bookingTime: booking_time,
  });

  return NextResponse.json({ ok: true });
}
