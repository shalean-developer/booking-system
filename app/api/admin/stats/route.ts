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
    
    // Calculate date for recent stats (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();
    
    // Calculate tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowISO = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Fetch all stats in parallel for better performance
    const [
      bookingCounts,
      recentBookingStats,
      customerCount,
      cleanerCounts,
      applicationCounts,
      quoteCounts,
      tomorrowBookings
    ] = await Promise.all([
      // Total bookings by status (single query with counts)
      Promise.all([
        supabase.from('bookings').select('id, total_amount, cleaner_earnings, service_fee', { count: 'exact', head: false }),
        supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'accepted'),
        supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
      ]),
      // Recent bookings and revenue (last 30 days)
      supabase
        .from('bookings')
        .select('id, total_amount, cleaner_earnings, service_fee', { count: 'exact', head: false })
        .gte('created_at', thirtyDaysAgoISO),
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
    ]);
    
    // Process results
    const [allBookings, pendingCount, acceptedCount, completedCount] = bookingCounts;
    
    // Convert amounts from cents to rands for display
    const totalRevenue = (allBookings.data?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0) / 100;
    const recentRevenue = (recentBookingStats.data?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0) / 100;

    // Financial metrics (convert from cents to rands)
    const totalCleanerEarnings = (allBookings.data?.reduce((sum, b) => 
      sum + (b.cleaner_earnings || 0), 0) || 0) / 100;
    const totalServiceFees = (allBookings.data?.reduce((sum, b) => 
      sum + (b.service_fee || 0), 0) || 0) / 100;
    const companyEarnings = totalRevenue - totalCleanerEarnings;
    const profitMargin = totalRevenue > 0 
      ? Math.round((companyEarnings / totalRevenue) * 100) 
      : 0;

    // Recent period (last 30 days) - convert from cents to rands
    const recentCleanerEarnings = (recentBookingStats.data?.reduce((sum, b) => 
      sum + (b.cleaner_earnings || 0), 0) || 0) / 100;
    const recentServiceFees = (recentBookingStats.data?.reduce((sum, b) => 
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
    
    console.log('✅ Stats fetched successfully');
    
    return NextResponse.json({
      ok: true,
      stats: {
        bookings: {
          total: totalBookings,
          recent: recentBookings,
          pending: pendingCount.count || 0,
          accepted: acceptedCount.count || 0,
          completed: completedCount.count || 0,
        },
        revenue: {
          total: totalRevenue,
          recent: recentRevenue,
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
        },
        tomorrowBookings: tomorrowBookingsData,
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

