import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get date range parameters
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    // Build date filter
    let bookingsQuery = supabase
      .from('bookings')
      .select('id, status, total_amount, created_at');

    if (dateFrom) {
      bookingsQuery = bookingsQuery.gte('created_at', dateFrom);
    }
    if (dateTo) {
      const dateToEnd = new Date(dateTo);
      dateToEnd.setHours(23, 59, 59, 999);
      bookingsQuery = bookingsQuery.lte('created_at', dateToEnd.toISOString());
    }

    // Fetch basic stats from database
    const { data: bookings, error: bookingsError } = await bookingsQuery;

    const { data: cleaners, error: cleanersError } = await supabase
      .from('cleaners')
      .select('id, is_active')
      .eq('is_active', true);

    // Fetch customers (filter by date if provided)
    let customersQuery = supabase
      .from('customers')
      .select('id');

    if (dateFrom) {
      customersQuery = customersQuery.gte('created_at', dateFrom);
    }
    if (dateTo) {
      const dateToEnd = new Date(dateTo);
      dateToEnd.setHours(23, 59, 59, 999);
      customersQuery = customersQuery.lte('created_at', dateToEnd.toISOString());
    }

    const { data: customers, error: customersError } = await customersQuery;

    // Fetch pending quotes
    let quotesQuery = supabase
      .from('quotes')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (dateFrom) {
      quotesQuery = quotesQuery.gte('created_at', dateFrom);
    }
    if (dateTo) {
      const dateToEnd = new Date(dateTo);
      dateToEnd.setHours(23, 59, 59, 999);
      quotesQuery = quotesQuery.lte('created_at', dateToEnd.toISOString());
    }

    const { count: pendingQuotes } = await quotesQuery;

    // Fetch pending applications
    let applicationsQuery = supabase
      .from('cleaner_applications')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (dateFrom) {
      applicationsQuery = applicationsQuery.gte('created_at', dateFrom);
    }
    if (dateTo) {
      const dateToEnd = new Date(dateTo);
      dateToEnd.setHours(23, 59, 59, 999);
      applicationsQuery = applicationsQuery.lte('created_at', dateToEnd.toISOString());
    }

    const { count: pendingApplications } = await applicationsQuery;

    // Fetch recurring schedules
    let recurringSchedulesQuery = supabase
      .from('recurring_schedules')
      .select('id, customer_id', { count: 'exact' })
      .eq('is_active', true);

    const { data: recurringSchedules, count: recurringSchedulesCount } = await recurringSchedulesQuery;

    // Get unique customers with recurring schedules
    const recurringCustomers = new Set(recurringSchedules?.map(s => s.customer_id) || []).size;

    // Fetch recurring bookings count
    let recurringBookingsQuery = supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .not('recurring_schedule_id', 'is', null);

    if (dateFrom) {
      recurringBookingsQuery = recurringBookingsQuery.gte('created_at', dateFrom);
    }
    if (dateTo) {
      const dateToEnd = new Date(dateTo);
      dateToEnd.setHours(23, 59, 59, 999);
      recurringBookingsQuery = recurringBookingsQuery.lte('created_at', dateToEnd.toISOString());
    }

    const { count: recurringBookings } = await recurringBookingsQuery;

    if (bookingsError || cleanersError || customersError) {
      console.error('Database errors:', { bookingsError, cleanersError, customersError });
    }

    // Calculate stats
    const totalBookings = bookings?.length || 0;
    const pendingBookings = bookings?.filter(b => b.status === 'pending' || b.status === 'confirmed').length || 0;
    const completedBookings = bookings?.filter(b => b.status === 'completed').length || 0;
    
    // Calculate total revenue (sum of all booking amounts)
    const totalRevenue = bookings?.reduce((sum, booking) => {
      return sum + (booking.total_amount || 0);
    }, 0) || 0;

    const activeCleaners = cleaners?.length || 0;
    const activeCustomers = customers?.length || 0;

    // Calculate 30-day comparison (simplified - you may want to improve this)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentBookings = bookings?.filter(b => {
      const bookingDate = new Date(b.created_at);
      return bookingDate >= thirtyDaysAgo;
    }).length || 0;

    const recentRevenue = bookings?.filter(b => {
      const bookingDate = new Date(b.created_at);
      return bookingDate >= thirtyDaysAgo;
    }).reduce((sum, booking) => sum + (booking.total_amount || 0), 0) || 0;

    // Calculate deltas (percentage change)
    const previousPeriodBookings = totalBookings - recentBookings;
    const bookingsDelta = previousPeriodBookings > 0 
      ? ((recentBookings - previousPeriodBookings) / previousPeriodBookings) * 100 
      : null;

    const previousPeriodRevenue = totalRevenue - recentRevenue;
    const revenueDelta = previousPeriodRevenue > 0
      ? ((recentRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100
      : null;

    return NextResponse.json({
      ok: true,
      stats: {
        totalRevenue,
        totalBookings,
        activeCleaners,
        activeCustomers,
        pendingBookings,
        completedBookings,
        pendingQuotes: pendingQuotes || 0,
        pendingApplications: pendingApplications || 0,
        recurringCustomers: recurringCustomers || 0,
        recurringBookings: recurringBookings || 0,
        revenueDelta: revenueDelta ? Math.round(revenueDelta) : null,
        bookingsDelta: bookingsDelta ? Math.round(bookingsDelta) : null,
      },
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}

