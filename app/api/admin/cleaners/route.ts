import { NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * Admin Cleaners API
 * GET: Fetch all cleaners (including inactive)
 * POST: Create new cleaner
 * PUT: Update cleaner
 * DELETE: Delete cleaner
 */
export async function GET(req: Request) {
  console.log('=== ADMIN CLEANERS GET ===');
  
  try {
    // Check admin access
    if (!await isAdmin()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }
    
    const supabase = await createClient();
    const url = new URL(req.url);
    
    // Get query parameters
    const includeInactive = url.searchParams.get('includeInactive') === 'true';
    
    // Calculate current month date range
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayISO = firstDayOfMonth.toISOString().split('T')[0];
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const firstDayNextMonthISO = nextMonth.toISOString().split('T')[0];
    
    // Build query
    let query = supabase
      .from('cleaners')
      .select('*');
    
    // Filter by active status if needed
    if (!includeInactive) {
      query = query.eq('is_active', true);
    }
    
    const { data: cleaners, error } = await query.order('name');
    
    if (error) throw error;
    
    // Fetch monthly earnings for all cleaners
    // IMPORTANT: Only include completed bookings - pending/accepted bookings don't count toward earnings
    // There are two types of bookings:
    // 1. Individual bookings: earnings stored in bookings.cleaner_earnings
    // 2. Team bookings (deep cleaning/move in/out): earnings stored in booking_team_members.earnings
    
    // Fetch individual (non-team) bookings earnings
    // Use cleaner_completed_at if available, otherwise use booking_date
    // This ensures earnings are counted in the month they were completed, not scheduled
    const { data: monthlyBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('cleaner_id, cleaner_earnings, requires_team, booking_date, cleaner_completed_at')
      .eq('status', 'completed') // ONLY completed bookings contribute to earnings
      .not('cleaner_id', 'is', null)
      .not('cleaner_id', 'eq', 'manual')
      .eq('requires_team', false); // Exclude team bookings (handled separately)
    
    if (bookingsError) {
      console.error('Error fetching monthly bookings:', bookingsError);
      // Continue without earnings if query fails
    }
    
    // Filter bookings by completion date (prefer cleaner_completed_at, fallback to booking_date)
    const filteredMonthlyBookings = (monthlyBookings || []).filter((booking: any) => {
      // Use completion date if available, otherwise use booking_date
      const completionDate = booking.cleaner_completed_at 
        ? new Date(booking.cleaner_completed_at).toISOString().split('T')[0]
        : booking.booking_date;
      
      // Check if completion date falls within current month
      return completionDate >= firstDayISO && completionDate < firstDayNextMonthISO;
    });
    
    console.log(`📊 Found ${filteredMonthlyBookings.length} individual completed bookings in current month (${firstDayISO} to ${firstDayNextMonthISO})`);
    
    // Fetch team bookings earnings from booking_team_members
    // Step 1: Get all team members (we'll filter by booking status/date in step 2)
    const { data: allTeamMembers, error: teamMembersError } = await supabase
      .from('booking_team_members')
      .select('cleaner_id, earnings, booking_team_id');
    
    let teamBookings: Array<{ cleaner_id: string; earnings: number }> = [];
    if (!teamMembersError && allTeamMembers && allTeamMembers.length > 0) {
      // Step 2: Get team details for these team members
      const teamIds = [...new Set(allTeamMembers.map(m => m.booking_team_id))];
      const { data: teams, error: teamsError } = await supabase
        .from('booking_teams')
        .select('id, booking_id')
        .in('id', teamIds);
      
      if (!teamsError && teams && teams.length > 0) {
        // Step 3: Get bookings that are completed (filter by completion date in step 4)
        const bookingIds = teams.map(t => t.booking_id);
        const { data: teamBookingsData, error: teamBookingsError } = await supabase
          .from('bookings')
          .select('id, status, booking_date, cleaner_completed_at')
          .in('id', bookingIds)
          .eq('status', 'completed');
        
        if (!teamBookingsError && teamBookingsData) {
          // Step 4: Filter by completion date and map team members to their earnings
          const filteredTeamBookings = teamBookingsData.filter((booking: any) => {
            // Use completion date if available, otherwise use booking_date
            const completionDate = booking.cleaner_completed_at 
              ? new Date(booking.cleaner_completed_at).toISOString().split('T')[0]
              : booking.booking_date;
            
            // Check if completion date falls within current month
            return completionDate >= firstDayISO && completionDate < firstDayNextMonthISO;
          });
          
          console.log(`📊 Found ${filteredTeamBookings.length} team completed bookings in current month`);
          
          // Step 5: Map team members to their earnings for completed bookings this month
          const completedBookingIds = new Set(filteredTeamBookings.map(b => b.id));
          const teamIdToBookingId = new Map(teams.map(t => [t.id, t.booking_id]));
          
          teamBookings = allTeamMembers
            .filter(member => {
              const bookingId = teamIdToBookingId.get(member.booking_team_id);
              return bookingId && completedBookingIds.has(bookingId);
            })
            .map(member => ({
              cleaner_id: member.cleaner_id,
              earnings: member.earnings || 0,
            }));
        }
      }
    } else if (teamMembersError) {
      console.error('Error fetching team members:', teamMembersError);
      // Continue without team earnings if query fails
    }
    
    // Aggregate monthly earnings and booking counts by cleaner_id
    // Sum both individual and team booking earnings
    const earningsMap = new Map<string, number>();
    const bookingCountMap = new Map<string, number>();
    
    // Process individual (non-team) bookings
    if (filteredMonthlyBookings && filteredMonthlyBookings.length > 0) {
      filteredMonthlyBookings.forEach((booking: any) => {
        // Only process valid UUID format cleaner_ids
        if (booking.cleaner_id && 
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(booking.cleaner_id)) {
          // Only count bookings with valid earnings (null/undefined becomes 0)
          const earnings = booking.cleaner_earnings || 0;
          const currentEarnings = earningsMap.get(booking.cleaner_id) || 0;
          earningsMap.set(booking.cleaner_id, currentEarnings + earnings);
          
          // Count bookings
          const currentCount = bookingCountMap.get(booking.cleaner_id) || 0;
          bookingCountMap.set(booking.cleaner_id, currentCount + 1);
        }
      });
    }
    
    // Process team bookings (deep cleaning, move in/out)
    // Each cleaner on a team gets their individual earnings from booking_team_members
    if (teamBookings && teamBookings.length > 0) {
      teamBookings.forEach((teamMember: any) => {
        if (teamMember.cleaner_id && 
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(teamMember.cleaner_id)) {
          // Each team member gets their earnings (typically R250 = 25000 cents) for team bookings
          const earnings = teamMember.earnings || 0;
          const currentEarnings = earningsMap.get(teamMember.cleaner_id) || 0;
          earningsMap.set(teamMember.cleaner_id, currentEarnings + earnings);
          
          // Count team bookings (each team booking counts as 1 for each team member)
          const currentCount = bookingCountMap.get(teamMember.cleaner_id) || 0;
          bookingCountMap.set(teamMember.cleaner_id, currentCount + 1);
        }
      });
    }
    
    // Attach monthly earnings and booking counts to cleaners
    const cleanersWithEarnings = (cleaners || []).map((cleaner: any) => {
      const earnings = earningsMap.get(cleaner.id) || 0;
      const count = bookingCountMap.get(cleaner.id) || 0;
      return {
        ...cleaner,
        monthly_earnings: earnings,
        completed_bookings_count: count,
      };
    });
    
    // Log summary statistics
    const cleanersWithEarningsCount = cleanersWithEarnings.filter(c => c.monthly_earnings > 0).length;
    const totalEarnings = cleanersWithEarnings.reduce((sum, c) => sum + (c.monthly_earnings || 0), 0);
    console.log(`✅ Fetched ${cleanersWithEarnings.length} cleaners`);
    console.log(`💰 ${cleanersWithEarningsCount} cleaners have earnings this month (${firstDayISO} to ${firstDayNextMonthISO})`);
    console.log(`💰 Total monthly earnings: R${(totalEarnings / 100).toFixed(2)}`);
    
    return NextResponse.json({
      ok: true,
      cleaners: cleanersWithEarnings,
    });
    
  } catch (error) {
    console.error('=== ADMIN CLEANERS GET ERROR ===', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch cleaners' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  console.log('=== ADMIN CLEANERS POST ===');
  
  try {
    // Check admin access
    if (!await isAdmin()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }
    
    const body = await req.json();
    console.log('📥 Received body:', body);
    
    const supabase = await createClient();
    
    const { data: cleaner, error } = await supabase
      .from('cleaners')
      .insert([body])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Database error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      throw error;
    }
    
    console.log('✅ Cleaner created:', cleaner.id);
    
    return NextResponse.json({
      ok: true,
      cleaner,
    });
    
  } catch (error: any) {
    console.error('=== ADMIN CLEANERS POST ERROR ===', error);
    const errorMessage = error?.message || 'Failed to create cleaner';
    const errorDetails = error?.details || '';
    const fullError = errorDetails ? `${errorMessage}: ${errorDetails}` : errorMessage;
    
    return NextResponse.json(
      { ok: false, error: fullError },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  console.log('=== ADMIN CLEANERS PUT ===');
  
  try {
    // Check admin access
    if (!await isAdmin()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }
    
    const body = await req.json();
    const { id, ...updates } = body;
    
    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'Cleaner ID required' },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    
    const { data: cleaner, error } = await supabase
      .from('cleaners')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    console.log('✅ Cleaner updated:', id);
    
    return NextResponse.json({
      ok: true,
      cleaner,
    });
    
  } catch (error) {
    console.error('=== ADMIN CLEANERS PUT ERROR ===', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update cleaner';
    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  console.log('=== ADMIN CLEANERS DELETE ===');
  
  try {
    // Check admin access
    if (!await isAdmin()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }
    
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'Cleaner ID required' },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('cleaners')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    console.log('✅ Cleaner deleted:', id);
    
    return NextResponse.json({
      ok: true,
      message: 'Cleaner deleted successfully',
    });
    
  } catch (error) {
    console.error('=== ADMIN CLEANERS DELETE ERROR ===', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to delete cleaner' },
      { status: 500 }
    );
  }
}

