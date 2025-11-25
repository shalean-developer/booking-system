import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
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

    // Use service client to bypass RLS for admin operations
    const supabase = createServiceClient();
    const { searchParams } = new URL(request.url);
    const cleanerId = searchParams.get('cleaner');
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');

    // Build query for cleaners
    let cleanersQuery = supabase
      .from('cleaners')
      .select('id, name, rating, is_active');

    if (cleanerId) {
      cleanersQuery = cleanersQuery.eq('id', cleanerId);
    } else {
      cleanersQuery = cleanersQuery.eq('is_active', true);
    }

    const { data: cleaners, error: cleanersError } = await cleanersQuery;

    if (cleanersError) {
      console.error('Error fetching cleaners:', cleanersError);
      console.error('Cleaners query error details:', {
        message: cleanersError.message,
        code: cleanersError.code,
        details: cleanersError.details,
        hint: cleanersError.hint,
      });
      return NextResponse.json({
        ok: false,
        error: `Failed to fetch cleaners: ${cleanersError.message}`,
        details: process.env.NODE_ENV === 'development' ? cleanersError : undefined,
      }, { status: 500 });
    }

    if (!cleaners || cleaners.length === 0) {
      return NextResponse.json({
        ok: true,
        performance: [],
      });
    }

    // Calculate performance metrics for each cleaner
    const performanceData = await Promise.all(
      cleaners.map(async (cleaner) => {
        const cleanerName = cleaner.name || 'Unknown Cleaner';

        // Build bookings query
        let bookingsQuery = supabase
          .from('bookings')
          .select('id, status, cleaner_earnings, booking_date')
          .eq('cleaner_id', cleaner.id);

        // Apply date filters if provided
        if (startDate) {
          bookingsQuery = bookingsQuery.gte('booking_date', startDate);
        }
        if (endDate) {
          bookingsQuery = bookingsQuery.lte('booking_date', endDate);
        }

        const { data: bookings, error: bookingsError } = await bookingsQuery;

        if (bookingsError) {
          console.error(`Error fetching bookings for cleaner ${cleaner.id}:`, bookingsError);
          return {
            id: cleaner.id,
            name: cleanerName,
            total_bookings: 0,
            completed_bookings: 0,
            average_rating: cleaner.rating ? parseFloat(cleaner.rating.toString()) : null,
            total_revenue: 0,
            bookings_this_month: 0,
          };
        }

        const totalBookings = bookings?.length || 0;
        const completedBookings = bookings?.filter(b => b.status === 'completed').length || 0;
        const totalRevenue = bookings?.reduce((sum, b) => sum + (b.cleaner_earnings || 0), 0) || 0;

        // Calculate bookings this month
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const bookingsThisMonth = bookings?.filter(b => 
          b.booking_date >= firstDayOfMonth && b.status === 'completed'
        ).length || 0;

        return {
          id: cleaner.id,
          name: cleanerName,
          total_bookings: totalBookings,
          completed_bookings: completedBookings,
          average_rating: cleaner.rating ? parseFloat(cleaner.rating.toString()) : null,
          total_revenue: totalRevenue,
          bookings_this_month: bookingsThisMonth,
        };
      })
    );

    return NextResponse.json({
      ok: true,
      performance: performanceData,
    });
  } catch (error: any) {
    console.error('Error in cleaners performance API:', error);
    return NextResponse.json(
      { 
        ok: false, 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

