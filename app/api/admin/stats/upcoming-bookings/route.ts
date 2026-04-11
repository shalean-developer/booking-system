import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });
    }

    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const dateFrom = searchParams.get('date_from') || new Date().toISOString().split('T')[0];

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
        total_amount,
        cleaner_id,
        cleaners:cleaner_id (
          id,
          name
        )
      `)
      .gte('booking_date', dateFrom)
      .in('status', ['pending', 'confirmed', 'accepted', 'paid', 'in-progress', 'on_my_way'])
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

    const transformedBookings = (bookings || []).map((booking: Record<string, unknown>) => {
      const cleaners = booking.cleaners as { name?: string } | null;
      return {
        ...booking,
        cleaner_name: cleaners?.name ?? null,
      };
    });

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





































































