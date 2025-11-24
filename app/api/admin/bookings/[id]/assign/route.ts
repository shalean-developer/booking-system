import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const supabase = await createClient();

    // Fetch booking to check if it requires team
    const { data: booking } = await supabase
      .from('bookings')
      .select('service_type, requires_team')
      .eq('id', id)
      .single();

    if (!booking) {
      return NextResponse.json(
        { ok: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    const requiresTeam = booking.requires_team || booking.service_type === 'Deep' || booking.service_type === 'Move In/Out';

    if (requiresTeam && body.cleaner_ids && body.cleaner_ids.length > 0) {
      // Team assignment
      if (!body.supervisor_id) {
        return NextResponse.json(
          { ok: false, error: 'Supervisor ID is required for team bookings' },
          { status: 400 }
        );
      }

      // Create or update team record
      const { data: existingTeam } = await supabase
        .from('booking_teams')
        .select('id')
        .eq('booking_id', id)
        .maybeSingle();

      if (existingTeam) {
        await supabase
          .from('booking_teams')
          .update({
            supervisor_id: body.supervisor_id,
          })
          .eq('id', existingTeam.id);
      } else {
        await supabase
          .from('booking_teams')
          .insert({
            booking_id: id,
            team_name: `Team ${id.slice(-3)}`,
            supervisor_id: body.supervisor_id,
          });
      }

      // Delete existing team members
      await supabase
        .from('booking_team_members')
        .delete()
        .eq('booking_id', id);

      // Insert new team members
      const teamMembers = body.cleaner_ids.map((cleanerId: string) => ({
        booking_id: id,
        cleaner_id: cleanerId,
        is_supervisor: cleanerId === body.supervisor_id,
      }));

      await supabase.from('booking_team_members').insert(teamMembers);

      // Set cleaner_id to null for team bookings
      await supabase
        .from('bookings')
        .update({ cleaner_id: null })
        .eq('id', id);
    } else if (body.cleaner_id) {
      // Single cleaner assignment
      await supabase
        .from('bookings')
        .update({
          cleaner_id: body.cleaner_id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
    }

    return NextResponse.json({
      ok: true,
      message: 'Cleaner assigned successfully',
    });
  } catch (error) {
    console.error('Error assigning cleaner:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

