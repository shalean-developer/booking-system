import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ ok: false, error: 'Unauthorized - No token provided' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = await createClient();

    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authUser) {
      return NextResponse.json({ ok: false, error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { bookingId, date, time } = body as { bookingId?: string; date?: string; time?: string };
    if (!bookingId || !date || !time) {
      return NextResponse.json({ ok: false, error: 'bookingId, date and time are required' }, { status: 400 });
    }

    // Find the customer by auth_user_id
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('auth_user_id', authUser.id)
      .maybeSingle();
    if (customerError || !customer) {
      return NextResponse.json({ ok: false, error: 'Customer profile not found' }, { status: 404 });
    }

    // Ensure the booking belongs to this customer
    const { data: booking, error: bookingFetchError } = await supabase
      .from('bookings')
      .select('id, customer_id')
      .eq('id', bookingId)
      .maybeSingle();
    if (bookingFetchError || !booking || booking.customer_id !== customer.id) {
      return NextResponse.json({ ok: false, error: 'Booking not found' }, { status: 404 });
    }

    const { error: updateError } = await supabase
      .from('bookings')
      .update({ booking_date: date, booking_time: time, status: 'pending' })
      .eq('id', bookingId);
    if (updateError) {
      return NextResponse.json({ ok: false, error: 'Failed to reschedule booking' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}


