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
    const upcoming = searchParams.get('upcoming') === 'true';

    let query = supabase
      .from('bookings')
      .select(`
        id,
        customer_name,
        service_type,
        booking_date,
        booking_time,
        recurring_schedule_id
      `)
      .not('recurring_schedule_id', 'is', null)
      .order('booking_date', { ascending: true })
      .limit(limit);

    if (upcoming) {
      const today = new Date().toISOString().split('T')[0];
      query = query.gte('booking_date', today);
    }

    const { data: bookings, error } = await query;

    if (error) {
      console.error('Error fetching recurring bookings:', error);
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch recurring bookings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      bookings: bookings || [],
    });
  } catch (error: any) {
    console.error('Error in recurring-bookings GET API:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
































































