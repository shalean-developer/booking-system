import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  console.log('[API] /api/admin/stats - Request started');
  
  try {
    const adminCheckStart = Date.now();
    const isAdminUser = await isAdmin();
    console.log(`[API] Admin check completed in ${Date.now() - adminCheckStart}ms, result: ${isAdminUser}`);
    
    if (!isAdminUser) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const supabaseStart = Date.now();
    const supabase = await createClient();
    console.log(`[API] Supabase client created in ${Date.now() - supabaseStart}ms`);
    
    // Get date range from query params, default to last 30 days
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    
    const now = new Date();
    let currentPeriodStart: Date;
    let currentPeriodEnd: Date;
    let previousPeriodStart: Date;
    let previousPeriodEnd: Date;
    
    if (dateFrom && dateTo) {
      // Use provided date range
      currentPeriodStart = new Date(dateFrom);
      currentPeriodEnd = new Date(dateTo);
      
      // Calculate previous period (same duration before the current period)
      const periodDuration = currentPeriodEnd.getTime() - currentPeriodStart.getTime();
      previousPeriodEnd = new Date(currentPeriodStart);
      previousPeriodEnd.setTime(previousPeriodEnd.getTime() - 1); // One millisecond before current period starts
      previousPeriodStart = new Date(previousPeriodEnd);
      previousPeriodStart.setTime(previousPeriodStart.getTime() - periodDuration);
    } else {
      // Default to last 30 days
      currentPeriodEnd = now;
      currentPeriodStart = new Date(now);
      currentPeriodStart.setDate(currentPeriodStart.getDate() - 30);
      
      // Previous period (30-60 days ago)
      previousPeriodEnd = new Date(currentPeriodStart);
      previousPeriodEnd.setTime(previousPeriodEnd.getTime() - 1);
      previousPeriodStart = new Date(previousPeriodEnd);
      previousPeriodStart.setDate(previousPeriodStart.getDate() - 30);
    }

    // Current period bookings
    const { data: currentBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, total_amount, created_at, status')
      .gte('created_at', currentPeriodStart.toISOString())
      .lte('created_at', currentPeriodEnd.toISOString());

    // Previous period bookings
    const { data: previousBookings, error: prevBookingsError } = await supabase
      .from('bookings')
      .select('id, total_amount, created_at')
      .gte('created_at', previousPeriodStart.toISOString())
      .lte('created_at', previousPeriodEnd.toISOString());

    if (bookingsError || prevBookingsError) {
      console.error('Error fetching bookings:', bookingsError || prevBookingsError);
    }

    // Calculate revenue
    const currentRevenue = (currentBookings || [])
      .filter((b) => b.total_amount && b.total_amount > 0)
      .reduce((sum, b) => sum + (b.total_amount || 0), 0);
    
    const previousRevenue = (previousBookings || [])
      .filter((b) => b.total_amount && b.total_amount > 0)
      .reduce((sum, b) => sum + (b.total_amount || 0), 0);
    
    const revenueGrowth = previousRevenue > 0
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
      : 0;

    // Calculate bookings count
    const currentBookingsCount = (currentBookings || []).length;
    const previousBookingsCount = (previousBookings || []).length;
    const bookingsGrowth = previousBookingsCount > 0
      ? ((currentBookingsCount - previousBookingsCount) / previousBookingsCount) * 100
      : 0;

    // Calculate average booking value
    const bookingsWithAmount = (currentBookings || []).filter((b) => b.total_amount && b.total_amount > 0);
    const avgBookingValue = bookingsWithAmount.length > 0
      ? currentRevenue / bookingsWithAmount.length
      : 0;
    
    const prevBookingsWithAmount = (previousBookings || []).filter((b) => b.total_amount && b.total_amount > 0);
    const prevAvgBookingValue = prevBookingsWithAmount.length > 0
      ? previousRevenue / prevBookingsWithAmount.length
      : 0;
    
    const avgValueGrowth = prevAvgBookingValue > 0
      ? ((avgBookingValue - prevAvgBookingValue) / prevAvgBookingValue) * 100
      : 0;

    // Count active customers (customers with bookings in current period)
    const { data: activeCustomersData } = await supabase
      .from('bookings')
      .select('customer_id')
      .gte('created_at', currentPeriodStart.toISOString())
      .lte('created_at', currentPeriodEnd.toISOString())
      .not('customer_id', 'is', null);
    
    const uniqueCustomers = new Set(
      (activeCustomersData || [])
        .map((b) => b.customer_id)
        .filter((id) => id !== null)
    );
    const activeCustomers = uniqueCustomers.size;

    // Previous period active customers
    const { data: prevActiveCustomersData } = await supabase
      .from('bookings')
      .select('customer_id')
      .gte('created_at', previousPeriodStart.toISOString())
      .lte('created_at', previousPeriodEnd.toISOString())
      .not('customer_id', 'is', null);
    
    const prevUniqueCustomers = new Set(
      (prevActiveCustomersData || [])
        .map((b) => b.customer_id)
        .filter((id) => id !== null)
    );
    const prevActiveCustomers = prevUniqueCustomers.size;
    const customersGrowth = prevActiveCustomers > 0
      ? ((activeCustomers - prevActiveCustomers) / prevActiveCustomers) * 100
      : 0;

    // Count pending quotes
    const { count: pendingQuotes } = await supabase
      .from('quotes')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // Count pending applications
    const { count: pendingApplications } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // Count pending bookings
    const { count: pendingBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const totalDuration = Date.now() - startTime;
    console.log(`[API] /api/admin/stats - Success (${totalDuration}ms)`);

    return NextResponse.json({
      ok: true,
      stats: {
        totalRevenue: currentRevenue,
        revenueGrowth: Math.round(revenueGrowth * 100) / 100,
        totalBookings: currentBookingsCount,
        bookingsGrowth: Math.round(bookingsGrowth * 100) / 100,
        activeCustomers,
        customersGrowth: Math.round(customersGrowth * 100) / 100,
        avgBookingValue,
        avgValueGrowth: Math.round(avgValueGrowth * 100) / 100,
        pendingQuotes: pendingQuotes || 0,
        pendingApplications: pendingApplications || 0,
        pendingBookings: pendingBookings || 0,
      },
    });
  } catch (error: any) {
    const totalDuration = Date.now() - startTime;
    console.error(`[API] /api/admin/stats - Error after ${totalDuration}ms:`, {
      error: error.message,
      stack: error.stack,
      name: error.name,
    });
    return NextResponse.json(
      { ok: false, error: 'Internal server error', details: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
  }
}
