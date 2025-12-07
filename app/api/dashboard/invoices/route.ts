import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * API endpoint to fetch upcoming invoices for customer
 * Requires authentication
 */
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = await createClient();
    
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !authUser) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // Find customer profile
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('auth_user_id', authUser.id)
      .maybeSingle();

    if (customerError || !customer) {
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch customer profile' },
        { status: 500 }
      );
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Fetch upcoming bookings without payment (these are invoices)
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, booking_date, total_amount, service_type, created_at')
      .eq('customer_id', customer.id)
      .gte('booking_date', today.toISOString().split('T')[0])
      .is('payment_reference', null)
      .neq('status', 'cancelled')
      .neq('status', 'canceled')
      .order('booking_date', { ascending: true });

    if (bookingsError) {
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch invoices' },
        { status: 500 }
      );
    }

    // Transform bookings into invoice format
    const invoices = (bookings || []).map(booking => ({
      id: booking.id,
      bookingId: booking.id,
      amount: booking.total_amount,
      dueDate: booking.booking_date,
      serviceType: booking.service_type,
      createdAt: booking.created_at,
      status: new Date(booking.booking_date) < now ? 'overdue' : 'pending',
    }));

    return NextResponse.json({
      ok: true,
      invoices,
    });

  } catch (error) {
    console.error('Error in invoices route:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
