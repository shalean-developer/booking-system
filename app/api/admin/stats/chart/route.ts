import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get date range parameters
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    // Build date filter - default to last 30 days if no dates provided
    let bookingsQuery = supabase
      .from('bookings')
      .select('id, total_amount, created_at, status');

    if (dateFrom) {
      bookingsQuery = bookingsQuery.gte('created_at', dateFrom);
    } else {
      // Default to last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      bookingsQuery = bookingsQuery.gte('created_at', thirtyDaysAgo.toISOString());
    }

    if (dateTo) {
      const dateToEnd = new Date(dateTo);
      dateToEnd.setHours(23, 59, 59, 999);
      bookingsQuery = bookingsQuery.lte('created_at', dateToEnd.toISOString());
    }

    const { data: bookings, error: bookingsError } = await bookingsQuery
      .order('created_at', { ascending: true });

    if (bookingsError) {
      console.error('Error fetching bookings for chart:', bookingsError);
      return NextResponse.json({
        ok: true,
        data: [],
      });
    }

    // Group by date
    const chartDataMap = new Map<string, { date: string; revenue: number; bookings: number }>();

    bookings?.forEach((booking) => {
      const date = new Date(booking.created_at).toISOString().split('T')[0];
      const existing = chartDataMap.get(date) || { date, revenue: 0, bookings: 0 };
      existing.revenue += booking.total_amount || 0;
      existing.bookings += 1;
      chartDataMap.set(date, existing);
    });

    // Convert to array and format
    const chartData = Array.from(chartDataMap.values()).map((item) => ({
      date: item.date,
      revenue: item.revenue,
      bookings: item.bookings,
    }));

    return NextResponse.json({
      ok: true,
      data: chartData,
    });
  } catch (error) {
    console.error('Error fetching chart data:', error);
    return NextResponse.json({
      ok: true,
      data: [],
    });
  }
}

