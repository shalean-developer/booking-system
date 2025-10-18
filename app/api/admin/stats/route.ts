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
    
    // Fetch total bookings and revenue
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('total_amount, status, created_at');
    
    if (bookingsError) throw bookingsError;
    
    const totalBookings = bookings?.length || 0;
    const totalRevenue = bookings?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;
    const pendingBookings = bookings?.filter(b => b.status === 'pending').length || 0;
    const confirmedBookings = bookings?.filter(b => b.status === 'confirmed').length || 0;
    const completedBookings = bookings?.filter(b => b.status === 'completed').length || 0;
    
    // Fetch total customers
    const { count: totalCustomers, error: customersError } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });
    
    if (customersError) throw customersError;
    
    // Fetch total cleaners
    const { data: cleaners, error: cleanersError } = await supabase
      .from('cleaners')
      .select('is_active');
    
    if (cleanersError) throw cleanersError;
    
    const totalCleaners = cleaners?.length || 0;
    const activeCleaners = cleaners?.filter(c => c.is_active).length || 0;
    
    // Fetch applications
    const { data: applications, error: applicationsError } = await supabase
      .from('applications')
      .select('status');
    
    if (applicationsError) throw applicationsError;
    
    const totalApplications = applications?.length || 0;
    const pendingApplications = applications?.filter(a => a.status === 'pending').length || 0;
    
    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentBookings = bookings?.filter(b => 
      new Date(b.created_at) >= thirtyDaysAgo
    ).length || 0;
    
    const recentRevenue = bookings?.filter(b => 
      new Date(b.created_at) >= thirtyDaysAgo
    ).reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;
    
    console.log('✅ Stats fetched successfully');
    
    return NextResponse.json({
      ok: true,
      stats: {
        bookings: {
          total: totalBookings,
          pending: pendingBookings,
          confirmed: confirmedBookings,
          completed: completedBookings,
          recent: recentBookings,
        },
        revenue: {
          total: totalRevenue,
          recent: recentRevenue,
        },
        customers: {
          total: totalCustomers || 0,
        },
        cleaners: {
          total: totalCleaners,
          active: activeCleaners,
        },
        applications: {
          total: totalApplications,
          pending: pendingApplications,
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

