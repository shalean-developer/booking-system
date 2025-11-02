import { NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * Admin Stats API
 * GET: Fetch dashboard statistics
 */
export async function GET(request: Request) {
  console.log('=== ADMIN STATS API CALLED ===');
  console.log('🔍 API Request URL:', request.url);
  console.log('🔍 API Request Headers:', Object.fromEntries(request.headers));
  
  try {
    // Check admin access
    if (!await isAdmin()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }
    
    const supabase = await createClient();
    
    console.log('✅ Admin authenticated');
    
    // Parse query parameters for date range
    const url = new URL(request.url);
    const daysParam = url.searchParams.get('days');
    
    // Calculate date for recent stats
    // Default to current month days if no parameter provided
    let daysBack: number;
    if (daysParam) {
      daysBack = parseInt(daysParam, 10);
    } else {
      // Calculate current month days as default
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const daysDifference = Math.ceil((now.getTime() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24));
      daysBack = daysDifference + 1;
    }
    
    const recentPeriodStart = new Date();
    recentPeriodStart.setDate(recentPeriodStart.getDate() - daysBack);
    const recentPeriodStartISO = recentPeriodStart.toISOString();
    
    // Calculate tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowISO = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Calculate today's date
    const today = new Date();
    const todayISO = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Calculate 48 hours ago for quote aging
    const fortyEightHoursAgo = new Date();
    fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);
    const fortyEightHoursAgoISO = fortyEightHoursAgo.toISOString();
    
    // Fetch all stats in parallel for better performance
    const [
      bookingCounts,
      recentBookingStats,
      recentCompletedBookings,
      customerCount,
      cleanerCounts,
      applicationCounts,
      quoteCounts,
      tomorrowBookings,
      todayBookings,
      todayRevenue,
      unassignedBookings,
      availableCleanersToday,
      availableCleanersTomorrow,
      oldPendingQuotes,
      serviceTypeStats,
      recentServiceTypeStats
    ] = await Promise.all([
      // Total bookings by status (single query with counts)
      Promise.all([
        supabase.from('bookings').select('id, total_amount, cleaner_earnings, service_fee', { count: 'exact', head: false }),
        supabase.from('bookings').select('id, total_amount, cleaner_earnings, service_fee', { count: 'exact', head: false }).eq('status', 'completed'),
        supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'accepted'),
        supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'cancelled'),
      ]),
      // Recent bookings and revenue
      supabase
        .from('bookings')
        .select('id, total_amount, cleaner_earnings, service_fee', { count: 'exact', head: false })
        .gte('created_at', recentPeriodStartISO),
      // Recent revenue (completed bookings only)
      supabase
        .from('bookings')
        .select('id, total_amount, cleaner_earnings, service_fee', { count: 'exact', head: false })
        .gte('created_at', recentPeriodStartISO)
        .eq('status', 'completed'),
      // Total customers
      supabase
        .from('customers')
        .select('id', { count: 'exact', head: true }),
      // Cleaners by active status
      Promise.all([
        supabase.from('cleaners').select('id', { count: 'exact', head: true }),
        supabase.from('cleaners').select('id', { count: 'exact', head: true }).eq('is_active', true),
      ]),
      // Applications by status
      Promise.all([
        supabase.from('applications').select('id', { count: 'exact', head: true }),
        supabase.from('applications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      ]),
      // Quotes by status
      Promise.all([
        supabase.from('quotes').select('id', { count: 'exact', head: true }),
        supabase.from('quotes').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('quotes').select('id', { count: 'exact', head: true }).eq('status', 'contacted'),
        supabase.from('quotes').select('id', { count: 'exact', head: true }).eq('status', 'converted'),
      ]),
      // Tomorrow's bookings
      supabase
        .from('bookings')
        .select(`
          id,
          customer_name,
          booking_time,
          service_type,
          status,
          cleaner_id
        `)
        .eq('booking_date', tomorrowISO)
        .order('booking_time', { ascending: true })
        .limit(20),
      // Today's bookings
      supabase
        .from('bookings')
        .select(`
          id,
          customer_name,
          booking_date,
          booking_time,
          service_type,
          status,
          cleaner_id
        `)
        .eq('booking_date', todayISO)
        .order('booking_time', { ascending: true })
        .limit(20),
      // Today's revenue (completed bookings only)
      supabase
        .from('bookings')
        .select('total_amount')
        .eq('booking_date', todayISO)
        .eq('status', 'completed'),
      // Unassigned bookings (status accepted/pending but no cleaner assigned)
      supabase
        .from('bookings')
        .select(`
          id,
          customer_name,
          booking_time,
          service_type,
          status,
          booking_date
        `)
        .or('cleaner_id.is.null,cleaner_id.eq.manual')
        .in('status', ['pending', 'accepted'])
        .gte('booking_date', todayISO)
        .order('booking_date', { ascending: true })
        .limit(20),
      // Available cleaners today
      supabase
        .from('cleaners')
        .select('id, name')
        .eq('is_active', true)
        .eq('is_available', true),
      // Available cleaners tomorrow (check day of week availability)
      supabase
        .from('cleaners')
        .select('id, name, available_monday, available_tuesday, available_wednesday, available_thursday, available_friday, available_saturday, available_sunday')
        .eq('is_active', true)
        .eq('is_available', true),
      // Old pending quotes (>48 hours)
      supabase
        .from('quotes')
        .select('id, first_name, last_name, email, created_at')
        .eq('status', 'pending')
        .lt('created_at', fortyEightHoursAgoISO)
        .order('created_at', { ascending: true })
        .limit(20),
      // Service type breakdown (total)
      supabase
        .from('bookings')
        .select('service_type, total_amount')
        .not('service_type', 'is', null),
      // Service type breakdown (recent period)
      supabase
        .from('bookings')
        .select('service_type, total_amount')
        .gte('created_at', recentPeriodStartISO)
        .not('service_type', 'is', null),
    ]);
    
    // Process results
    const [allBookings, completedBookingsForRevenue, pendingCount, acceptedCount, completedCount, cancelledCount] = bookingCounts;
    
    // Convert amounts from cents to rands for display (only from completed bookings)
    const totalRevenue = (completedBookingsForRevenue.data?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0) / 100;
    const recentRevenue = (recentCompletedBookings.data?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0) / 100;

    // Financial metrics (convert from cents to rands) - only from completed bookings
    const totalCleanerEarnings = (completedBookingsForRevenue.data?.reduce((sum, b) => 
      sum + (b.cleaner_earnings || 0), 0) || 0) / 100;
    const totalServiceFees = (completedBookingsForRevenue.data?.reduce((sum, b) => 
      sum + (b.service_fee || 0), 0) || 0) / 100;
    const companyEarnings = totalRevenue - totalCleanerEarnings;
    const profitMargin = totalRevenue > 0 
      ? Math.round((companyEarnings / totalRevenue) * 100) 
      : 0;

    // Recent period - convert from cents to rands - only from completed bookings
    const recentCleanerEarnings = (recentCompletedBookings.data?.reduce((sum, b) => 
      sum + (b.cleaner_earnings || 0), 0) || 0) / 100;
    const recentServiceFees = (recentCompletedBookings.data?.reduce((sum, b) => 
      sum + (b.service_fee || 0), 0) || 0) / 100;
    const recentCompanyEarnings = recentRevenue - recentCleanerEarnings;
    const recentProfitMargin = recentRevenue > 0 
      ? Math.round((recentCompanyEarnings / recentRevenue) * 100) 
      : 0;

    // Process results from parallel queries
    const [totalCleanersResult, activeCleanersResult] = cleanerCounts;
    const [totalApplicationsResult, pendingApplicationsResult] = applicationCounts;
    const [totalQuotesResult, pendingQuotesResult, contactedQuotesResult, convertedQuotesResult] = quoteCounts;

    // Operational metrics
    const totalBookings = allBookings.count || 0;
    const recentBookings = recentBookingStats.count || 0;
    const activeCleaners = activeCleanersResult.count || 0;
    const cleanerUtilization = activeCleaners > 0 
      ? Math.round(recentBookings / activeCleaners) 
      : 0;

    // Growth metrics (using converted rands values)
    const avgBookingValue = totalBookings > 0 
      ? Math.round(totalRevenue / totalBookings) 
      : 0;
    const recentAvgBookingValue = recentBookings > 0 
      ? Math.round(recentRevenue / recentBookings) 
      : 0;

    // Customer retention
    const repeatCustomersResult = await supabase
      .from('customers')
      .select('id', { count: 'exact', head: true })
      .gte('total_bookings', 2);

    const totalCustomers = customerCount.count || 0;
    const repeatCustomers = repeatCustomersResult.count || 0;
    const retentionRate = totalCustomers > 0 
      ? Math.round((repeatCustomers / totalCustomers) * 100) 
      : 0;
    
    // Process tomorrow's bookings and fetch cleaner names
    const tomorrowBookingsData = await Promise.all(
      (tomorrowBookings.data || []).map(async (booking) => {
        let cleaner_name = null;
        
        if (booking.cleaner_id && booking.cleaner_id !== 'manual') {
          // Fetch cleaner name from cleaners table
          const { data: cleaner } = await supabase
            .from('cleaners')
            .select('name')
            .eq('id', booking.cleaner_id)
            .single();
          
          cleaner_name = cleaner?.name || 'Unknown Cleaner';
        }
        
        return {
          id: booking.id,
          customer_name: booking.customer_name,
          booking_time: booking.booking_time,
          service_type: booking.service_type,
          status: booking.status,
          cleaner_name
        };
      })
    );

    // Process today's bookings and fetch cleaner names
    const todayBookingsData = await Promise.all(
      (todayBookings.data || []).map(async (booking) => {
        let cleaner_name = null;
        
        if (booking.cleaner_id && booking.cleaner_id !== 'manual') {
          const { data: cleaner } = await supabase
            .from('cleaners')
            .select('name')
            .eq('id', booking.cleaner_id)
            .single();
          
          cleaner_name = cleaner?.name || 'Unknown Cleaner';
        }
        
        return {
          id: booking.id,
          customer_name: booking.customer_name,
          booking_date: booking.booking_date,
          booking_time: booking.booking_time,
          service_type: booking.service_type,
          status: booking.status,
          cleaner_name
        };
      })
    );

    // Calculate today's revenue
    const todayRevenueAmount = (todayRevenue.data?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0) / 100;
    const todayBookingsCount = todayBookings.data?.length || 0;

    // Process unassigned bookings
    const unassignedBookingsCount = unassignedBookings.data?.length || 0;
    const unassignedBookingsList = (unassignedBookings.data || []).slice(0, 10);

    // Process available cleaners
    const availableCleanersTodayCount = availableCleanersToday.data?.length || 0;
    
    // Count available cleaners tomorrow based on day of week
    const tomorrowDay = new Date(tomorrowISO).getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayFields = ['available_sunday', 'available_monday', 'available_tuesday', 'available_wednesday', 'available_thursday', 'available_friday', 'available_saturday'];
    const availableCleanersTomorrowCount = availableCleanersTomorrow.data?.filter(cleaner => {
      return cleaner[dayFields[tomorrowDay] as keyof typeof cleaner] === true;
    }).length || 0;

    // Process old pending quotes
    const oldPendingQuotesCount = oldPendingQuotes.data?.length || 0;
    const oldPendingQuotesList = (oldPendingQuotes.data || []).slice(0, 10).map(quote => ({
      id: quote.id,
      name: `${quote.first_name} ${quote.last_name}`,
      email: quote.email,
      created_at: quote.created_at
    }));

    // Process service type breakdown
    const serviceTypeBreakdown: Record<string, { bookings: number; revenue: number }> = {};
    (serviceTypeStats.data || []).forEach(booking => {
      const type = booking.service_type || 'Unknown';
      if (!serviceTypeBreakdown[type]) {
        serviceTypeBreakdown[type] = { bookings: 0, revenue: 0 };
      }
      serviceTypeBreakdown[type].bookings++;
      serviceTypeBreakdown[type].revenue += (booking.total_amount || 0) / 100;
    });

    const recentServiceTypeBreakdown: Record<string, { bookings: number; revenue: number }> = {};
    (recentServiceTypeStats.data || []).forEach(booking => {
      const type = booking.service_type || 'Unknown';
      if (!recentServiceTypeBreakdown[type]) {
        recentServiceTypeBreakdown[type] = { bookings: 0, revenue: 0 };
      }
      recentServiceTypeBreakdown[type].bookings++;
      recentServiceTypeBreakdown[type].revenue += (booking.total_amount || 0) / 100;
    });
    
    console.log('✅ Stats fetched successfully');
    
    return NextResponse.json({
      ok: true,
      stats: {
        bookings: {
          total: totalBookings,
          recent: recentBookings,
          today: todayBookingsCount,
          pending: pendingCount.count || 0,
          accepted: acceptedCount.count || 0,
          completed: completedCount.count || 0,
          cancelled: cancelledCount.count || 0,
          unassigned: unassignedBookingsCount,
          unassignedList: unassignedBookingsList,
          todayBookings: todayBookingsData,
        },
        revenue: {
          total: totalRevenue,
          recent: recentRevenue,
          today: todayRevenueAmount,
          cleanerEarnings: totalCleanerEarnings,
          recentCleanerEarnings: recentCleanerEarnings,
          companyEarnings: companyEarnings,
          recentCompanyEarnings: recentCompanyEarnings,
          serviceFees: totalServiceFees,
          recentServiceFees: recentServiceFees,
          profitMargin: profitMargin,
          recentProfitMargin: recentProfitMargin,
          avgBookingValue: avgBookingValue,
          recentAvgBookingValue: recentAvgBookingValue,
        },
        customers: {
          total: totalCustomers,
          repeat: repeatCustomers,
          retentionRate: retentionRate,
        },
        cleaners: {
          total: totalCleanersResult.count || 0,
          active: activeCleaners,
          utilization: cleanerUtilization,
          availableToday: availableCleanersTodayCount,
          availableTomorrow: availableCleanersTomorrowCount,
        },
        applications: {
          total: totalApplicationsResult.count || 0,
          pending: pendingApplicationsResult.count || 0,
        },
        quotes: {
          total: totalQuotesResult.count || 0,
          pending: pendingQuotesResult.count || 0,
          contacted: contactedQuotesResult.count || 0,
          converted: convertedQuotesResult.count || 0,
          oldPending: oldPendingQuotesCount,
          oldPendingList: oldPendingQuotesList,
        },
        tomorrowBookings: tomorrowBookingsData,
        serviceTypeBreakdown: serviceTypeBreakdown,
        recentServiceTypeBreakdown: recentServiceTypeBreakdown,
      },
    });
    
  } catch (error) {
    console.error('=== ADMIN STATS ERROR ===', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}

