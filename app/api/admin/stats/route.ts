import { NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase-server';

/**
 * Admin Stats API
 * GET: Fetch dashboard statistics
 */
export async function GET(request: Request) {
  console.log('=== ADMIN STATS API CALLED ===');
  
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Create Supabase client
    const supabase = await createClient();
    
    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }
    
    // Check if user is admin
    const { data: customer } = await supabase
      .from('customers')
      .select('role')
      .eq('auth_user_id', user.id)
      .single();
    
    if (customer?.role !== 'admin') {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }
    
    console.log('✅ Admin authenticated:', user.email);
    
    // Calculate date for recent stats (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();
    
    // Fetch all stats in parallel for better performance
    const [
      bookingCounts,
      recentBookingStats,
      customerCount,
      cleanerCounts,
      applicationCounts
    ] = await Promise.all([
      // Total bookings by status (single query with counts)
      Promise.all([
        supabase.from('bookings').select('id, total_amount', { count: 'exact', head: false }),
        supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'confirmed'),
        supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
      ]),
      // Recent bookings and revenue (last 30 days)
      supabase
        .from('bookings')
        .select('id, total_amount', { count: 'exact', head: false })
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
    ]);
    
    // Process results
    const [allBookings, pendingCount, confirmedCount, completedCount] = bookingCounts;
    const totalRevenue = allBookings.data?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;
    
    const recentRevenue = recentBookingStats.data?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;
    
    const [totalCleanersResult, activeCleanersResult] = cleanerCounts;
    const [totalApplicationsResult, pendingApplicationsResult] = applicationCounts;
    
    console.log('✅ Stats fetched successfully');
    
    return NextResponse.json({
      ok: true,
      stats: {
        bookings: {
          total: allBookings.count || 0,
          pending: pendingCount.count || 0,
          confirmed: confirmedCount.count || 0,
          completed: completedCount.count || 0,
          recent: recentBookingStats.count || 0,
        },
        revenue: {
          total: totalRevenue,
          recent: recentRevenue,
        },
        customers: {
          total: customerCount.count || 0,
        },
        cleaners: {
          total: totalCleanersResult.count || 0,
          active: activeCleanersResult.count || 0,
        },
        applications: {
          total: totalApplicationsResult.count || 0,
          pending: pendingApplicationsResult.count || 0,
        },
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

