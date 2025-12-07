import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * API endpoint to fetch aggregated dashboard stats (KPIs)
 * Requires authentication
 */
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
    
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !authUser) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // Find customer profile
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('auth_user_id', authUser.id)
      .maybeSingle();

    if (customerError) {
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch customer profile' },
        { status: 500 }
      );
    }

    if (!customer) {
      return NextResponse.json({
        ok: true,
        stats: {
          upcomingAppointments: 0,
          activeCleaningPlans: 0,
          lastCleaningCompleted: null,
          balanceDue: 0,
        },
      });
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Get upcoming appointments count
    const { data: upcomingBookings } = await supabase
      .from('bookings')
      .select('id', { count: 'exact' })
      .eq('customer_id', customer.id)
      .gte('booking_date', today.toISOString().split('T')[0])
      .neq('status', 'cancelled')
      .neq('status', 'canceled');

    // Get active cleaning plans count
    const { data: activePlans } = await supabase
      .from('recurring_schedules')
      .select('id', { count: 'exact' })
      .eq('customer_id', customer.id)
      .eq('is_active', true);

    // Get last completed cleaning
    const { data: lastCompleted } = await supabase
      .from('bookings')
      .select('booking_date')
      .eq('customer_id', customer.id)
      .eq('status', 'completed')
      .order('booking_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Calculate balance due (unpaid bookings)
    const { data: unpaidBookings } = await supabase
      .from('bookings')
      .select('total_amount')
      .eq('customer_id', customer.id)
      .is('payment_reference', null)
      .neq('status', 'cancelled')
      .neq('status', 'canceled')
      .neq('status', 'completed');

    const balanceDue = (unpaidBookings || []).reduce((sum, b) => sum + (b.total_amount || 0), 0);

    return NextResponse.json({
      ok: true,
      stats: {
        upcomingAppointments: upcomingBookings?.length || 0,
        activeCleaningPlans: activePlans?.length || 0,
        lastCleaningCompleted: lastCompleted?.booking_date || null,
        balanceDue,
      },
    });

  } catch (error) {
    console.error('Error in stats route:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
