import { NextRequest, NextResponse } from 'next/server';
import { getCleanerSession, createCleanerSupabaseClient, cleanerIdToUuid } from '@/lib/cleaner-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getCleanerSession();
    if (!session) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = await createCleanerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const cleanerId = cleanerIdToUuid(session.id);
    
    // Get date range filters (optional)
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build query for completed bookings with earnings
    let query = supabase
      .from('bookings')
      .select(`
        id,
        tip_amount,
        service_fee,
        booking_date,
        booking_time,
        service_type,
        total_amount,
        cleaner_earnings,
        status,
        customer_name,
        address_line1,
        address_suburb,
        address_city,
        created_at
      `)
      .eq('cleaner_id', cleanerId)
      .eq('status', 'completed')
      .not('cleaner_earnings', 'is', null)
      .order('booking_date', { ascending: false })
      .order('booking_time', { ascending: false })
      .limit(limit);

    // Apply date filters if provided
    if (startDate) {
      query = query.gte('booking_date', startDate);
    }
    if (endDate) {
      query = query.lte('booking_date', endDate);
    }

    const { data: bookings, error } = await query;

    if (error) {
      console.error('Error fetching payments:', error);
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch payments' },
        { status: 500 }
      );
    }

    // Calculate totals
    const transactions = (bookings || []).map((b: any) => {
      const tip = b.tip_amount || 0;
      const total = b.total_amount || 0;
      const serviceFee = b.service_fee || 0;
      const cleanerEarnings = b.cleaner_earnings || 0;
      const commissionEarnings = Math.max(cleanerEarnings - tip, 0);
      const serviceSubtotal = Math.max(total - serviceFee - tip, 0);

      return {
        ...b,
        tip_amount: tip,
        commission_earnings: commissionEarnings,
        service_subtotal: serviceSubtotal,
      };
    });

    const totalEarnings = transactions.reduce((sum, t) => sum + (t.cleaner_earnings || 0), 0);

    const totalBookings = transactions.length;

    // Calculate monthly totals (current month)
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const monthlyBookings = transactions.filter(
      (b) => b.booking_date >= firstDayOfMonth
    );
    const monthlyEarnings = monthlyBookings.reduce((sum, b) => sum + (b.cleaner_earnings || 0), 0);

    // Tip/commission breakdowns
    const totalTip = transactions.reduce((sum, t) => sum + (t.tip_amount || 0), 0);
    const totalCommission = transactions.reduce((sum, t) => sum + (t.commission_earnings || 0), 0);

    const monthlyTip = monthlyBookings.reduce((sum, t) => sum + (t.tip_amount || 0), 0);
    const monthlyCommission = monthlyBookings.reduce((sum, t) => sum + (t.commission_earnings || 0), 0);

    return NextResponse.json({
      ok: true,
      transactions,
      summary: {
        total_earnings: totalEarnings,
        total_tip: totalTip,
        total_commission: totalCommission,
        total_bookings: totalBookings,
        monthly_earnings: monthlyEarnings,
        monthly_tip: monthlyTip,
        monthly_commission: monthlyCommission,
        monthly_bookings: monthlyBookings.length,
      },
    });
  } catch (error) {
    console.error('Error in payments route:', error);
    return NextResponse.json(
      { ok: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
}

