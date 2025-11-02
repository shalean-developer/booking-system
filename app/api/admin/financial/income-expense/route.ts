import { NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/financial/income-expense
 * Fetch income and expense data by month
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
    const months = parseInt(url.searchParams.get('months') || '6');

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // Fetch completed bookings (income)
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('created_at, total_amount, cleaner_earnings, status')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .eq('status', 'completed')
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Group by month
    const monthlyData = new Map<string, { income: number; expense: number }>();

    // Initialize all months
    for (let i = 0; i < months; i++) {
      const date = new Date(startDate);
      date.setMonth(date.getMonth() + i);
      const monthKey = date.toISOString().slice(0, 7); // YYYY-MM
      monthlyData.set(monthKey, { income: 0, expense: 0 });
    }

    // Process bookings
    (bookings || []).forEach((booking) => {
      const monthKey = new Date(booking.created_at).toISOString().slice(0, 7);
      const monthData = monthlyData.get(monthKey);

      if (monthData && booking.total_amount) {
        const income = (booking.total_amount || 0) / 100;
        const expense = (booking.cleaner_earnings || 0) / 100;

        monthData.income += income;
        monthData.expense += expense;
      }
    });

    // Convert to array
    const chartData = Array.from(monthlyData.entries())
      .map(([date, data]) => ({
        date: `${date}-01`,
        income: data.income,
        expense: data.expense,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const totalIncome = chartData.reduce((sum, d) => sum + d.income, 0);
    const totalExpenses = chartData.reduce((sum, d) => sum + d.expense, 0);

    return NextResponse.json({
      ok: true,
      data: chartData,
      totals: {
        totalIncome,
        totalExpenses,
      },
    });
  } catch (error: any) {
    console.error('Error fetching income/expense:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to fetch income/expense data' },
      { status: 500 }
    );
  }
}

