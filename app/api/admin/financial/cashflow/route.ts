import { NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/financial/cashflow
 * Fetch cash flow data for the last 12 months
 */
export async function GET(req: Request) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const supabase = await createClient();
    const url = new URL(req.url);
    const months = parseInt(url.searchParams.get('months') || '12');

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // Fetch all bookings in range
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('created_at, total_amount, cleaner_earnings, service_fee, status')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Group by month
    const monthlyData = new Map<
      string,
      { incoming: number; outgoing: number; cash: number }
    >();

    let runningCash = 0;

    // Initialize all months with zero values
    for (let i = 0; i < months; i++) {
      const date = new Date(startDate);
      date.setMonth(date.getMonth() + i);
      const monthKey = date.toISOString().slice(0, 7); // YYYY-MM
      monthlyData.set(monthKey, { incoming: 0, outgoing: 0, cash: 0 });
    }

    // Process bookings
    (bookings || []).forEach((booking) => {
      const monthKey = new Date(booking.created_at).toISOString().slice(0, 7);
      const monthData = monthlyData.get(monthKey);

      if (monthData) {
        if (booking.status === 'completed' && booking.total_amount) {
          const income = (booking.total_amount || 0) / 100;
          monthData.incoming += income;
          runningCash += income;
        }

        // Outgoing: cleaner earnings
        const earnings = (booking.cleaner_earnings || 0) / 100;
        if (earnings > 0) {
          monthData.outgoing += earnings;
          runningCash -= earnings;
        }

        monthData.cash = runningCash;
      }
    });

    // Convert to array format
    const cashFlowData = Array.from(monthlyData.entries())
      .map(([date, data]) => ({
        date: `${date}-01`,
        incoming: data.incoming,
        outgoing: data.outgoing,
        cash: data.cash,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const startingCash = cashFlowData[0]?.cash || 0;
    const endingCash = cashFlowData[cashFlowData.length - 1]?.cash || 0;
    const totalIncoming = cashFlowData.reduce((sum, d) => sum + d.incoming, 0);
    const totalOutgoing = cashFlowData.reduce((sum, d) => sum + d.outgoing, 0);

    return NextResponse.json({
      ok: true,
      data: cashFlowData,
      summary: {
        startingCash,
        endingCash,
        totalIncoming,
        totalOutgoing,
        startingDate: cashFlowData[0]?.date || startDate.toISOString(),
        endingDate: cashFlowData[cashFlowData.length - 1]?.date || endDate.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error fetching cash flow:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to fetch cash flow data' },
      { status: 500 }
    );
  }
}

