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
    
    // Calculate today's date in local timezone (to match database DATE type exactly)
    const today = new Date();
    // Use local date, not UTC, to match how dates are typically stored
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayISO = `${year}-${month}-${day}`; // YYYY-MM-DD format in local timezone
    
    // Calculate 48 hours ago for quote aging
    const fortyEightHoursAgo = new Date();
    fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);
    const fortyEightHoursAgoISO = fortyEightHoursAgo.toISOString();
    
    // Determine today's day of week for filtering
    const todayDay = new Date(todayISO).getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayColumns = [
      'available_sunday',
      'available_monday',
      'available_tuesday',
      'available_wednesday',
      'available_thursday',
      'available_friday',
      'available_saturday'
    ];
    const todayDayColumn = dayColumns[todayDay];
    
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
      // Diagnostic queries for today's revenue
      allBookingsToday,
      completedBookingsTodayDiagnostic,
      completedBookingsDateRange,
      todayRevenue,
      unassignedBookings,
      todayBookingsWithCleaners,
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
      // Cleaners by active status (both is_active AND is_available must be true)
      // Also filter by today's day-of-week availability for "active" count
      Promise.all([
        supabase.from('cleaners').select('id', { count: 'exact', head: true }),
        supabase.from('cleaners')
          .select('id, name, is_active, is_available, ' + todayDayColumn, { count: 'exact', head: false })
          .eq('is_active', true)
          .eq('is_available', true)
          .eq(todayDayColumn, true) // Must be available on today's day
          .not('is_active', 'is', null)
          .not('is_available', 'is', null),
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
      // Today's bookings (for display - limited to 20)
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
        .limit(100), // Increased limit to catch all bookings
      // Today's bookings with cleaner assignments (to exclude booked cleaners)
      // Only exclude cleaners with ACTIVE bookings (pending, accepted, ongoing, confirmed, in_progress)
      // If all their bookings are completed, they're available again
      supabase
        .from('bookings')
        .select('cleaner_id, status, booking_date, id')
        .eq('booking_date', todayISO)
        .not('cleaner_id', 'is', null)
        .not('cleaner_id', 'eq', 'manual')
        .not('cleaner_id', 'eq', 'team')
        .in('status', ['pending', 'accepted', 'ongoing', 'in_progress']),
      // Diagnostic queries to understand why only 1 booking is found
      // Query 1: All bookings for today (any status) - to see total bookings
      supabase
        .from('bookings')
        .select('id, booking_date, status, total_amount')
        .eq('booking_date', todayISO),
      // Query 2: All completed bookings for today (case-insensitive status check)
      // Using ilike for case-insensitive matching in case status has variations
      supabase
        .from('bookings')
        .select('id, booking_date, status, total_amount, customer_name')
        .eq('booking_date', todayISO)
        .ilike('status', 'completed'), // Case-insensitive match
      // Query 3: Completed bookings in date range (today +/- 1 day) for timezone edge cases
      supabase
        .from('bookings')
        .select('id, booking_date, status, total_amount')
        .gte('booking_date', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .lte('booking_date', tomorrowISO)
        .ilike('status', 'completed'),
      // Main query: Today's revenue (only bookings scheduled for today that are completed)
      // This filters for bookings where:
      // 1. booking_date = today (exact date match, no timezone conversion)
      // 2. status = 'completed' (actually completed)
      // Note: total_amount is stored in cents
      // We include bookings with null/0 amounts for debugging, but they won't contribute to revenue
      // Also fetch price_snapshot in case total_amount is missing
      supabase
        .from('bookings')
        .select('id, total_amount, cleaner_completed_at, booking_date, status, customer_name, price_snapshot, created_at, updated_at')
        .eq('booking_date', todayISO) // Exact date match - no timezone conversion
        .ilike('status', 'completed'), // Case-insensitive to catch status variations
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
      // Available cleaners today (check day of week availability)
      supabase
        .from('cleaners')
        .select('id, name, available_monday, available_tuesday, available_wednesday, available_thursday, available_friday, available_saturday, available_sunday')
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
    
    // Process diagnostic query results
    console.log('🔍 DIAGNOSTIC: Today\'s Booking Analysis');
    console.log(`   Date filter: ${todayISO}`);
    console.log(`   All bookings for today (any status): ${allBookingsToday.data?.length || 0}`);
    if (allBookingsToday.data && allBookingsToday.data.length > 0) {
      const statusBreakdown: Record<string, number> = {};
      allBookingsToday.data.forEach((b: any) => {
        statusBreakdown[b.status] = (statusBreakdown[b.status] || 0) + 1;
      });
      console.log(`   Status breakdown:`, statusBreakdown);
      // Show individual bookings for debugging
      allBookingsToday.data.forEach((b: any) => {
        console.log(`     - ${b.id}: status="${b.status}", date=${b.booking_date}, amount=${b.total_amount || 'null'}`);
      });
    }
    console.log(`   Completed bookings today (case-insensitive): ${completedBookingsTodayDiagnostic.data?.length || 0}`);
    if (completedBookingsTodayDiagnostic.data && completedBookingsTodayDiagnostic.data.length > 0) {
      completedBookingsTodayDiagnostic.data.forEach((b: any) => {
        console.log(`     - ${b.id}: customer=${b.customer_name || 'N/A'}, amount=${b.total_amount || 'null'}`);
      });
    }
    console.log(`   Completed bookings in date range (today +/- 1 day): ${completedBookingsDateRange.data?.length || 0}`);
    if (completedBookingsDateRange.data && completedBookingsDateRange.data.length > 0) {
      completedBookingsDateRange.data.forEach((b: any) => {
        const isToday = b.booking_date === todayISO;
        console.log(`     - ${b.id}: date=${b.booking_date} ${isToday ? '(TODAY)' : ''}, amount=${b.total_amount || 'null'}`);
      });
    }
    
    // Check for errors in queries
    if (todayRevenue.error) {
      console.error('❌ Error fetching today\'s revenue:', todayRevenue.error);
    }
    if (allBookingsToday.error) {
      console.error('❌ Error in diagnostic query (all bookings today):', allBookingsToday.error);
    }
    if (completedBookingsTodayDiagnostic.error) {
      console.error('❌ Error in diagnostic query (completed today):', completedBookingsTodayDiagnostic.error);
    }
    
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
    
    // Get cleaner IDs who have active bookings today (exclude them from active count)
    // Use both the dedicated query AND the existing todayBookings data as fallback
    console.log('🔍 Checking bookings query result:', {
      dedicatedQuery: {
        data: todayBookingsWithCleaners.data,
        error: todayBookingsWithCleaners.error,
        count: todayBookingsWithCleaners.data?.length || 0,
        status: todayBookingsWithCleaners.status
      },
      todayBookingsList: {
        count: todayBookings.data?.length || 0,
        data: todayBookings.data?.slice(0, 5) // Show first 5 for debugging
      }
    });
    console.log('🔍 Today ISO date:', todayISO);
    
    // Check if dedicated query failed - if so, log the error
    if (todayBookingsWithCleaners.error) {
      console.error('❌ Dedicated bookings query error:', todayBookingsWithCleaners.error);
    }
    
    // Get cleaners from dedicated query
    const bookingsFromQuery = (todayBookingsWithCleaners.data || []).filter((booking: any) => {
      return booking.cleaner_id && booking.cleaner_id !== 'manual';
    });
    
    // Also check the todayBookings list (already fetched for display)
    // Only include ACTIVE bookings (not completed/cancelled) - cleaners with completed bookings are available again
    const bookingsFromList = (todayBookings.data || []).filter((booking: any) => {
      const hasValidCleaner = booking.cleaner_id && 
                             booking.cleaner_id !== 'manual' && 
                             booking.cleaner_id !== 'team';
      // Only active statuses: pending, accepted, ongoing, in_progress
      const activeStatuses = ['pending', 'accepted', 'ongoing', 'in_progress'];
      const isActiveStatus = booking.status && activeStatuses.includes(booking.status.toLowerCase());
      return hasValidCleaner && isActiveStatus;
    });
    
    console.log('🔍 Raw bookingsFromList:', bookingsFromList.length, 'bookings');
    console.log('🔍 Raw bookingsFromList details:', bookingsFromList.map((b: any) => ({
      id: b.id,
      cleaner_id: b.cleaner_id,
      cleaner_id_type: typeof b.cleaner_id,
      status: b.status,
      booking_date: b.booking_date
    })));
    
    // Combine both sources and deduplicate by cleaner_id (one cleaner can have multiple bookings)
    const bookingMapByCleaner = new Map<string, any>();
    
    // Add from dedicated query
    bookingsFromQuery.forEach((booking: any) => {
      if (booking.cleaner_id && booking.cleaner_id !== 'manual' && booking.cleaner_id !== 'team') {
        const cleanerId = String(booking.cleaner_id).trim();
        if (!bookingMapByCleaner.has(cleanerId)) {
          bookingMapByCleaner.set(cleanerId, booking);
        }
      }
    });
    
    // Add from todayBookings list
    bookingsFromList.forEach((booking: any) => {
      if (booking.cleaner_id && booking.cleaner_id !== 'manual' && booking.cleaner_id !== 'team') {
        const cleanerId = String(booking.cleaner_id).trim();
        if (!bookingMapByCleaner.has(cleanerId)) {
          bookingMapByCleaner.set(cleanerId, booking);
        }
      }
    });
    
    const bookingsToday = Array.from(bookingMapByCleaner.values());
    console.log('🔍 Bookings from dedicated query:', bookingsFromQuery.length);
    console.log('🔍 Bookings from todayBookings list:', bookingsFromList.length);
    console.log('🔍 Unique cleaners with bookings (deduplicated):', bookingsToday.length);
    
    // Create Set of booked cleaner IDs, ensuring proper string conversion and normalization
    // Normalize to lowercase for consistent comparison with cleaner IDs later
    const bookedCleanerIdsToday = new Set<string>(
      bookingsToday
        .map((booking: any) => {
          const cleanerId = booking.cleaner_id;
          // Handle both UUID and string formats, normalize to lowercase
          return cleanerId ? String(cleanerId).trim().toLowerCase() : null;
        })
        .filter((id: string | null): id is string => id !== null && id !== 'manual' && id !== 'team' && id !== 'null')
    );
    
    console.log('🔍 Processed booked cleaner IDs:', Array.from(bookedCleanerIdsToday));
    console.log('🔍 Bookings detail for each cleaner:', bookingsToday.map(b => ({
      cleaner_id: b.cleaner_id,
      status: b.status,
      booking_id: b.id
    })));
    
    console.log('📅 Today\'s bookings with cleaners:', bookingsToday.length);
    console.log('📅 Unique cleaners with bookings today:', bookedCleanerIdsToday.size);
    if (bookedCleanerIdsToday.size > 0) {
      console.log('  Booked cleaner IDs (as strings):', Array.from(bookedCleanerIdsToday));
      console.log('  Bookings details:', bookingsToday.map((b: any) => `Cleaner ${b.cleaner_id} - Status: ${b.status}`));
    } else {
      console.log('  ⚠️  No cleaners found with bookings today - check query!');
    }

    // Debug logging for cleaner counts
    console.log('🔍 Cleaner Counts Debug:');
    console.log('  Total cleaners result:', totalCleanersResult);
    console.log('  Active cleaners result:', activeCleanersResult);
    console.log('  Active cleaners count:', activeCleanersResult?.count);
    console.log('  Active cleaners error:', activeCleanersResult?.error);
    
    // Debug: List all cleaners being counted
    if (activeCleanersResult?.data) {
      console.log(`  📋 All active cleaners (is_active=true AND is_available=true AND ${todayDayColumn}=true):`);
      activeCleanersResult.data.forEach((cleaner: any) => {
        console.log(`    - ${cleaner.name || cleaner.id} (ID: ${cleaner.id})`);
      });
    }

    // Operational metrics
    const totalBookings = allBookings.count || 0;
    const recentBookings = recentBookingStats.count || 0;
    
    // Filter out cleaners with bookings today from active count
    const activeCleanersBeforeFilter = activeCleanersResult?.data || [];
    
    // Debug: Show cleaner IDs for comparison
    const activeCleanerIds = activeCleanersBeforeFilter.map((c: any) => String(c.id));
    console.log('🔍 Active cleaner IDs:', activeCleanerIds);
    console.log('🔍 Booked cleaner IDs to exclude:', Array.from(bookedCleanerIdsToday));
    
    // Normalize active cleaner IDs for comparison (bookedCleanerIdsToday is already lowercase)
    const activeIdsLower = new Set(activeCleanerIds.map(id => String(id).trim().toLowerCase()));
    
    const matchingIds = activeCleanerIds.filter(id => {
      const idLower = String(id).trim().toLowerCase();
      return bookedCleanerIdsToday.has(idLower);
    });
    
    console.log('🔍 Matching IDs (should be excluded):', matchingIds);
    console.log('🔍 Booked IDs (normalized):', Array.from(bookedCleanerIdsToday));
    console.log('🔍 Active IDs count:', activeIdsLower.size, '(sample:', Array.from(activeIdsLower).slice(0, 3), ')');
    console.log('🔍 Full comparison - checking each booked ID against active IDs:');
    Array.from(bookedCleanerIdsToday).forEach((bookedId: string) => {
      const isInActive = activeIdsLower.has(bookedId);
      console.log(`  - Booked ID "${bookedId}" ${isInActive ? '✅ FOUND in active list' : '❌ NOT in active list'}`);
    });
    
    if (matchingIds.length === 0 && bookedCleanerIdsToday.size > 0) {
      console.log('  ⚠️  WARNING: No matching cleaner IDs found!');
      console.log('  This means the cleaners with bookings are NOT in the active list');
      console.log('  (They might not meet criteria: is_active=true AND is_available=true AND available on today\'s day)');
      console.log('  Booked cleaner IDs:', Array.from(bookedCleanerIdsToday));
      console.log('  Active cleaner IDs sample:', activeCleanerIds.slice(0, 5));
      
      // Check if booked cleaners exist in database but don't meet active criteria
      const bookedIdsArray = Array.from(bookedCleanerIdsToday);
      console.log('  💡 The cleaners with bookings might not be available on today\'s day of week');
    }
    
    const activeCleanersWithoutBookings = activeCleanersBeforeFilter.filter((cleaner: any) => {
      // Convert cleaner.id to string and normalize for comparison
      const cleanerIdStr = String(cleaner.id).trim().toLowerCase();
      
      // Check if this cleaner ID is in the booked cleaners set (already normalized to lowercase)
      const isBooked = bookedCleanerIdsToday.has(cleanerIdStr);
      
      if (isBooked) {
        console.log(`  ❌ Excluding cleaner "${cleaner.name || 'Unknown'}" (ID: ${cleaner.id}) - has booking today`);
      }
      return !isBooked;
    });
    
    const activeCleaners = activeCleanersWithoutBookings.length;
    
    console.log('📊 Active cleaners breakdown:');
    console.log(`  Before excluding bookings: ${activeCleanersBeforeFilter.length}`);
    console.log(`  Cleaners with bookings today: ${bookedCleanerIdsToday.size}`);
    console.log(`  After excluding booked cleaners: ${activeCleanersWithoutBookings.length}`);
    console.log(`  Final active cleaners (ready to work): ${activeCleaners}`);
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

    // Calculate today's revenue from completed bookings scheduled for today
    // Convert from cents to rands (divide by 100)
    // Use price_snapshot as fallback if total_amount is missing
    const todayRevenueData = todayRevenue.data || [];
    
    // Helper function to extract amount from booking (with price_snapshot fallback)
    const getBookingAmount = (b: any): number => {
      let amount = b.total_amount || 0;
      
      // If total_amount is missing or zero, try to get it from price_snapshot
      if ((!amount || amount === 0) && b.price_snapshot) {
        try {
          // Handle both string and object formats
          const snapshot = typeof b.price_snapshot === 'string' 
            ? JSON.parse(b.price_snapshot) 
            : b.price_snapshot;
          
          // Try multiple field name variations
          amount = snapshot?.total 
            || snapshot?.totalAmount 
            || snapshot?.price
            || snapshot?.amount
            || (snapshot?.subtotal && snapshot?.serviceFee ? snapshot.subtotal + snapshot.serviceFee : null)
            || 0;
          
          if (amount && amount > 0) {
            console.log(`   💰 Using price_snapshot for booking ${b.id}: ${amount} cents from field ${Object.keys(snapshot).find(k => snapshot[k] === amount) || 'calculated'}`);
          }
        } catch (e) {
          console.log(`   ❌ Error parsing price_snapshot for booking ${b.id}: ${e instanceof Error ? e.message : String(e)}`);
          // Try to log the raw snapshot for debugging
          if (b.price_snapshot) {
            console.log(`      Raw snapshot type: ${typeof b.price_snapshot}, preview: ${JSON.stringify(b.price_snapshot).substring(0, 200)}`);
          }
        }
      }
      
      return amount;
    };
    
    // Filter to only include bookings that match today's date exactly
    const todayBookingsOnly = todayRevenueData.filter(b => {
      const bookingDate = b.booking_date;
      // Ensure exact date match (handles both string and Date formats)
      const bookingDateStr = typeof bookingDate === 'string' 
        ? bookingDate.split('T')[0] 
        : new Date(bookingDate).toISOString().split('T')[0];
      return bookingDateStr === todayISO;
    });
    
    // Calculate revenue only from today's bookings
    let todayRevenueAmount = (todayBookingsOnly.reduce((sum, b) => {
      return sum + getBookingAmount(b);
    }, 0) || 0) / 100;
    
    const todayBookingsCount = todayBookings.data?.length || 0;
    
    // Comprehensive diagnostic logging
    console.log(`\n📊 Today's Revenue Calculation:`);
    console.log(`   - Date filter: ${todayISO} (current date only)`);
    console.log(`   - Today's date (local): ${todayISO}`);
    console.log(`   - Today's date (UTC): ${today.toISOString().split('T')[0]}`);
    console.log(`   - Query found: ${todayRevenueData.length} completed booking(s)`);
    console.log(`   - After date filtering: ${todayBookingsOnly.length} booking(s) match ${todayISO} exactly`);
    // Warn if we found bookings with different dates
    if (todayBookingsOnly.length !== todayRevenueData.length) {
      const excludedCount = todayRevenueData.length - todayBookingsOnly.length;
      console.log(`   ⚠️  Filtered out ${excludedCount} booking(s) with dates other than ${todayISO}`);
      todayRevenueData.forEach((b) => {
        const bookingDateStr = typeof b.booking_date === 'string' 
          ? b.booking_date.split('T')[0] 
          : new Date(b.booking_date).toISOString().split('T')[0];
        if (bookingDateStr !== todayISO) {
          console.log(`     - Excluded: ${b.id} (date=${bookingDateStr}, expected=${todayISO})`);
        }
      });
    }
    
    if (todayBookingsOnly.length > 0) {
      console.log(`   - Booking details (${todayBookingsOnly.length} booking(s) for ${todayISO}):`);
      
      todayBookingsOnly.forEach((b: any, idx) => {
        const amount = b.total_amount || 0;
        const amountRands = amount / 100;
        const amountStatus = b.total_amount === null ? 'NULL' : b.total_amount === 0 ? 'ZERO' : 'OK';
        const bookingDateStr = typeof b.booking_date === 'string' 
          ? b.booking_date.split('T')[0] 
          : new Date(b.booking_date).toISOString().split('T')[0];
        
        // Check price_snapshot if total_amount is missing
        let snapshotAmount = null;
        let snapshotStatus = '';
        if ((!b.total_amount || b.total_amount === 0) && b.price_snapshot) {
          try {
            const snapshot = typeof b.price_snapshot === 'string' 
              ? JSON.parse(b.price_snapshot) 
              : b.price_snapshot;
            snapshotAmount = snapshot?.total || snapshot?.totalAmount || null;
            if (snapshotAmount && snapshotAmount > 0) {
              snapshotStatus = ` ✅ Found in price_snapshot: ${snapshotAmount} cents (R${(snapshotAmount / 100).toFixed(2)})`;
            } else {
              snapshotStatus = ` ⚠️ price_snapshot exists but no amount found`;
            }
          } catch (e) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            snapshotStatus = ` ❌ Error parsing price_snapshot: ${errorMessage}`;
          }
        } else if ((!b.total_amount || b.total_amount === 0) && !b.price_snapshot) {
          snapshotStatus = ` ❌ No price_snapshot available`;
        }
        
        console.log(`     [${idx + 1}] ID: ${b.id}, Customer: ${b.customer_name || 'N/A'}`);
        console.log(`         Date: ${bookingDateStr} ✅ (matches filter: ${todayISO})`);
        console.log(`         total_amount: ${amount} cents (R${amountRands.toFixed(2)}) [${amountStatus}]${snapshotStatus}`);
      });
    } else {
      // Debug: Check if there are any completed bookings at all for today
      const { data: debugBookings } = await supabase
        .from('bookings')
        .select('id, booking_date, status, total_amount')
        .eq('booking_date', todayISO);
      console.log(`   - All bookings for ${todayISO}: ${debugBookings?.length || 0}`);
      if (debugBookings) {
        debugBookings.forEach(b => {
          console.log(`     - ${b.id}: date=${b.booking_date}, status=${b.status}, amount=${b.total_amount || 'null'}`);
        });
      }
      
      // Also check completed bookings regardless of date
      const { data: allCompleted } = await supabase
        .from('bookings')
        .select('id, booking_date, status, total_amount')
        .eq('status', 'completed')
        .limit(5);
      console.log(`   - Sample of all completed bookings (first 5):`);
      if (allCompleted) {
        allCompleted.forEach(b => {
          console.log(`     - ${b.id}: date=${b.booking_date}, amount=${b.total_amount || 'null'}`);
        });
      }
    }
    // Calculate breakdown for detailed logging (using only today's bookings)
    const totalFromAmountOnly = todayBookingsOnly.reduce((sum, b: any) => sum + (b.total_amount || 0), 0);
    const totalFromSnapshot = todayBookingsOnly.reduce((sum, b: any) => {
      if ((!b.total_amount || b.total_amount === 0) && b.price_snapshot) {
        try {
          const snapshot = typeof b.price_snapshot === 'string' 
            ? JSON.parse(b.price_snapshot) 
            : b.price_snapshot;
          const amount = snapshot?.total 
            || snapshot?.totalAmount 
            || snapshot?.price
            || snapshot?.amount
            || (snapshot?.subtotal && snapshot?.serviceFee ? snapshot.subtotal + snapshot.serviceFee : null)
            || 0;
          return sum + (amount > 0 ? amount : 0);
        } catch (e) {
          return sum;
        }
      }
      return sum;
    }, 0);
    const finalTotalCents = todayRevenueAmount * 100; // Convert back to cents for comparison
    
    console.log(`\n   💰 Revenue Breakdown:`);
    console.log(`      - From total_amount field: ${totalFromAmountOnly} cents = R${(totalFromAmountOnly / 100).toFixed(2)}`);
    console.log(`      - From price_snapshot fallback: ${totalFromSnapshot} cents = R${(totalFromSnapshot / 100).toFixed(2)}`);
    console.log(`      - Combined total: ${finalTotalCents} cents = R${todayRevenueAmount.toFixed(2)}`);
    console.log(`      - Final revenue returned to frontend: R${todayRevenueAmount.toFixed(2)}`);
    
    // Warn if revenue is 0 but bookings exist
    if (todayRevenueAmount === 0 && todayBookingsOnly.length > 0) {
      console.log(`\n   ⚠️  WARNING: Revenue is R0.00 but ${todayBookingsOnly.length} completed booking(s) found for today!`);
      console.log(`      All bookings likely have total_amount = 0 and no valid price_snapshot.`);
      console.log(`      Manual database update may be required.`);
    }
    
    // Warn if calculation mismatch
    const expectedTotal = totalFromAmountOnly + totalFromSnapshot;
    if (Math.abs(finalTotalCents - expectedTotal) > 0.01) {
      console.log(`\n   ⚠️  WARNING: Calculation mismatch detected!`);
      console.log(`      Expected: ${expectedTotal} cents`);
      console.log(`      Actual: ${finalTotalCents} cents`);
      console.log(`      Difference: ${Math.abs(finalTotalCents - expectedTotal)} cents`);
    }

    // Process unassigned bookings
    const unassignedBookingsCount = unassignedBookings.data?.length || 0;
    const unassignedBookingsList = (unassignedBookings.data || []).slice(0, 10);

    // Process available cleaners
    // Count available cleaners today based on day of week
    // Note: todayDay and dayColumns already defined above
    const availableCleanersTodayCount = availableCleanersToday.data?.filter(cleaner => {
      return cleaner[dayColumns[todayDay] as keyof typeof cleaner] === true;
    }).length || 0;
    
    // Count available cleaners tomorrow based on day of week
    const tomorrowDay = new Date(tomorrowISO).getDay(); // 0 = Sunday, 1 = Monday, etc.
    const availableCleanersTomorrowCount = availableCleanersTomorrow.data?.filter(cleaner => {
      return cleaner[dayColumns[tomorrowDay] as keyof typeof cleaner] === true;
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

