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
      // Parse dates and ensure we use local timezone for date calculations
      currentPeriodStart = new Date(dateFrom);
      currentPeriodEnd = new Date(dateTo);
      
      // For "today" period, ensure we're using the actual local date, not UTC
      // If the date string represents "today", use current local date
      const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const dateFromLocal = new Date(currentPeriodStart.getFullYear(), currentPeriodStart.getMonth(), currentPeriodStart.getDate());
      const dateToLocal = new Date(currentPeriodEnd.getFullYear(), currentPeriodEnd.getMonth(), currentPeriodEnd.getDate());
      
      // If the parsed date matches today's local date, use today's date object
      if (dateFromLocal.getTime() === todayLocal.getTime()) {
        currentPeriodStart = new Date(todayLocal);
        currentPeriodStart.setHours(0, 0, 0, 0);
      } else {
        currentPeriodStart.setHours(0, 0, 0, 0);
      }
      
      if (dateToLocal.getTime() === todayLocal.getTime()) {
        currentPeriodEnd = new Date(todayLocal);
        currentPeriodEnd.setHours(23, 59, 59, 999);
      } else {
        // Ensure end date includes the full day (23:59:59.999) if it's a date-only string
        if (dateTo.split('T').length === 1 || dateTo.endsWith('T00:00:00.000Z')) {
          currentPeriodEnd.setHours(23, 59, 59, 999);
        }
      }
      
      // Calculate previous period (same duration before the current period)
      const periodDuration = currentPeriodEnd.getTime() - currentPeriodStart.getTime();
      previousPeriodEnd = new Date(currentPeriodStart);
      previousPeriodEnd.setTime(previousPeriodEnd.getTime() - 1); // One millisecond before current period starts
      previousPeriodStart = new Date(previousPeriodEnd);
      previousPeriodStart.setTime(previousPeriodStart.getTime() - periodDuration);
    } else {
      // Default to last 30 days
      currentPeriodEnd = new Date(now);
      currentPeriodEnd.setHours(23, 59, 59, 999); // Include all of today
      currentPeriodStart = new Date(now);
      currentPeriodStart.setDate(currentPeriodStart.getDate() - 30);
      currentPeriodStart.setHours(0, 0, 0, 0); // Start of day 30 days ago
      
      // Previous period (30-60 days ago)
      previousPeriodEnd = new Date(currentPeriodStart);
      previousPeriodEnd.setTime(previousPeriodEnd.getTime() - 1);
      previousPeriodStart = new Date(previousPeriodEnd);
      previousPeriodStart.setDate(previousPeriodStart.getDate() - 30);
      previousPeriodStart.setHours(0, 0, 0, 0); // Start of day
    }

    // Helper function to get local date string (YYYY-MM-DD) to avoid timezone issues
    // booking_date is a DATE field, so we need local date, not UTC
    const getLocalDateString = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Convert dates to date strings (YYYY-MM-DD) for booking_date field
    // Use local date to avoid timezone issues (e.g., if it's Dec 5 in SA, we want "2025-12-05", not UTC date)
    const currentPeriodStartDate = getLocalDateString(currentPeriodStart);
    const currentPeriodEndDate = getLocalDateString(currentPeriodEnd);
    const previousPeriodStartDate = getLocalDateString(previousPeriodStart);
    const previousPeriodEndDate = getLocalDateString(previousPeriodEnd);

    // Current period bookings - use booking_date (when service is scheduled)
    // Only include bookings with valid booking_date (not null)
    const { data: currentBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, total_amount, booking_date, status')
      .not('booking_date', 'is', null)
      .gte('booking_date', currentPeriodStartDate)
      .lte('booking_date', currentPeriodEndDate);

    // Previous period bookings - use booking_date (when service is scheduled)
    // Only include bookings with valid booking_date (not null)
    const { data: previousBookings, error: prevBookingsError } = await supabase
      .from('bookings')
      .select('id, total_amount, booking_date')
      .not('booking_date', 'is', null)
      .gte('booking_date', previousPeriodStartDate)
      .lte('booking_date', previousPeriodEndDate);

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
    
    // Helper function to calculate percentage growth with caps and handling for edge cases
    const calculateGrowth = (current: number, previous: number): number => {
      if (previous <= 0) {
        // If previous period had no data, return 0 instead of infinite/undefined
        return 0;
      }
      const growth = ((current - previous) / previous) * 100;
      // Cap extreme values at 9999% to avoid astronomical percentages
      // This handles cases where previous period had very few bookings
      return Math.min(Math.max(growth, -9999), 9999);
    };

    const revenueGrowth = calculateGrowth(currentRevenue, previousRevenue);

    // Calculate bookings count
    const currentBookingsCount = (currentBookings || []).length;
    const previousBookingsCount = (previousBookings || []).length;
    const bookingsGrowth = calculateGrowth(currentBookingsCount, previousBookingsCount);

    // Calculate average booking value
    const bookingsWithAmount = (currentBookings || []).filter((b) => b.total_amount && b.total_amount > 0);
    const avgBookingValue = bookingsWithAmount.length > 0
      ? currentRevenue / bookingsWithAmount.length
      : 0;
    
    const prevBookingsWithAmount = (previousBookings || []).filter((b) => b.total_amount && b.total_amount > 0);
    const prevAvgBookingValue = prevBookingsWithAmount.length > 0
      ? previousRevenue / prevBookingsWithAmount.length
      : 0;
    
    const avgValueGrowth = calculateGrowth(avgBookingValue, prevAvgBookingValue);

    // Count active customers (customers with bookings scheduled in current period)
    const { data: activeCustomersData } = await supabase
      .from('bookings')
      .select('customer_id')
      .not('booking_date', 'is', null)
      .gte('booking_date', currentPeriodStartDate)
      .lte('booking_date', currentPeriodEndDate)
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
      .not('booking_date', 'is', null)
      .gte('booking_date', previousPeriodStartDate)
      .lte('booking_date', previousPeriodEndDate)
      .not('customer_id', 'is', null);
    
    const prevUniqueCustomers = new Set(
      (prevActiveCustomersData || [])
        .map((b) => b.customer_id)
        .filter((id) => id !== null)
    );
    const prevActiveCustomers = prevUniqueCustomers.size;
    const customersGrowth = calculateGrowth(activeCustomers, prevActiveCustomers);

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
