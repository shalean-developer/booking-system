import { NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * Admin Stats Chart Data API
 * GET: Fetch time-series data for charts
 * Query params:
 *   - startDate: ISO date string (default: 30 days ago)
 *   - endDate: ISO date string (default: today)
 *   - period: 'daily' | 'weekly' | 'monthly' (default: 'daily')
 */
export async function GET(request: Request) {
  try {
    // Check admin access
    if (!await isAdmin()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }
    
    const supabase = await createClient();
    const url = new URL(request.url);
    
    // Parse query parameters
    const endDate = new Date(url.searchParams.get('endDate') || new Date());
    const daysBack = parseInt(url.searchParams.get('days') || '30');
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - daysBack);
    
    const startDateISO = startDate.toISOString();
    const endDateISO = endDate.toISOString();
    
    // Fetch bookings in date range
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('created_at, total_amount, cleaner_earnings, service_fee, status')
      .gte('created_at', startDateISO)
      .lte('created_at', endDateISO)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching chart data:', error);
      throw error;
    }
    
    // Group data by day
    const dailyData = new Map<string, {
      date: string;
      revenue: number;
      bookings: number;
      completed: number;
      cancelled: number;
      companyEarnings: number;
    }>();
    
    (bookings || []).forEach((booking) => {
      const date = new Date(booking.created_at).toISOString().split('T')[0]; // YYYY-MM-DD
      
      if (!dailyData.has(date)) {
        dailyData.set(date, {
          date,
          revenue: 0,
          bookings: 0,
          completed: 0,
          cancelled: 0,
          companyEarnings: 0,
        });
      }
      
      const dayData = dailyData.get(date)!;
      dayData.bookings += 1;
      
      if (booking.status === 'completed') {
        dayData.completed += 1;
        dayData.revenue += (booking.total_amount || 0) / 100; // Convert cents to rands - only from completed
        const cleanerEarnings = (booking.cleaner_earnings || 0) / 100;
        dayData.companyEarnings += (booking.total_amount || 0) / 100 - cleanerEarnings;
      }
      
      if (booking.status === 'cancelled') {
        dayData.cancelled += 1;
      }
    });
    
    // Convert to array and sort by date
    const chartData = Array.from(dailyData.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Calculate comparison period (previous period of same length)
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - daysBack);
    const prevEndDate = new Date(startDate);
    
    const { data: prevBookings } = await supabase
      .from('bookings')
      .select('total_amount, cleaner_earnings, status')
      .gte('created_at', prevStartDate.toISOString())
      .lt('created_at', prevEndDate.toISOString());
    
    // Calculate comparison metrics
    const currentRevenue = chartData.reduce((sum, d) => sum + d.revenue, 0);
    const currentBookings = chartData.reduce((sum, d) => sum + d.bookings, 0);
    const currentCompleted = chartData.reduce((sum, d) => sum + d.completed, 0);
    
    const prevRevenue = (prevBookings || []).reduce((sum, b) => sum + ((b.total_amount || 0) / 100), 0);
    const prevBookingsCount = (prevBookings || []).length;
    const prevCompleted = (prevBookings || []).filter(b => b.status === 'completed').length;
    
    const revenueChange = prevRevenue > 0 
      ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 
      : currentRevenue > 0 ? 100 : 0;
    const bookingsChange = prevBookingsCount > 0
      ? ((currentBookings - prevBookingsCount) / prevBookingsCount) * 100
      : currentBookings > 0 ? 100 : 0;
    const completedChange = prevCompleted > 0
      ? ((currentCompleted - prevCompleted) / prevCompleted) * 100
      : currentCompleted > 0 ? 100 : 0;
    
    return NextResponse.json({
      ok: true,
      chartData,
      comparison: {
        revenue: {
          current: currentRevenue,
          previous: prevRevenue,
          change: revenueChange,
        },
        bookings: {
          current: currentBookings,
          previous: prevBookingsCount,
          change: bookingsChange,
        },
        completed: {
          current: currentCompleted,
          previous: prevCompleted,
          change: completedChange,
        },
      },
    });
    
  } catch (error: any) {
    console.error('=== CHART DATA ERROR ===', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to fetch chart data' },
      { status: 500 }
    );
  }
}
