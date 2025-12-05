import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  console.log('[API] /api/admin/stats/chart - Request started');
  
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
    // Use booking_date (when service is scheduled) instead of created_at
    let bookingsQuery = supabase
      .from('bookings')
      .select('id, total_amount, booking_date, status');

    // Helper function to get local date string (YYYY-MM-DD) to avoid timezone issues
    const getLocalDateString = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Convert date range to date strings for booking_date (DATE field)
    // Use local date to avoid timezone issues
    let dateFromStr: string;
    let dateToStr: string;

    if (dateFrom) {
      const dateFromDate = new Date(dateFrom);
      dateFromStr = getLocalDateString(dateFromDate);
      bookingsQuery = bookingsQuery.gte('booking_date', dateFromStr);
    } else {
      // Default to last 30 days, starting from beginning of day
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      dateFromStr = getLocalDateString(thirtyDaysAgo);
      bookingsQuery = bookingsQuery.gte('booking_date', dateFromStr);
    }

    if (dateTo) {
      const dateToDate = new Date(dateTo);
      dateToStr = getLocalDateString(dateToDate);
      bookingsQuery = bookingsQuery.lte('booking_date', dateToStr);
    } else {
      // Default to today (local date)
      dateToStr = getLocalDateString(new Date());
      bookingsQuery = bookingsQuery.lte('booking_date', dateToStr);
    }

    const { data: bookings, error: bookingsError } = await bookingsQuery
      .order('booking_date', { ascending: true });

    if (bookingsError) {
      console.error('Error fetching bookings for chart:', bookingsError);
      return NextResponse.json({
        ok: true,
        data: [],
      });
    }

    // Group by booking_date (when service is scheduled)
    const chartDataMap = new Map<string, { date: string; revenue: number; bookings: number }>();

    bookings?.forEach((booking) => {
      // booking_date is already a date string (YYYY-MM-DD)
      const date = booking.booking_date || '';
      if (!date) return; // Skip bookings without a booking_date
      
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

    const totalDuration = Date.now() - startTime;
    console.log(`[API] /api/admin/stats/chart - Success (${totalDuration}ms), data points: ${chartData.length}`);

    return NextResponse.json({
      ok: true,
      data: chartData,
    });
  } catch (error: any) {
    const totalDuration = Date.now() - startTime;
    console.error(`[API] /api/admin/stats/chart - Error after ${totalDuration}ms:`, {
      error: error.message,
      stack: error.stack,
      name: error.name,
    });
    return NextResponse.json({
      ok: true,
      data: [],
    });
  }
}

