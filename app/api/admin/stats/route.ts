import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
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

    const supabase = await createClient();
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // Current period (last 30 days)
    const { data: currentBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, total_amount, created_at, status')
      .gte('created_at', thirtyDaysAgo.toISOString());

    // Previous period (30-60 days ago)
    const { data: previousBookings, error: prevBookingsError } = await supabase
      .from('bookings')
      .select('id, total_amount, created_at')
      .gte('created_at', sixtyDaysAgo.toISOString())
      .lt('created_at', thirtyDaysAgo.toISOString());

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

    // Count active customers (customers with bookings in last 30 days)
    const { data: activeCustomersData } = await supabase
      .from('bookings')
      .select('customer_id')
      .gte('created_at', thirtyDaysAgo.toISOString())
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
      .gte('created_at', sixtyDaysAgo.toISOString())
      .lt('created_at', thirtyDaysAgo.toISOString())
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
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
