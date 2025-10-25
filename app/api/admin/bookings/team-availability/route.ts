import { NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * Admin Team Availability API
 * GET: Check how many bookings a team has on a specific date
 */
export async function GET(req: Request) {
  console.log('=== ADMIN TEAM AVAILABILITY GET ===');
  
  try {
    // Check admin access
    if (!await isAdmin()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }
    
    const url = new URL(req.url);
    const teamName = url.searchParams.get('teamName');
    const date = url.searchParams.get('date');
    
    if (!teamName || !date) {
      return NextResponse.json(
        { ok: false, error: 'Team name and date parameters required' },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    
    // Count how many bookings this team has on the specified date
    // Join booking_teams with bookings to get the date
    const { data: teamBookings, error: bookingsError } = await supabase
      .from('booking_teams')
      .select(`
        id,
        booking_id,
        bookings!inner(
          booking_date,
          booking_time,
          status,
          customer_name
        )
      `)
      .eq('team_name', teamName)
      .eq('bookings.booking_date', date)
      .in('bookings.status', ['pending', 'confirmed', 'in_progress']);
    
    if (bookingsError) throw bookingsError;

    const bookingCount = teamBookings?.length || 0;
    
    console.log(`✅ ${teamName} has ${bookingCount} booking(s) on ${date}`);
    
    return NextResponse.json({
      ok: true,
      teamName,
      date,
      bookingCount,
      bookings: teamBookings?.map((tb: any) => ({
        bookingId: tb.booking_id,
        time: tb.bookings.booking_time,
        customer: tb.bookings.customer_name,
        status: tb.bookings.status,
      })) || []
    });
    
  } catch (error) {
    console.error('=== ADMIN TEAM AVAILABILITY ERROR ===', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to check team availability';
    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500 }
    );
  }
}

