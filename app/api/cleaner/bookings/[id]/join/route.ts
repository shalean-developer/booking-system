import { NextRequest, NextResponse } from 'next/server';
import { getCleanerSession } from '@/lib/cleaner-auth';
import { createServiceClient } from '@/lib/supabase-server';
import { cleanerHasOverlappingBooking } from '@/lib/cleaner/schedule-conflicts';
import { teamSizeFromBooking } from '@/lib/cleaner/earnings-rates';

function bookingHasRecordedPayment(booking: {
  payment_reference?: string | null;
  paystack_ref?: string | null;
}): boolean {
  const pr = (booking.payment_reference ?? '').trim();
  const pf = (booking.paystack_ref ?? '').trim();
  return pr.length > 0 || pf.length > 0;
}

function areaMatches(
  areas: string[] | null | undefined,
  suburb: string | null | undefined,
  city: string | null | undefined
): boolean {
  const list = areas ?? [];
  if (list.length === 0) return true;
  const sub = (suburb ?? '').toLowerCase();
  const cit = (city ?? '').toLowerCase();
  return list.some((a) => {
    const al = a.toLowerCase();
    return (sub && sub.includes(al)) || (cit && cit.includes(al)) || al.includes(sub) || al.includes(cit);
  });
}

/**
 * Join a multi-cleaner job: inserts into booking_team_members until team_size is reached.
 * First joiner becomes primary `cleaner_id` when it was null (same as single claim).
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCleanerSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id: bookingId } = await params;
    const cleanerId = session.id;
    const svc = createServiceClient();

    const { data: booking, error: bookErr } = await svc
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .maybeSingle();

    if (bookErr || !booking) {
      return NextResponse.json({ ok: false, error: 'Booking not found' }, { status: 404 });
    }

    const b = booking as Record<string, unknown>;

    if (!b.requires_team) {
      return NextResponse.json(
        { ok: false, error: 'This job is not a team job — use Claim instead.' },
        { status: 400 }
      );
    }

    if (!bookingHasRecordedPayment(booking as { payment_reference?: string; paystack_ref?: string })) {
      return NextResponse.json({ ok: false, error: 'Payment is required before joining' }, { status: 409 });
    }

    const status = String(b.status ?? '');
    if (!['pending', 'paid', 'assigned'].includes(status)) {
      return NextResponse.json({ ok: false, error: 'Job is not open for assignment' }, { status: 409 });
    }

    const { data: cleanerRow } = await svc.from('cleaners').select('areas').eq('id', cleanerId).maybeSingle();
    const areas = (cleanerRow as { areas?: string[] } | null)?.areas;
    if (
      !areaMatches(
        areas,
        b.address_suburb as string | undefined,
        b.address_city as string | undefined
      )
    ) {
      return NextResponse.json(
        { ok: false, error: 'This job is outside your service areas' },
        { status: 403 }
      );
    }

    const teamSize = teamSizeFromBooking(
      booking as { team_size?: number | null; price_snapshot?: unknown }
    );
    const durationMinutes = Math.max(
      30,
      typeof b.duration_minutes === 'number' ? b.duration_minutes : 180
    );

    const overlap = await cleanerHasOverlappingBooking(svc, cleanerId, {
      booking_date: String(b.booking_date ?? '').slice(0, 10),
      booking_time: String(b.booking_time ?? '09:00').slice(0, 8),
      duration_minutes: durationMinutes,
      excludeBookingId: bookingId,
    });
    if (overlap) {
      return NextResponse.json(
        { ok: false, error: 'You already have another job overlapping this time' },
        { status: 409 }
      );
    }

    let { data: team } = await svc
      .from('booking_teams')
      .select('id')
      .eq('booking_id', bookingId)
      .maybeSingle();

    if (!team) {
      const ins = await svc
        .from('booking_teams')
        .insert({
          booking_id: bookingId,
          team_name: 'Team A',
          supervisor_id: null,
        })
        .select('id')
        .single();
      if (ins.error || !ins.data) {
        console.error('[join] create team', ins.error);
        return NextResponse.json({ ok: false, error: 'Could not create team slot' }, { status: 500 });
      }
      team = ins.data as { id: string };
    }

    const teamId = (team as { id: string }).id;

    const { data: members } = await svc
      .from('booking_team_members')
      .select('cleaner_id')
      .eq('booking_team_id', teamId);

    const memberIds = new Set((members ?? []).map((m) => (m as { cleaner_id: string }).cleaner_id));
    if (memberIds.has(cleanerId)) {
      return NextResponse.json({ ok: false, error: 'You are already on this job' }, { status: 409 });
    }

    if (memberIds.size >= teamSize) {
      return NextResponse.json({ ok: false, error: 'This team is already full' }, { status: 409 });
    }

    const addMember = await svc.from('booking_team_members').insert({
      booking_team_id: teamId,
      cleaner_id: cleanerId,
    });

    if (addMember.error) {
      console.error('[join] member', addMember.error);
      return NextResponse.json(
        { ok: false, error: 'Could not join — try again' },
        { status: 500 }
      );
    }

    if (!b.cleaner_id) {
      await svc
        .from('bookings')
        .update({
          cleaner_id: cleanerId,
          cleaner_claimed_at: new Date().toISOString(),
          tracking_status: 'assigned',
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId);
    } else {
      await svc
        .from('bookings')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', bookingId);
    }

    return NextResponse.json({
      ok: true,
      message: 'Joined team successfully',
      team_size: teamSize,
      members: memberIds.size + 1,
    });
  } catch (e) {
    console.error('[cleaner/join]', e);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}
