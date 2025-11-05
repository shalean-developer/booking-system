import { NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * Admin Team Members Management API
 * DELETE: Remove a team member from a booking team
 * POST: Add a team member to a booking team
 */
export async function DELETE(req: Request) {
  console.log('=== ADMIN REMOVE TEAM MEMBER DELETE ===');
  
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
    const cleanerId = url.searchParams.get('cleanerId');
    
    if (!bookingId || !cleanerId) {
      return NextResponse.json(
        { ok: false, error: 'Booking ID and Cleaner ID required' },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    
    // Get the team for this booking
    const { data: team, error: teamError } = await supabase
      .from('booking_teams')
      .select('id, supervisor_id')
      .eq('booking_id', bookingId)
      .single();
    
    if (teamError || !team) {
      return NextResponse.json(
        { ok: false, error: 'Team not found for this booking' },
        { status: 404 }
      );
    }
    
    // Check if trying to remove supervisor
    if (team.supervisor_id === cleanerId) {
      return NextResponse.json(
        { ok: false, error: 'Cannot remove supervisor. Please assign a new supervisor first.' },
        { status: 400 }
      );
    }
    
    // Remove team member
    const { error: deleteError } = await supabase
      .from('booking_team_members')
      .delete()
      .eq('booking_team_id', team.id)
      .eq('cleaner_id', cleanerId);
    
    if (deleteError) throw deleteError;
    
    // Get remaining team members count
    const { data: remainingMembers, error: countError } = await supabase
      .from('booking_team_members')
      .select('id')
      .eq('booking_team_id', team.id);
    
    if (countError) throw countError;
    
    // If no members left, delete the team
    if (!remainingMembers || remainingMembers.length === 0) {
      const { error: deleteTeamError } = await supabase
        .from('booking_teams')
        .delete()
        .eq('id', team.id);
      
      if (deleteTeamError) throw deleteTeamError;
      
      // Update booking to remove team earnings
      await supabase
        .from('bookings')
        .update({ cleaner_earnings: 0 })
        .eq('id', bookingId);
      
      return NextResponse.json({
        ok: true,
        message: 'Team member removed. Team has been dissolved as no members remain.',
        teamDissolved: true,
      });
    }
    
    // Update booking with new team earnings
    const newTeamEarnings = remainingMembers.length * 25000; // R250 per cleaner
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ cleaner_earnings: newTeamEarnings })
      .eq('id', bookingId);
    
    if (updateError) throw updateError;
    
    console.log(`✅ Team member removed from booking ${bookingId}`);
    
    return NextResponse.json({
      ok: true,
      message: 'Team member removed successfully',
      remainingMembers: remainingMembers.length,
      newTeamEarnings: newTeamEarnings,
    });
    
  } catch (error) {
    console.error('=== ADMIN REMOVE TEAM MEMBER ERROR ===', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to remove team member';
    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  console.log('=== ADMIN ADD TEAM MEMBER POST ===');
  
  try {
    // Check admin access
    if (!await isAdmin()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }
    
    const body = await req.json();
    const { bookingId, cleanerId } = body;
    
    if (!bookingId || !cleanerId) {
      return NextResponse.json(
        { ok: false, error: 'Booking ID and Cleaner ID required' },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    
    // Get the team for this booking
    const { data: team, error: teamError } = await supabase
      .from('booking_teams')
      .select('id')
      .eq('booking_id', bookingId)
      .single();
    
    if (teamError || !team) {
      return NextResponse.json(
        { ok: false, error: 'Team not found for this booking' },
        { status: 404 }
      );
    }
    
    // Check if cleaner is already a member
    const { data: existingMember, error: checkError } = await supabase
      .from('booking_team_members')
      .select('id')
      .eq('booking_team_id', team.id)
      .eq('cleaner_id', cleanerId)
      .single();
    
    if (existingMember) {
      return NextResponse.json(
        { ok: false, error: 'Cleaner is already a team member' },
        { status: 400 }
      );
    }
    
    // Verify cleaner exists and is active
    const { data: cleaner, error: cleanerError } = await supabase
      .from('cleaners')
      .select('id, name, is_active')
      .eq('id', cleanerId)
      .single();
    
    if (cleanerError || !cleaner) {
      return NextResponse.json(
        { ok: false, error: 'Cleaner not found' },
        { status: 404 }
      );
    }
    
    if (!cleaner.is_active) {
      return NextResponse.json(
        { ok: false, error: 'Cleaner is not active' },
        { status: 400 }
      );
    }
    
    // Add team member
    const { data: newMember, error: insertError } = await supabase
      .from('booking_team_members')
      .insert({
        booking_team_id: team.id,
        cleaner_id: cleanerId,
        earnings: 25000, // R250 in cents
      })
      .select()
      .single();
    
    if (insertError) throw insertError;
    
    // Get updated team members count
    const { data: allMembers, error: countError } = await supabase
      .from('booking_team_members')
      .select('id')
      .eq('booking_team_id', team.id);
    
    if (countError) throw countError;
    
    // Update booking with new team earnings
    const newTeamEarnings = (allMembers?.length || 0) * 25000; // R250 per cleaner
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ cleaner_earnings: newTeamEarnings })
      .eq('id', bookingId);
    
    if (updateError) throw updateError;
    
    console.log(`✅ Team member added to booking ${bookingId}`);
    
    return NextResponse.json({
      ok: true,
      message: 'Team member added successfully',
      member: {
        id: cleanerId,
        name: cleaner.name,
      },
      totalMembers: allMembers?.length || 0,
      newTeamEarnings: newTeamEarnings,
    });
    
  } catch (error) {
    console.error('=== ADMIN ADD TEAM MEMBER ERROR ===', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to add team member';
    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500 }
    );
  }
}

