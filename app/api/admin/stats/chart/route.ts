import { NextRequest, NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * Admin Stats Chart Data API
 * GET: Fetch time-series data for charts
 * Query params:
 *   - days: number of days to fetch (default: 30)
 *   - endDate: ISO date string (default: today)
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📊 Chart API called:', request.url);
    
    // Check admin access with detailed logging
    const adminStatus = await isAdmin();
    if (!adminStatus) {
      console.error('❌ Chart API: Admin check failed - unauthorized access attempt');
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }
    
    console.log('✅ Chart API: Admin access granted');
    
    const supabase = await createClient();
    const url = new URL(request.url);
    
    // Parse query parameters
    const endDateParam = url.searchParams.get('endDate');
    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    const daysBack = parseInt(url.searchParams.get('days') || '30');
    
    // Go back (daysBack - 1) days to get exactly 'daysBack' days including today
    // e.g., for "last 10 days", go back 9 days to get days 1-10 (10 days total)
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - (daysBack - 1));
    
    // Set time boundaries: start at beginning of startDate, end at end of endDate
    // Use date strings (YYYY-MM-DD) for booking_date filtering (date column, not timestamp)
    startDate.setHours(0, 0, 0, 0);
    const endDateWithTime = new Date(endDate);
    endDateWithTime.setHours(23, 59, 59, 999);
    const startDateISO = startDate.toISOString();
    const endDateISO = endDateWithTime.toISOString();
    
    // Convert to date strings for booking_date filtering (YYYY-MM-DD format)
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    // Fetch bookings in date range by booking_date (scheduled date, not creation date)
    // This matches the cleaner dashboard and admin stats API behavior
    // Include created_at for customer analysis (to track when customers first appeared)
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('created_at, total_amount, cleaner_earnings, service_fee, status, service_type, customer_id, booking_date')
      .gte('booking_date', startDateStr)
      .lte('booking_date', endDateStr)
      .order('booking_date', { ascending: true });
    
    if (error) {
      console.error('Error fetching chart data:', error);
      throw error;
    }
    
    // Group data by day with service type breakdown
    const dailyData = new Map<string, {
      date: string;
      revenue: number;
      bookings: number;
      completed: number;
      cancelled: number;
      companyEarnings: number;
      // Service type breakdowns
      moveInMoveOut: number;
      standardCleaning: number;
      deepCleaning: number;
      airbnb: number;
      // Customer type breakdowns
      newCustomers: number;
      recurringCustomers: number;
      returningCustomers: number;
    }>();
    
    (bookings || []).forEach((booking) => {
      // Use booking_date (scheduled date) for chart grouping, not created_at
      // This ensures charts show bookings scheduled for each day, matching the filter period
      const date = booking.booking_date || new Date(booking.created_at).toISOString().split('T')[0]; // YYYY-MM-DD
      
      if (!dailyData.has(date)) {
        dailyData.set(date, {
          date,
          revenue: 0,
          bookings: 0,
          completed: 0,
          cancelled: 0,
          companyEarnings: 0,
          moveInMoveOut: 0,
          standardCleaning: 0,
          deepCleaning: 0,
          airbnb: 0,
          newCustomers: 0,
          recurringCustomers: 0,
          returningCustomers: 0,
        });
      }
      
      const dayData = dailyData.get(date)!;
      dayData.bookings += 1;
      
      // Categorize by service type
      // Service types in DB: 'Standard', 'Deep', 'Move In/Out', 'Airbnb'
      const serviceType = (booking.service_type || '').trim();
      if (serviceType === 'Move In/Out' || serviceType.toLowerCase().includes('move')) {
        dayData.moveInMoveOut += 1;
      } else if (serviceType === 'Standard') {
        dayData.standardCleaning += 1;
      } else if (serviceType === 'Deep') {
        dayData.deepCleaning += 1;
      } else if (serviceType === 'Airbnb' || serviceType.toLowerCase().includes('airbnb')) {
        dayData.airbnb += 1;
      }
      
      if (booking.status === 'completed') {
        dayData.completed += 1;
        dayData.revenue += (booking.total_amount || 0) / 100; // Convert cents to rands - only from completed
        const cleanerEarnings = (booking.cleaner_earnings || 0) / 100;
        dayData.companyEarnings += (booking.total_amount || 0) / 100 - cleanerEarnings;
      }
      
      if (booking.status === 'cancelled') {
        dayData.cancelled += 1;
      }
    });
    
    // Convert to array and sort by date
    let chartData = Array.from(dailyData.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Fill in missing dates with zero values to ensure complete timeline
    const filledChartData: typeof chartData = [];
    const currentDate = new Date(startDate);
    const endDateObj = new Date(endDate);
    
    // Create a map of existing data for quick lookup
    const dataMap = new Map(chartData.map(d => [d.date, d]));
    
    // Iterate through each day in the range
    while (currentDate <= endDateObj) {
      const dateStr = currentDate.toISOString().split('T')[0];
      
      if (dataMap.has(dateStr)) {
        // Use existing data
        filledChartData.push(dataMap.get(dateStr)!);
      } else {
        // Fill with zero values for missing dates
        filledChartData.push({
          date: dateStr,
          revenue: 0,
          bookings: 0,
          completed: 0,
          cancelled: 0,
          companyEarnings: 0,
          moveInMoveOut: 0,
          standardCleaning: 0,
          deepCleaning: 0,
          airbnb: 0,
          newCustomers: 0,
          recurringCustomers: 0,
          returningCustomers: 0,
        });
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Calculate customer categorization for customer analysis
    // Always calculate for periods >= 7 days to provide customer insights
    let customerAnalysis = null;
    
    if (daysBack >= 7) { // Only calculate for periods >= 7 days to avoid performance issues
      // Fetch all customer IDs and their booking counts in this period
      // Bookings are already filtered by startDateISO to endDateISO
      const customerMap = new Map<string, { firstBooking: Date; bookingCount: number; bookingDates: Date[]; category?: string }>();
      
      (bookings || []).forEach((booking) => {
        if (booking.customer_id) {
          const customerId = booking.customer_id;
          const bookingDate = new Date(booking.created_at);
          
          if (!customerMap.has(customerId)) {
            customerMap.set(customerId, {
              firstBooking: bookingDate,
              bookingCount: 0,
              bookingDates: []
            });
          }
          
          const customerData = customerMap.get(customerId)!;
          customerData.bookingCount++;
          customerData.bookingDates.push(bookingDate);
          
          // Track earliest booking date for this customer in this period
          if (bookingDate < customerData.firstBooking) {
            customerData.firstBooking = bookingDate;
          }
        }
      });
      
      // Categorize customers based on booking behavior
      // OPTIMIZATION: Fetch all previous bookings in one query instead of N+1 queries
      const customerIds = Array.from(customerMap.keys());
      let previousBookingsMap = new Map<string, boolean>();
      
      if (customerIds.length > 0) {
        // Fetch all previous bookings for these customers in a single query
        const { data: previousBookings } = await supabase
          .from('bookings')
          .select('customer_id')
          .in('customer_id', customerIds)
          .lt('created_at', startDateISO);
        
        // Create a Set of customer IDs who had previous bookings
        const previousCustomerIds = new Set(
          (previousBookings || []).map((b: any) => b.customer_id).filter(Boolean)
        );
        
        // Build map for quick lookup
        customerIds.forEach(id => {
          previousBookingsMap.set(id, previousCustomerIds.has(id));
        });
      }
      
      let newCustomers = 0;
      let recurringCustomers = 0;
      let returningCustomers = 0;
      
      // Categorize customers using the pre-fetched data
      for (const [customerId, data] of customerMap.entries()) {
        const totalBookings = data.bookingCount;
        const hadPreviousBookings = previousBookingsMap.get(customerId) || false;
        
        if (!hadPreviousBookings && totalBookings === 1) {
          // New customer: first booking ever
          newCustomers++;
          data.category = 'new';
        } else if (totalBookings >= 2) {
          // Recurring customer: multiple bookings in this period
          recurringCustomers++;
          data.category = 'recurring';
        } else if (hadPreviousBookings && totalBookings === 1) {
          // Returning customer: had bookings before but only one in this period
          returningCustomers++;
          data.category = 'returning';
        }
      }
      
      // Now populate daily customer counts based on categorization
      for (const [customerId, data] of customerMap.entries()) {
        // Count this customer once for their first appearance in the period
        if (data.category && data.firstBooking) {
          const dateStr = data.firstBooking.toISOString().split('T')[0];
          const dayData = dailyData.get(dateStr);
          if (dayData) {
            if (data.category === 'new') {
              dayData.newCustomers += 1;
            } else if (data.category === 'recurring') {
              dayData.recurringCustomers += 1;
            } else if (data.category === 'returning') {
              dayData.returningCustomers += 1;
            }
          }
        }
      }
      
      customerAnalysis = {
        new: newCustomers,
        recurring: recurringCustomers,
        returning: returningCustomers
      };
    }
    
    // Rebuild chartData with updated customer counts
    chartData = Array.from(dailyData.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Refill chartData with proper customer counts
    const filledChartDataWithCustomers: typeof chartData = [];
    const currentDateForRefill = new Date(startDate);
    const endDateObjForRefill = new Date(endDate);
    const dataMapWithCustomers = new Map(chartData.map(d => [d.date, d]));
    
    while (currentDateForRefill <= endDateObjForRefill) {
      const dateStr = currentDateForRefill.toISOString().split('T')[0];
      
      if (dataMapWithCustomers.has(dateStr)) {
        filledChartDataWithCustomers.push(dataMapWithCustomers.get(dateStr)!);
      } else {
        filledChartDataWithCustomers.push({
          date: dateStr,
          revenue: 0,
          bookings: 0,
          completed: 0,
          cancelled: 0,
          companyEarnings: 0,
          moveInMoveOut: 0,
          standardCleaning: 0,
          deepCleaning: 0,
          airbnb: 0,
          newCustomers: 0,
          recurringCustomers: 0,
          returningCustomers: 0,
        });
      }
      
      currentDateForRefill.setDate(currentDateForRefill.getDate() + 1);
    }
    
    chartData = filledChartDataWithCustomers;
    
    // Calculate comparison period (previous period of same length)
    // Use booking_date for comparison period to match main chart data
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - daysBack);
    const prevEndDate = new Date(startDate);
    prevEndDate.setDate(prevEndDate.getDate() - 1); // End date is day before startDate
    
    const prevStartDateStr = prevStartDate.toISOString().split('T')[0];
    const prevEndDateStr = prevEndDate.toISOString().split('T')[0];
    
    const { data: prevBookings } = await supabase
      .from('bookings')
      .select('total_amount, cleaner_earnings, status')
      .gte('booking_date', prevStartDateStr)
      .lte('booking_date', prevEndDateStr);
    
    // Calculate comparison metrics
    const currentRevenue = chartData.reduce((sum, d) => sum + d.revenue, 0);
    const currentBookings = chartData.reduce((sum, d) => sum + d.bookings, 0);
    const currentCompleted = chartData.reduce((sum, d) => sum + d.completed, 0);
    
    // Calculate previous period metrics (only from completed bookings for revenue)
    const prevCompletedBookings = (prevBookings || []).filter(b => b.status === 'completed');
    const prevRevenue = prevCompletedBookings.reduce((sum, b) => sum + ((b.total_amount || 0) / 100), 0);
    const prevBookingsCount = (prevBookings || []).length;
    const prevCompleted = prevCompletedBookings.length;
    
    const revenueChange = prevRevenue > 0 
      ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 
      : currentRevenue > 0 ? 100 : 0;
    const bookingsChange = prevBookingsCount > 0
      ? ((currentBookings - prevBookingsCount) / prevBookingsCount) * 100
      : currentBookings > 0 ? 100 : 0;
    const completedChange = prevCompleted > 0
      ? ((currentCompleted - prevCompleted) / prevCompleted) * 100
      : currentCompleted > 0 ? 100 : 0;
    
    return NextResponse.json({
      ok: true,
      chartData,
      customerAnalysis,
      comparison: {
        revenue: {
          current: currentRevenue,
          previous: prevRevenue,
          change: revenueChange,
        },
        bookings: {
          current: currentBookings,
          previous: prevBookingsCount,
          change: bookingsChange,
        },
        completed: {
          current: currentCompleted,
          previous: prevCompleted,
          change: completedChange,
        },
      },
    });
    
  } catch (error: any) {
    console.error('=== CHART DATA ERROR ===', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to fetch chart data' },
      { status: 500 }
    );
  }
}
