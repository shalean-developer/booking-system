import { NextResponse } from 'next/server';
import { createServiceClient, isAdmin } from '@/lib/supabase-server';
import { format, subDays, parseISO } from 'date-fns';

export const dynamic = 'force-dynamic';

// GET - Fetch quotes statistics for dashboard
export async function GET(req: Request) {
  try {
    // Check if user is admin
    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'today'; // today, all_time

    const supabase = createServiceClient();
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const yesterday = subDays(today, 1);
    const yesterdayStr = format(yesterday, 'yyyy-MM-dd');

    // Fetch quotes based on period
    let quotesQuery = supabase.from('quotes').select('*');
    
    if (period === 'today') {
      // Get quotes created today and yesterday for comparison
      quotesQuery = supabase
        .from('quotes')
        .select('*')
        .gte('created_at', `${todayStr}T00:00:00Z`)
        .lt('created_at', `${format(new Date(today.getTime() + 86400000), 'yyyy-MM-dd')}T00:00:00Z`);
    }

    const { data: quotes, error: quotesError } = await quotesQuery;

    if (quotesError) {
      console.error('Error fetching quotes:', quotesError);
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch quotes' },
        { status: 500 }
      );
    }

    // Fetch bookings for conversions and cleanings breakdown
    let bookingsQuery = supabase.from('bookings').select('service_type, status, created_at');
    
    if (period === 'today') {
      bookingsQuery = supabase
        .from('bookings')
        .select('service_type, status, created_at')
        .gte('created_at', `${todayStr}T00:00:00Z`)
        .lt('created_at', `${format(new Date(today.getTime() + 86400000), 'yyyy-MM-dd')}T00:00:00Z`);
    }
    // For "all_time", fetch all bookings

    const { data: bookings, error: bookingsError } = await bookingsQuery;

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
    }

    // Fetch yesterday's quotes for comparison
    const { data: yesterdayQuotes } = await supabase
      .from('quotes')
      .select('*')
      .gte('created_at', `${yesterdayStr}T00:00:00Z`)
      .lt('created_at', `${todayStr}T00:00:00Z`);

    // Calculate today's statistics
    const todayQuotes = quotes?.filter((q) => {
      const quoteDate = format(parseISO(q.created_at), 'yyyy-MM-dd');
      return quoteDate === todayStr;
    }) || [];

    const yesterdayQuotesCount = yesterdayQuotes?.length || 0;
    const todayQuotesCount = todayQuotes.length;
    
    // Calculate percentage change
    const quotesChange = yesterdayQuotesCount > 0
      ? Math.round(((todayQuotesCount - yesterdayQuotesCount) / yesterdayQuotesCount) * 100)
      : todayQuotesCount > 0 ? 100 : 0;

    // Calculate quotes value
    const todayQuotesValue = todayQuotes.reduce((sum, q) => {
      const price = q.estimated_price || 0;
      // Convert from cents to dollars if needed
      return sum + (price > 10000 ? price / 100 : price);
    }, 0);

    const yesterdayQuotesValue = (yesterdayQuotes || []).reduce((sum, q) => {
      const price = q.estimated_price || 0;
      return sum + (price > 10000 ? price / 100 : price);
    }, 0);

    const quotesValueChange = yesterdayQuotesValue > 0
      ? Math.round(((todayQuotesValue - yesterdayQuotesValue) / yesterdayQuotesValue) * 100)
      : todayQuotesValue > 0 ? 100 : 0;

    // Calculate conversions
    const todayBookings = bookings?.filter((b) => {
      const bookingDate = format(parseISO(b.created_at), 'yyyy-MM-dd');
      return bookingDate === todayStr;
    }) || [];

    const bookingsCount = todayBookings.length;
    const totalQuotes = todayQuotesCount;
    const conversionRate = totalQuotes > 0 ? Math.round((bookingsCount / totalQuotes) * 100) : 0;

    // Calculate cleanings breakdown (all time or today based on period)
    // For "all_time", fetch all bookings for breakdown
    let cleaningsData = period === 'today' ? todayBookings : (bookings || []);
    
    // If period is "all_time", fetch all bookings for breakdown
    if (period === 'all_time') {
      const { data: allBookings } = await supabase
        .from('bookings')
        .select('service_type, status, created_at');
      cleaningsData = allBookings || [];
    }
    
    const cleaningsBreakdown = {
      total: cleaningsData.length,
      standard: cleaningsData.filter((b: any) => 
        (b.service_type || '').trim() === 'Standard'
      ).length,
      deepCleaning: cleaningsData.filter((b: any) => 
        (b.service_type || '').trim() === 'Deep'
      ).length,
      moveInMoveOut: cleaningsData.filter((b: any) => 
        (b.service_type || '').trim() === 'Move In/Out' || 
        (b.service_type || '').toLowerCase().includes('move')
      ).length,
    };

    // Fetch all quotes for total count
    const { count: totalQuotesCount } = await supabase
      .from('quotes')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      ok: true,
      stats: {
        quotes: {
          newToday: todayQuotesCount,
          change: quotesChange,
          total: totalQuotesCount || 0,
        },
        quotesValue: {
          today: todayQuotesValue,
          change: quotesValueChange,
        },
        conversions: {
          rate: conversionRate,
          bookings: bookingsCount,
          quotes: totalQuotes,
          total: totalQuotes,
        },
        cleanings: cleaningsBreakdown,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/admin/quotes/stats:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

