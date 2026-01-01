import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const dateFrom = searchParams.get('date_from') || new Date().toISOString().split('T')[0];

    // Fetch upcoming bookings
    let bookingsQuery = supabase
      .from('bookings')
      .select(`
        id,
        booking_date,
        booking_time,
        service_type,
        status,
        customer_name,
        address_suburb,
        cleaner_id,
        cleaners:cleaner_id (
          id,
          first_name,
          last_name
        )
      `)
      .gte('booking_date', dateFrom)
      .in('status', ['pending', 'confirmed', 'accepted'])
      .order('booking_date', { ascending: true })
      .order('booking_time', { ascending: true })
      .limit(limit);

    const { data: bookings, error } = await bookingsQuery;

    if (error) {
      console.error('Error fetching upcoming bookings:', error);
      return NextResponse.json({
        ok: true,
        bookings: [],
      });
    }

    // Transform to include cleaner name
    const transformedBookings = (bookings || []).map((booking: any) => ({
      ...booking,
      cleaner_name: booking.cleaners
        ? `${booking.cleaners.first_name || ''} ${booking.cleaners.last_name || ''}`.trim()
        : null,
    }));

    return NextResponse.json({
      ok: true,
      bookings: transformedBookings,
    });
  } catch (error) {
    console.error('Error in upcoming bookings API:', error);
    return NextResponse.json({
      ok: true,
      bookings: [],
    });
  }
}
































































