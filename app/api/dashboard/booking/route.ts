import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const bookingId = url.searchParams.get('id');
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (!bookingId) {
      return NextResponse.json({ ok: false, error: 'Missing booking id' }, { status: 400 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = await createClient();

    const { data: { user: authUser } } = await supabase.auth.getUser(token);
    if (!authUser) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('auth_user_id', authUser.id)
      .maybeSingle();
    if (!customer) {
      return NextResponse.json({ ok: false, error: 'Customer not found' }, { status: 404 });
    }

    const { data: booking, error } = await supabase
      .from('bookings')
      .select('id, service_type, bedrooms, bathrooms, extras, notes, customer_name, customer_email, customer_phone, address_line1, address_suburb, address_city, total_amount')
      .eq('id', bookingId)
      .eq('customer_id', customer.id)
      .maybeSingle();
    if (error || !booking) {
      return NextResponse.json({ ok: false, error: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, booking });
  } catch (err) {
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}


