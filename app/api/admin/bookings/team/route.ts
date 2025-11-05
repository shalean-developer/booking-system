import { NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

interface TeamMember {
  cleaner_id: string;
  earnings: number;
  cleaners: {
    id: string;
    name: string;
  };
}

interface TeamData {
  id: string;
  team_name: string;
  supervisor_id: string;
  cleaners: TeamMember[];
}

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
    
    // First, check if team exists
    const { data: teamCheck, error: teamCheckError } = await supabase
      .from('booking_teams')
      .select('id, team_name, supervisor_id')
      .eq('booking_id', bookingId)
      .single();
    
    if (teamCheckError) {
      if (teamCheckError.code === 'PGRST116') {
        // No team found
        return NextResponse.json({
          ok: true,
          team: null,
          message: 'No team assigned yet'
        });
      }
      throw teamCheckError;
    }

    if (!teamCheck) {
      return NextResponse.json({
        ok: true,
        team: null,
        message: 'No team assigned yet'
      });
    }

    // Now fetch team members separately
    const { data: teamMembers, error: membersError } = await supabase
      .from('booking_team_members')
      .select(`
        cleaner_id,
        earnings,
        cleaners (
          id,
          name
        )
      `)
      .eq('booking_team_id', teamCheck.id);

    if (membersError) {
      console.error('Error fetching team members:', membersError);
      throw membersError;
    }

    // Format the team members data
    const formattedMembers = (teamMembers || []).map((member: any) => ({
      cleaner_id: member.cleaner_id,
      earnings: member.earnings || 25000,
      cleaners: member.cleaners ? {
        id: member.cleaners.id,
        name: member.cleaners.name
      } : null
    }));

    console.log(`Found team: ${teamCheck.team_name} with ${formattedMembers.length} members`);

    // Find supervisor name
    let supervisorName = 'Not assigned';
    if (teamCheck.supervisor_id && formattedMembers.length > 0) {
      const supervisor = formattedMembers.find((member: any) => 
        member.cleaner_id === teamCheck.supervisor_id
      );
      if (supervisor && supervisor.cleaners) {
        supervisorName = supervisor.cleaners.name;
      }
    }

    // Format team members
    const members = formattedMembers.map((member: any) => ({
      cleanerId: member.cleaner_id,
      name: member.cleaners?.name || 'Unknown',
      earnings: member.earnings || 25000,
      isSupervisor: member.cleaner_id === teamCheck.supervisor_id
    }));

    console.log(`Formatted ${members.length} team members`);

    const teamInfo = {
      teamName: teamCheck.team_name,
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
