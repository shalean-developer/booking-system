import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase-server';
import { isAdmin } from '@/lib/supabase-server';
import { sendCleanerNotification } from '@/lib/notifications/sendCleanerNotification';
import { calculateTeamEarnings, splitCentsEvenly } from '@/lib/earnings-v2';

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

      if (!body.team_name || !['Team A', 'Team B', 'Team C'].includes(body.team_name)) {
        return NextResponse.json(
          { ok: false, error: 'Valid team name (Team A, Team B, or Team C) is required' },
          { status: 400 }
        );
      }

      // Create or update team record
      const { data: existingTeam } = await supabase
        .from('booking_teams')
        .select('id')
        .eq('booking_id', id)
        .maybeSingle();

      let teamId: string;
      
      if (existingTeam) {
        // Update existing team
        await supabase
          .from('booking_teams')
          .update({
            team_name: body.team_name,
            supervisor_id: body.supervisor_id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingTeam.id);
        teamId = existingTeam.id;
      } else {
        // Create new team
        const { data: newTeam, error: insertError } = await supabase
          .from('booking_teams')
          .insert({
            booking_id: id,
            team_name: body.team_name,
            supervisor_id: body.supervisor_id,
          })
          .select('id')
          .single();
        
        if (insertError || !newTeam) {
          return NextResponse.json(
            { ok: false, error: 'Failed to create team record' },
            { status: 500 }
          );
        }
        teamId = newTeam.id;
      }

      // Delete existing team members for this team
      await supabase
        .from('booking_team_members')
        .delete()
        .eq('booking_team_id', teamId);

      const { data: bookingRow } = await supabase
        .from('bookings')
        .select(
          'total_amount, tip_amount, service_fee, service_type, earnings_status, earnings_final, earnings_calculated, cleaner_earnings, total_hours, equipment_cost, extra_cleaner_fee'
        )
        .eq('id', id)
        .maybeSingle();

      const n = body.cleaner_ids.length;
      let perMemberShares: number[];
      if (
        bookingRow?.earnings_status === 'approved' &&
        bookingRow.earnings_final != null
      ) {
        perMemberShares = splitCentsEvenly(bookingRow.earnings_final, n);
      } else {
        const timeContext =
          bookingRow?.total_hours != null && bookingRow.total_hours > 0
            ? { totalHours: bookingRow.total_hours }
            : null;
        const teamCalc = calculateTeamEarnings({
          totalAmountCents: bookingRow?.total_amount ?? 0,
          serviceFeeCents: bookingRow?.service_fee ?? 0,
          tipCents: bookingRow?.tip_amount ?? 0,
          teamSize: n,
          serviceType: bookingRow?.service_type ?? null,
          equipmentCostCents: bookingRow?.equipment_cost ?? 0,
          extraCleanerFeeCents: bookingRow?.extra_cleaner_fee ?? 0,
          timeContext,
        });
        perMemberShares = splitCentsEvenly(teamCalc.totalCleanerPayoutCents, n);
        if (bookingRow?.earnings_status === 'pending') {
          const svc = createServiceClient();
          const th = bookingRow.total_hours;
          await svc
            .from('bookings')
            .update({
              earnings_calculated: teamCalc.totalCleanerPayoutCents,
              cleaner_earnings: teamCalc.totalCleanerPayoutCents,
              ...(th != null && th > 0
                ? {
                    team_size: n,
                    hours_per_cleaner: Math.max(1, Math.round(th / n)),
                  }
                : {}),
            })
            .eq('id', id);
        }
      }

      const teamMembers = body.cleaner_ids.map((cleanerId: string, i: number) => ({
        booking_team_id: teamId,
        cleaner_id: cleanerId,
        earnings: perMemberShares[i] ?? 25_000,
      }));

      const { error: membersError } = await supabase
        .from('booking_team_members')
        .insert(teamMembers);

      if (membersError) {
        console.error('Error inserting team members:', membersError);
        return NextResponse.json(
          { ok: false, error: 'Failed to assign team members' },
          { status: 500 }
        );
      }

      // Set cleaner_id to null for team bookings
      await supabase
        .from('bookings')
        .update({ cleaner_id: null })
        .eq('id', id);
    } else if (body.cleaner_id) {
      // Single cleaner assignment — live job list uses status "assigned" + assigned_cleaner_id
      const { error: assignErr } = await supabase
        .from('bookings')
        .update({
          cleaner_id: body.cleaner_id,
          assigned_cleaner_id: body.cleaner_id,
          status: 'assigned',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (!assignErr) {
        try {
          const [{ data: fullBooking }, { data: cleanerRow }] = await Promise.all([
            supabase.from('bookings').select('*').eq('id', id).maybeSingle(),
            supabase.from('cleaners').select('id, name, phone').eq('id', body.cleaner_id).maybeSingle(),
          ]);
          if (fullBooking && cleanerRow) {
            await sendCleanerNotification({
              type: 'assigned',
              cleaner: cleanerRow,
              booking: fullBooking,
            });
          }
        } catch (e) {
          console.warn('[assign] cleaner notification failed', e);
        }
      }
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

