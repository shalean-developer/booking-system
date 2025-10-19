import { NextRequest, NextResponse } from 'next/server';
import { getCleanerSession, createCleanerSupabaseClient } from '@/lib/cleaner-auth';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getCleanerSession();
    if (!session) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // pending, in-progress, completed
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const supabase = await createCleanerSupabaseClient();

    // Build query
    let query = supabase
      .from('bookings')
      .select('*')
      .eq('cleaner_id', session.id)
      .order('booking_date', { ascending: true })
      .order('booking_time', { ascending: true });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (startDate) {
      query = query.gte('booking_date', startDate);
    }

    if (endDate) {
      query = query.lte('booking_date', endDate);
    }

    const { data: bookings, error } = await query;

    if (error) {
      console.error('Error fetching bookings:', error);
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch bookings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      bookings: bookings || [],
    });
  } catch (error) {
    console.error('Error in cleaner bookings route:', error);
    return NextResponse.json(
      { ok: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
}

