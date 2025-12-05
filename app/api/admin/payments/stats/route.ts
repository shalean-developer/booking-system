import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Admin check
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const supabase = await createClient();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Helper to sum total_amount
    const sumTotal = (rows: any[] | null) =>
      (rows || []).reduce((acc, row) => acc + (Number(row.total_amount) || 0), 0);

    // Total revenue (all payments with a payment_reference)
    const { data: totalRows, error: totalError } = await supabase
      .from('bookings')
      .select('total_amount')
      .not('payment_reference', 'is', null);

    if (totalError) {
      console.error('Error fetching total revenue:', totalError);
    }
    const totalRevenue = sumTotal(totalRows);

    // This month revenue
    const { data: monthRows, error: monthError } = await supabase
      .from('bookings')
      .select('total_amount')
      .not('payment_reference', 'is', null)
      .gte('created_at', startOfMonth.toISOString())
      .lt('created_at', startOfNextMonth.toISOString());

    if (monthError) {
      console.error('Error fetching month revenue:', monthError);
    }
    const monthRevenue = sumTotal(monthRows);

    // Previous month revenue (for growth calculation)
    const { data: prevRows, error: prevError } = await supabase
      .from('bookings')
      .select('total_amount')
      .not('payment_reference', 'is', null)
      .gte('created_at', startOfPrevMonth.toISOString())
      .lt('created_at', startOfMonth.toISOString());

    if (prevError) {
      console.error('Error fetching previous month revenue:', prevError);
    }
    const prevRevenue = sumTotal(prevRows);

    const monthGrowth =
      prevRevenue > 0 ? ((monthRevenue - prevRevenue) / prevRevenue) * 100 : 0;

    // Pending count (pending/confirmed/accepted)
    const { count: pendingCount } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .in('status', ['pending', 'confirmed', 'accepted'])
      .not('payment_reference', 'is', null);

    // Failed count (cancelled)
    const { count: failedCount } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'cancelled')
      .not('payment_reference', 'is', null);

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
  } catch (error: any) {
    console.error('Error in payments stats API:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}


