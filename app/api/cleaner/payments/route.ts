import { NextRequest, NextResponse } from 'next/server';
import { getCleanerSession, createCleanerSupabaseClient, cleanerIdToUuid } from '@/lib/cleaner-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getCleanerSession();
    if (!session) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = await createCleanerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const cleanerId = cleanerIdToUuid(session.id);
    
    // Get date range filters (optional)
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '50');

    // 1. Fetch individual (non-team) bookings with earnings
    let individualQuery = supabase
      .from('bookings')
      .select(`
        id,
        tip_amount,
        service_fee,
        booking_date,
        booking_time,
        service_type,
        total_amount,
        cleaner_earnings,
        status,
        customer_name,
        address_line1,
        address_suburb,
        address_city,
        created_at
      `)
      .eq('cleaner_id', cleanerId)
      .eq('status', 'completed')
      .not('cleaner_earnings', 'is', null);

    // Apply date filters if provided
    if (startDate) {
      individualQuery = individualQuery.gte('booking_date', startDate);
    }
    if (endDate) {
      individualQuery = individualQuery.lte('booking_date', endDate);
    }

    const { data: individualBookings, error: individualError } = await individualQuery
      .order('booking_date', { ascending: false })
      .order('booking_time', { ascending: false });

    if (individualError) {
      console.error('Error fetching individual bookings:', individualError);
    }

    // 2. Fetch team bookings where cleaner is a member
    let teamBookings: any[] = [];
    
    try {
      // Get team memberships for this cleaner
      const { data: memberships, error: membershipsError } = await supabase
        .from('booking_team_members')
        .select('booking_team_id, earnings')
        .eq('cleaner_id', cleanerId);

      if (!membershipsError && memberships && memberships.length > 0) {
        // Get the team IDs
        const teamIds = memberships.map(m => m.booking_team_id);
        
        // Fetch team details
        const { data: teams, error: teamsError } = await supabase
          .from('booking_teams')
          .select('id, booking_id, team_name, supervisor_id')
          .in('id', teamIds);

        if (!teamsError && teams && teams.length > 0) {
          // Get booking IDs
          const bookingIds = teams.map(t => t.booking_id);
          
          // Fetch completed bookings for these team bookings
          let teamBookingsQuery = supabase
            .from('bookings')
            .select(`
              id,
              tip_amount,
              service_fee,
              booking_date,
              booking_time,
              service_type,
              total_amount,
              cleaner_earnings,
              status,
              customer_name,
              address_line1,
              address_suburb,
              address_city,
              created_at
            `)
            .in('id', bookingIds)
            .eq('status', 'completed');

          // Apply date filters if provided
          if (startDate) {
            teamBookingsQuery = teamBookingsQuery.gte('booking_date', startDate);
          }
          if (endDate) {
            teamBookingsQuery = teamBookingsQuery.lte('booking_date', endDate);
          }

          const { data: bookingsData, error: bookingsError } = await teamBookingsQuery
            .order('booking_date', { ascending: false })
            .order('booking_time', { ascending: false });

          if (!bookingsError && bookingsData) {
            // Combine the data - use earnings from booking_team_members
            teamBookings = bookingsData.map(booking => {
              const team = teams.find(t => t.booking_id === booking.id);
              const membership = memberships.find(m => m.booking_team_id === team?.id);
              
              return {
                ...booking,
                cleaner_earnings: membership?.earnings || 0, // Use team member earnings (R250)
                is_team_booking: true,
                team_name: team?.team_name,
                team_role: team?.supervisor_id === cleanerId ? 'supervisor' : 'member',
              };
            });
          }
        }
      }
    } catch (err) {
      console.log('Error fetching team bookings:', err);
    }

    // 3. Merge individual and team bookings
    const allBookings = [
      ...(individualBookings || []).map(b => ({ ...b, is_team_booking: false })),
      ...teamBookings
    ];

    // 4. Sort and limit
    allBookings.sort((a, b) => {
      const dateCompare = a.booking_date.localeCompare(b.booking_date);
      if (dateCompare !== 0) return -dateCompare; // Descending
      return b.booking_time.localeCompare(a.booking_time); // Descending
    });

    const bookings = allBookings.slice(0, limit);

    // Error handling is done above for individual bookings
    // Team bookings errors are logged but don't fail the request

    // Calculate totals
    const transactions = (bookings || []).map((b: any) => {
      const tip = b.tip_amount || 0;
      const cleanerEarnings = b.cleaner_earnings || 0;
      const commissionEarnings = Math.max(cleanerEarnings - tip, 0);

      return {
        ...b,
        tip_amount: tip,
        commission_earnings: commissionEarnings,
        // Remove total_amount, service_fee, and service_subtotal from response
        total_amount: undefined,
        service_fee: undefined,
        service_subtotal: undefined,
      };
    });

    const totalEarnings = transactions.reduce((sum, t) => sum + (t.cleaner_earnings || 0), 0);

    const totalBookings = transactions.length;

    // Calculate monthly totals (current month)
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const monthlyBookings = transactions.filter(
      (b) => b.booking_date >= firstDayOfMonth
    );
    const monthlyEarnings = monthlyBookings.reduce((sum, b) => sum + (b.cleaner_earnings || 0), 0);

    // Tip/commission breakdowns
    const totalTip = transactions.reduce((sum, t) => sum + (t.tip_amount || 0), 0);
    const totalCommission = transactions.reduce((sum, t) => sum + (t.commission_earnings || 0), 0);

    const monthlyTip = monthlyBookings.reduce((sum, t) => sum + (t.tip_amount || 0), 0);
    const monthlyCommission = monthlyBookings.reduce((sum, t) => sum + (t.commission_earnings || 0), 0);

    return NextResponse.json({
      ok: true,
      transactions,
      summary: {
        total_earnings: totalEarnings,
        total_tip: totalTip,
        total_commission: totalCommission,
        total_bookings: totalBookings,
        monthly_earnings: monthlyEarnings,
        monthly_tip: monthlyTip,
        monthly_commission: monthlyCommission,
        monthly_bookings: monthlyBookings.length,
      },
    });
  } catch (error) {
    console.error('Error in payments route:', error);
    return NextResponse.json(
      { ok: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
}

