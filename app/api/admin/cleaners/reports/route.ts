import { NextRequest, NextResponse } from 'next/server';
import { isAdmin, createServiceClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/cleaners/reports
 * Generate custom reports for cleaners
 * Query params: startDate, endDate, cleanerIds (comma-separated), format (json|csv)
 */
export async function GET(request: NextRequest) {
  try {
    // Check admin access
    if (!await isAdmin()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const cleanerIds = searchParams.get('cleanerIds')?.split(',').filter(Boolean) || [];
    const format = searchParams.get('format') || 'json';

    if (!startDate || !endDate) {
      return NextResponse.json(
        { ok: false, error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    // Validate date range
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { ok: false, error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }
    if (end < start) {
      return NextResponse.json(
        { ok: false, error: 'endDate must be greater than or equal to startDate' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Build query for bookings (fetch without join first to avoid RLS issues)
    let bookingsQuery = supabase
      .from('bookings')
      .select(`
        id,
        booking_date,
        booking_time,
        service_type,
        status,
        total_amount,
        cleaner_earnings,
        tip_amount,
        cleaner_id
      `)
      .gte('booking_date', startDate)
      .lte('booking_date', endDate)
      .order('booking_date', { ascending: false });

    // Filter by cleaner IDs if provided
    if (cleanerIds.length > 0) {
      bookingsQuery = bookingsQuery.in('cleaner_id', cleanerIds);
    }

    const { data: bookings, error: bookingsError } = await bookingsQuery;

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
      console.error('Error details:', JSON.stringify(bookingsError, null, 2));
      return NextResponse.json(
        { ok: false, error: `Failed to fetch bookings: ${bookingsError.message || bookingsError.code || 'Unknown error'}` },
        { status: 500 }
      );
    }

    console.log(`✅ Fetched ${bookings?.length || 0} bookings for report (${startDate} to ${endDate})`);

    // Fetch cleaner names separately to avoid join issues
    const uniqueCleanerIds = [...new Set((bookings || []).map((b: any) => b.cleaner_id).filter(Boolean))];
    let cleanerNames: Record<string, string> = {};
    
    if (uniqueCleanerIds.length > 0) {
      const { data: cleaners, error: cleanersError } = await supabase
        .from('cleaners')
        .select('id, name')
        .in('id', uniqueCleanerIds);
      
      if (!cleanersError && cleaners) {
        cleaners.forEach((cleaner: any) => {
          cleanerNames[cleaner.id] = cleaner.name;
        });
      }
    }

    // Group by cleaner (handle null cleaner_id as "Unassigned")
    const cleanerReports: Record<string, any> = {};

    bookings?.forEach((booking: any) => {
      const cleanerId = booking.cleaner_id || 'unassigned';
      if (!cleanerReports[cleanerId]) {
        cleanerReports[cleanerId] = {
          cleaner_id: booking.cleaner_id || null,
          cleaner_name: booking.cleaner_id ? (cleanerNames[booking.cleaner_id] || 'Unknown Cleaner') : 'Unassigned',
          total_bookings: 0,
          completed_bookings: 0,
          cancelled_bookings: 0,
          total_earnings: 0,
          total_tips: 0,
          bookings: [],
        };
      }

      const report = cleanerReports[cleanerId];
      report.total_bookings++;
      report.bookings.push({
        id: booking.id,
        date: booking.booking_date,
        time: booking.booking_time,
        service_type: booking.service_type,
        status: booking.status,
        total_amount: booking.total_amount / 100,
        earnings: booking.cleaner_earnings / 100,
        tip: (booking.tip_amount || 0) / 100,
      });

      if (booking.status === 'completed') {
        report.completed_bookings++;
        report.total_earnings += (booking.cleaner_earnings || 0) / 100;
        report.total_tips += (booking.tip_amount || 0) / 100;
      } else if (booking.status === 'cancelled' || booking.status === 'declined') {
        report.cancelled_bookings++;
      }
    });

    const reports = Object.values(cleanerReports);

    // Calculate summary
    const summary = {
      period: { startDate, endDate },
      total_cleaners: reports.length,
      total_bookings: bookings?.length || 0,
      total_completed: reports.reduce((sum, r) => sum + r.completed_bookings, 0),
      total_earnings: reports.reduce((sum, r) => sum + r.total_earnings, 0),
      total_tips: reports.reduce((sum, r) => sum + r.total_tips, 0),
    };

    if (format === 'csv') {
      // Generate CSV
      const csvRows = [
        // Header
        ['Cleaner Name', 'Total Bookings', 'Completed', 'Cancelled', 'Total Earnings', 'Total Tips'].join(','),
        // Data rows
        ...reports.map((r) =>
          [
            r.cleaner_name,
            r.total_bookings,
            r.completed_bookings,
            r.cancelled_bookings,
            r.total_earnings.toFixed(2),
            r.total_tips.toFixed(2),
          ].join(',')
        ),
      ];

      return new NextResponse(csvRows.join('\n'), {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="cleaner-report-${startDate}-to-${endDate}.csv"`,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      summary,
      reports,
    });
  } catch (error: any) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to generate report' },
      { status: 500 }
    );
  }
}


