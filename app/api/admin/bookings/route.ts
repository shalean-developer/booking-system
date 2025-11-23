import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');
    const search = searchParams.get('search') || '';

    let query = supabase
      .from('bookings')
      .select(`*, cleaners:cleaner_id (id, first_name, last_name, name)`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(
        `customer_name.ilike.%${search}%,customer_email.ilike.%${search}%,customer_phone.ilike.%${search}%,service_type.ilike.%${search}%`
      );
    }

    const { data: bookings, error } = await query;

    if (error) {
      console.error('Error fetching bookings:', error);
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch bookings' },
        { status: 500 }
      );
    }

    let countQuery = supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true });

    if (status && status !== 'all') {
      countQuery = countQuery.eq('status', status);
    }

    if (search) {
      countQuery = countQuery.or(
        `customer_name.ilike.%${search}%,customer_email.ilike.%${search}%,customer_phone.ilike.%${search}%,service_type.ilike.%${search}%`
      );
    }

    const { count } = await countQuery;

    const formattedBookings = (bookings || []).map((booking: any) => {
      const cleaners = booking.cleaners;
      const cleaner = Array.isArray(cleaners) ? cleaners[0] : cleaners;
      const cleanerName = cleaner?.name ||
                          `${cleaner?.first_name || ''} ${cleaner?.last_name || ''}`.trim() ||
                          null;

      return {
        id: booking.id,
        customer_name: booking.customer_name,
        customer_email: booking.customer_email,
        customer_phone: booking.customer_phone,
        service_type: booking.service_type,
        booking_date: booking.booking_date,
        booking_time: booking.booking_time,
        status: booking.status,
        total_amount: booking.total_amount,
        cleaner_id: booking.cleaner_id,
        cleaner_name: cleanerName,
        created_at: booking.created_at,
        updated_at: booking.updated_at,
      };
    });

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      ok: true,
      bookings: formattedBookings,
      total: count || 0,
      totalPages,
    });
  } catch (error) {
    console.error('Error in bookings API:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
