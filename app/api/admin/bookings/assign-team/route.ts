import { NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * Admin Team Assignment API
 * POST: Assign multiple cleaners to a team for a booking
 */
export async function POST(req: Request) {
  console.log('=== ADMIN TEAM ASSIGNMENT POST ===');
  
  try {
    // Check admin access
    if (!await isAdmin()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }
    
    const body = await req.json();
    const { bookingId, teamName, supervisorId, cleanerIds } = body;
    
    if (!bookingId || !teamName || !supervisorId || !cleanerIds || !Array.isArray(cleanerIds)) {
      return NextResponse.json(
        { ok: false, error: 'Missing required fields: bookingId, teamName, supervisorId, cleanerIds' },
        { status: 400 }
      );
    }

    if (cleanerIds.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'At least one cleaner must be selected' },
        { status: 400 }
      );
    }

    if (!cleanerIds.includes(supervisorId)) {
      return NextResponse.json(
        { ok: false, error: 'Supervisor must be included in team members' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    // Verify booking exists and requires team
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, requires_team, service_type, total_amount, service_fee')
      .eq('id', bookingId)
      .single();
    
    if (bookingError || !booking) {
      return NextResponse.json(
        { ok: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if booking requires team (by flag or service type)
    const requiresTeam = booking.requires_team === true || 
                        booking.service_type === 'Deep' || 
                        booking.service_type === 'Move In/Out';
    
    if (!requiresTeam) {
      return NextResponse.json(
        { ok: false, error: 'This booking does not require team assignment' },
        { status: 400 }
      );
    }

    // Update booking to set requires_team flag if not already set
    if (!booking.requires_team && (booking.service_type === 'Deep' || booking.service_type === 'Move In/Out')) {
      const { error: updateRequiresTeamError } = await supabase
        .from('bookings')
        .update({ requires_team: true })
        .eq('id', bookingId);
      
      if (updateRequiresTeamError) {
        console.warn('Failed to update requires_team flag:', updateRequiresTeamError);
        // Continue anyway - team assignment will still work
      }
    }

    // Verify all cleaners exist and are active
    const { data: cleaners, error: cleanersError } = await supabase
      .from('cleaners')
      .select('id, name, is_active')
      .in('id', cleanerIds);
    
    if (cleanersError) throw cleanersError;
    
    if (cleaners.length !== cleanerIds.length) {
      return NextResponse.json(
        { ok: false, error: 'One or more cleaners not found' },
        { status: 400 }
      );
    }

    const inactiveCleaners = cleaners.filter(c => !c.is_active);
    if (inactiveCleaners.length > 0) {
      return NextResponse.json(
        { ok: false, error: `Inactive cleaners selected: ${inactiveCleaners.map(c => c.name).join(', ')}` },
        { status: 400 }
      );
    }

    // Check for existing team assignment
    const { data: existingTeam, error: teamCheckError } = await supabase
      .from('booking_teams')
      .select('id')
      .eq('booking_id', bookingId)
      .single();
    
    if (teamCheckError && teamCheckError.code !== 'PGRST116') {
      throw teamCheckError;
    }

    // Start transaction-like operations
    let teamId: string;
    
    if (existingTeam) {
      // Update existing team
      const { data: updatedTeam, error: updateTeamError } = await supabase
        .from('booking_teams')
        .update({
          team_name: teamName,
          supervisor_id: supervisorId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingTeam.id)
        .select()
        .single();
      
      if (updateTeamError) throw updateTeamError;
      teamId = updatedTeam.id;

      // Delete existing team members
      const { error: deleteMembersError } = await supabase
        .from('booking_team_members')
        .delete()
        .eq('booking_team_id', teamId);
      
      if (deleteMembersError) throw deleteMembersError;
    } else {
      // Create new team
      const { data: newTeam, error: createTeamError } = await supabase
        .from('booking_teams')
        .insert({
          booking_id: bookingId,
          team_name: teamName,
          supervisor_id: supervisorId,
        })
        .select()
        .single();
      
      if (createTeamError) throw createTeamError;
      teamId = newTeam.id;
    }

    // Create team members with fixed R250 earnings per cleaner
    const teamMembers = cleanerIds.map(cleanerId => ({
      booking_team_id: teamId,
      cleaner_id: cleanerId,
      earnings: 25000, // R250 in cents
    }));

    const { data: teamMembersData, error: membersError } = await supabase
      .from('booking_team_members')
      .insert(teamMembers)
      .select();
    
    if (membersError) throw membersError;

    // Calculate total team earnings
    const totalTeamEarnings = cleanerIds.length * 25000; // R250 per cleaner

    // Update booking with team earnings
    const { error: updateBookingError } = await supabase
      .from('bookings')
      .update({
        requires_team: true, // Ensure requires_team is set
        cleaner_earnings: totalTeamEarnings,
        status: 'confirmed', // Mark as confirmed when team is assigned
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);
    
    if (updateBookingError) throw updateBookingError;

    console.log(`✅ Team assigned successfully: ${teamName} with ${cleanerIds.length} members`);
    console.log(`Total team earnings: R${(totalTeamEarnings / 100).toFixed(2)}`);

    return NextResponse.json({
      ok: true,
      teamId,
      teamName,
      supervisorId,
      memberCount: cleanerIds.length,
      totalEarnings: totalTeamEarnings,
      message: `Team ${teamName} assigned with ${cleanerIds.length} cleaners`,
    });
    
  } catch (error) {
    console.error('=== ADMIN TEAM ASSIGNMENT ERROR ===', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to assign team';
    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500 }
    );
  }
}
