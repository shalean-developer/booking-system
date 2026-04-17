import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { isValidManageTokenFormat } from '@/lib/manage-booking-token';
import {
  canManageBooking,
  isBookingDateInPast,
  type BookingRowForManage,
} from '@/lib/booking-manage';
import { sendBookingCancelledNotice } from '@/lib/booking-manage-notify';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { token?: string } | null;
  const token = body?.token?.trim();

  if (!isValidManageTokenFormat(token)) {
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });
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
      { ok: false, error: 'This booking can no longer be cancelled online.' },
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
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', booking.id);

  if (upErr) {
    console.error('[booking/cancel]', upErr);
    return NextResponse.json({ ok: false, error: 'Could not cancel booking' }, { status: 500 });
  }

  await sendBookingCancelledNotice(booking.customer_email);

  return NextResponse.json({ ok: true });
}
