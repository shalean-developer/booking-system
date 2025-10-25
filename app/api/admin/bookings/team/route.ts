import { NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * Admin Team Info API
 * GET: Fetch team information for a booking
 */
export async function GET(req: Request) {
  console.log('=== ADMIN TEAM INFO GET ===');
  
  try {
    // Check admin access
    if (!await isAdmin()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }
    
    const url = new URL(req.url);
    const bookingId = url.searchParams.get('bookingId');
    
    if (!bookingId) {
      return NextResponse.json(
        { ok: false, error: 'Booking ID parameter required' },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    
    // Fetch team information
    const { data: team, error: teamError } = await supabase
      .from('booking_teams')
      .select(`
        id,
        team_name,
        supervisor_id,
        cleaners!booking_team_members(
          cleaner_id,
          earnings,
          cleaners!inner(
            id,
            name
          )
        )
      `)
      .eq('booking_id', bookingId)
      .single();
    
    if (teamError) {
      if (teamError.code === 'PGRST116') {
        // No team found
        return NextResponse.json({
          ok: true,
          team: null,
          message: 'No team assigned yet'
        });
      }
      throw teamError;
    }

    // Find supervisor name
    let supervisorName = 'Not assigned';
    if (team.supervisor_id) {
      const supervisor = team.cleaners.find((member: any) => 
        member.cleaners.id === team.supervisor_id
      );
      if (supervisor) {
        supervisorName = supervisor.cleaners.name;
      }
    }

    // Format team members
    const members = team.cleaners.map((member: any) => ({
      name: member.cleaners.name,
      earnings: member.earnings,
      isSupervisor: member.cleaner_id === team.supervisor_id
    }));

    const teamInfo = {
      teamName: team.team_name,
      supervisor: supervisorName,
      members,
      totalEarnings: members.reduce((sum: number, member: any) => sum + member.earnings, 0)
    };

    console.log(`✅ Team info fetched for booking ${bookingId}:`, teamInfo);
    
    return NextResponse.json({
      ok: true,
      team: teamInfo
    });
    
  } catch (error) {
    console.error('=== ADMIN TEAM INFO ERROR ===', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch team info';
    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500 }
    );
  }
}
