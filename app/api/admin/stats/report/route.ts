import { NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase-server';

// Simple CSV generation for server-side
function formatDate(value: string | Date): string {
  if (!value) return '';
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toISOString().split('T')[0];
}

function formatCurrency(value: number): string {
  return (value / 100).toFixed(2);
}

function arrayToCSV(
  data: Array<Record<string, any>>,
  columns: Array<{ key: string; label: string; format?: (value: any) => string }>
): string {
  const headers = columns.map(col => col.label);
  const rows = data.map(item =>
    columns.map(col => {
      const value = item[col.key];
      const formatted = col.format ? col.format(value) : String(value ?? '');
      return `"${formatted.replace(/"/g, '""')}"`;
    }).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

export const dynamic = 'force-dynamic';

/**
 * Admin Revenue Report API
 * GET: Export revenue report as CSV
 * Query params:
 *   - format: 'csv' (default)
 *   - days: number of days (default: 30)
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
    
    const format = url.searchParams.get('format') || 'csv';
    const days = parseInt(url.searchParams.get('days') || '30');
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Fetch bookings in date range
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('created_at, total_amount, cleaner_earnings, service_fee, status, service_type')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching revenue data:', error);
      throw error;
    }
    
    // Calculate daily revenue summary
    const dailySummary = new Map<string, {
      date: string;
      revenue: number;
      bookings: number;
      completed: number;
      companyEarnings: number;
    }>();
    
    (bookings || []).forEach((booking) => {
      const date = new Date(booking.created_at).toISOString().split('T')[0];
      
      if (!dailySummary.has(date)) {
        dailySummary.set(date, {
          date,
          revenue: 0,
          bookings: 0,
          completed: 0,
          companyEarnings: 0,
        });
      }
      
      const day = dailySummary.get(date)!;
      day.revenue += (booking.total_amount || 0);
      day.bookings += 1;
      
      if (booking.status === 'completed') {
        day.completed += 1;
      }
      
      const cleanerEarnings = booking.cleaner_earnings || 0;
      day.companyEarnings += (booking.total_amount || 0) - cleanerEarnings;
    });
    
    // Convert to array and sort
    const reportData = Array.from(dailySummary.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Calculate totals
    const totals = {
      revenue: reportData.reduce((sum, d) => sum + d.revenue, 0),
      bookings: reportData.reduce((sum, d) => sum + d.bookings, 0),
      completed: reportData.reduce((sum, d) => sum + d.completed, 0),
      companyEarnings: reportData.reduce((sum, d) => sum + d.companyEarnings, 0),
    };
    
    // Add totals row
    reportData.push({
      date: 'TOTAL',
      revenue: totals.revenue,
      bookings: totals.bookings,
      completed: totals.completed,
      companyEarnings: totals.companyEarnings,
    });
    
    // Generate CSV
    const csv = arrayToCSV(
      reportData,
      [
        { key: 'date', label: 'Date', format: (val) => val === 'TOTAL' ? 'TOTAL' : formatDate(val) },
        { key: 'revenue', label: 'Total Revenue (R)', format: formatCurrency },
        { key: 'bookings', label: 'Bookings', format: (val) => String(val) },
        { key: 'completed', label: 'Completed', format: (val) => String(val) },
        { key: 'companyEarnings', label: 'Company Earnings (R)', format: formatCurrency },
      ]
    );
    
    const filename = `revenue-report-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}.csv`;
    
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
    
  } catch (error: any) {
    console.error('=== REVENUE REPORT ERROR ===', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to generate revenue report' },
      { status: 500 }
    );
  }
}
