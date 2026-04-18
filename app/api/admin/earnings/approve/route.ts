import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, getServerAuthUser, isAdmin } from '@/lib/supabase-server';
import { splitCentsEvenly } from '@/lib/earnings-v2';
import { releasePendingWalletAfterEarningsApproval } from '@/lib/wallet';

export const dynamic = 'force-dynamic';

/**
 * Approve booking earnings (or set adjusted total payout in cents).
 * Does not recalculate from pricing — uses earnings_calculated unless adjusted_amount_cents is provided.
 */
export async function POST(request: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const bookingId = body.booking_id as string | undefined;
    const adjustedRaw = body.adjusted_amount_cents;

    if (!bookingId) {
      return NextResponse.json({ ok: false, error: 'booking_id is required' }, { status: 400 });
    }

    const svc = createServiceClient();
    const { data: booking, error: fetchError } = await svc
      .from('bookings')
      .select(
        'id, total_amount, earnings_status, earnings_final, earnings_calculated, cleaner_earnings'
      )
      .eq('id', bookingId)
      .maybeSingle();

    if (fetchError || !booking) {
      return NextResponse.json({ ok: false, error: 'Booking not found' }, { status: 404 });
    }

    if (booking.earnings_status === 'approved' && booking.earnings_final != null) {
      return NextResponse.json(
        { ok: false, error: 'Earnings already approved; amounts are locked' },
        { status: 400 }
      );
    }

    const adjusted =
      adjustedRaw !== undefined && adjustedRaw !== null && Number.isFinite(Number(adjustedRaw))
        ? Math.round(Number(adjustedRaw))
        : booking.earnings_calculated;

    if (adjusted === null || adjusted === undefined || adjusted < 0 || !Number.isFinite(adjusted)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid or missing earnings amount' },
        { status: 400 }
      );
    }

    const authUser = await getServerAuthUser();
    const reviewedAt = new Date().toISOString();

    const totalAmount = booking.total_amount ?? 0;
    const companyProfitCents = Math.max(0, Math.round(totalAmount - adjusted));

    const { error: updateError } = await svc
      .from('bookings')
      .update({
        earnings_status: 'approved',
        earnings_final: adjusted,
        cleaner_earnings: adjusted,
        earnings_reviewed_by: authUser?.id ?? null,
        earnings_reviewed_at: reviewedAt,
        company_profit_cents: companyProfitCents,
      })
      .eq('id', bookingId);

    if (updateError) {
      console.error('[admin/earnings/approve]', updateError);
      return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
    }

    const { data: team } = await svc.from('booking_teams').select('id').eq('booking_id', bookingId).maybeSingle();

    if (team?.id) {
      const { data: members } = await svc
        .from('booking_team_members')
        .select('id')
        .eq('booking_team_id', team.id)
        .order('created_at', { ascending: true });

      const n = members?.length ?? 0;
      if (n > 0) {
        const shares = splitCentsEvenly(adjusted, n);
        for (let i = 0; i < n; i++) {
          await svc.from('booking_team_members').update({ earnings: shares[i] }).eq('id', members![i].id);
        }
      }
    }

    const walletRelease = await releasePendingWalletAfterEarningsApproval(svc, bookingId);
    if (!walletRelease.ok) {
      console.warn('[admin/earnings/approve] wallet release:', walletRelease.error);
    }

    return NextResponse.json({
      ok: true,
      booking_id: bookingId,
      earnings_final: adjusted,
      company_profit_cents: companyProfitCents,
    });
  } catch (e) {
    console.error('[admin/earnings/approve]', e);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
