import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { getCustomerDashboardStats } from '@/lib/dashboard-data/customer-stats';

/** KPIs are DB counts only — must match dashboard business rules. */
export type DashboardStatsPayload = {
  upcomingCount: number;
  completedCount: number;
  cancelledCount: number;
  activePlans: number;
  rewardPoints: number;
  lastCleaningCompleted: string | null;
  balanceDue: number;
};

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = await createClient();

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !authUser) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, rewards_points')
      .eq('auth_user_id', authUser.id)
      .maybeSingle();

    if (customerError) {
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch customer profile' },
        { status: 500 }
      );
    }

    const emptyStats: DashboardStatsPayload = {
      upcomingCount: 0,
      completedCount: 0,
      cancelledCount: 0,
      activePlans: 0,
      rewardPoints: 0,
      lastCleaningCompleted: null,
      balanceDue: 0,
    };

    if (!customer) {
      return NextResponse.json({ ok: true, stats: emptyStats });
    }

    const rewardPoints = Math.max(0, Math.round(Number(customer.rewards_points) || 0));

    let stats: DashboardStatsPayload;
    try {
      stats = await getCustomerDashboardStats(supabase, customer.id, rewardPoints);
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('dashboard/stats', e);
      }
      return NextResponse.json(
        { ok: false, error: 'Failed to load dashboard stats' },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, stats });
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error in stats route:', error);
    }
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
