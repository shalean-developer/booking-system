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

    // Get date range parameters
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    // Build query
    let bookingsQuery = supabase
      .from('bookings')
      .select('service_type, total_amount');

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

    const { data: bookings, error } = await bookingsQuery;

    if (error) {
      console.error('Error fetching service breakdown:', error);
      return NextResponse.json({
        ok: true,
        data: [],
      });
    }

    // Group by service type
    const breakdown = new Map<string, { count: number; revenue: number }>();

    bookings?.forEach((booking) => {
      const serviceType = booking.service_type || 'Standard';
      const existing = breakdown.get(serviceType) || { count: 0, revenue: 0 };
      existing.count += 1;
      existing.revenue += booking.total_amount || 0;
      breakdown.set(serviceType, existing);
    });

    // Convert to array
    const data = Array.from(breakdown.entries()).map(([service_type, stats]) => ({
      service_type,
      count: stats.count,
      revenue: stats.revenue,
    }));

    // Sort by count descending
    data.sort((a, b) => b.count - a.count);

    return NextResponse.json({
      ok: true,
      data,
    });
  } catch (error) {
    console.error('Error in service breakdown API:', error);
    return NextResponse.json({
      ok: true,
      data: [],
    });
  }
}


