import { NextResponse } from 'next/server';
import { createClient, createServiceClient, isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/** Bookings where money is considered collected (for revenue totals). */
const PAID_OR_DONE_FILTER =
  'payment_status.eq.success,status.eq.paid,status.eq.completed';

export async function GET() {
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });
    }

    let supabase;
    try {
      supabase = createServiceClient();
    } catch {
      supabase = await createClient();
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const sumTotal = (rows: { total_amount: unknown }[] | null) =>
      (rows || []).reduce((acc, row) => acc + (Number(row.total_amount) || 0), 0);

    const { data: totalRows, error: totalError } = await supabase
      .from('bookings')
      .select('total_amount')
      .or(PAID_OR_DONE_FILTER)
      .not('payment_status', 'eq', 'refunded');

    if (totalError) {
      console.error('Error fetching total revenue:', totalError);
    }

    const { data: monthRows, error: monthError } = await supabase
      .from('bookings')
      .select('total_amount')
      .or(PAID_OR_DONE_FILTER)
      .not('payment_status', 'eq', 'refunded')
      .gte('created_at', startOfMonth.toISOString())
      .lt('created_at', startOfNextMonth.toISOString());

    if (monthError) {
      console.error('Error fetching month revenue:', monthError);
    }

    const { data: prevRows, error: prevError } = await supabase
      .from('bookings')
      .select('total_amount')
      .or(PAID_OR_DONE_FILTER)
      .not('payment_status', 'eq', 'refunded')
      .gte('created_at', startOfPrevMonth.toISOString())
      .lt('created_at', startOfMonth.toISOString());

    if (prevError) {
      console.error('Error fetching previous month revenue:', prevError);
    }

    const totalRevenue = sumTotal(totalRows);
    const monthRevenue = sumTotal(monthRows);
    const prevRevenue = sumTotal(prevRows);

    const monthGrowth =
      prevRevenue > 0 ? ((monthRevenue - prevRevenue) / prevRevenue) * 100 : 0;

    const refPresent = 'payment_reference.not.is.null,paystack_ref.not.is.null';

    const { count: pendingCount } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .or(refPresent)
      .in('status', ['pending', 'confirmed', 'reschedule_requested', 'accepted']);

    const { count: failedCount } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'cancelled')
      .or(refPresent);

    return NextResponse.json({
      ok: true,
      stats: {
        totalRevenue,
        monthRevenue,
        monthGrowth,
        pendingCount: pendingCount || 0,
        failedCount: failedCount || 0,
      },
    });
  } catch (error: unknown) {
    console.error('Error in payments stats API:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
