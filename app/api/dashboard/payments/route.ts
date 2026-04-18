import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { isCancelledBooking, isCompletedBooking } from '@/shared/dashboard-data';
import { getBookingRevenueCents } from '@/shared/finance-engine';

/**
 * API endpoint to fetch customer payment history and outstanding balances
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

    // Fetch bookings with payment information
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, booking_date, total_amount, payment_reference, status, created_at')
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (bookingsError) {
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch bookings' },
        { status: 500 }
      );
    }

    // Calculate outstanding balance (bookings with payment_reference but status not completed)
    const outstandingBalance = (bookings || []).reduce((total, booking) => {
      // If booking has payment_reference, it's paid
      // If no payment_reference and status is not cancelled, it's outstanding
      if (
        !booking.payment_reference &&
        !isCancelledBooking(booking.status) &&
        !isCompletedBooking(booking.status)
      ) {
        return total + getBookingRevenueCents(booking);
      }
      return total;
    }, 0);

    // Get recent payments (bookings with payment_reference)
    const recentPayments = (bookings || [])
      .filter(b => b.payment_reference)
      .slice(0, 10)
      .map(b => ({
        id: b.id,
        date: b.created_at,
        amount: b.total_amount || 0,
        reference: b.payment_reference,
        status: isCompletedBooking(b.status) ? ('paid' as const) : ('pending' as const),
      }));

    // Get next invoice (upcoming booking without payment)
    const upcomingBookings = (bookings || [])
      .filter(b => {
        const bookingDate = new Date(b.booking_date);
        return (
          bookingDate >= new Date() &&
          !b.payment_reference &&
          !isCancelledBooking(b.status)
        );
      })
      .sort((a, b) => new Date(a.booking_date).getTime() - new Date(b.booking_date).getTime());

    const nextInvoice = upcomingBookings.length > 0 ? {
      id: upcomingBookings[0].id,
      date: upcomingBookings[0].booking_date,
      amount: upcomingBookings[0].total_amount,
      dueDate: upcomingBookings[0].booking_date,
    } : null;

    return NextResponse.json({
      ok: true,
      outstandingBalance,
      recentPayments,
      nextInvoice,
    });

  } catch (error) {
    console.error('Error in payments route:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
