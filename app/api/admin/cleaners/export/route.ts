import { NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase-server';

// Simple CSV generation for server-side
function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '';
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toISOString().split('T')[0];
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
 * Admin Cleaners Export API
 * GET: Export cleaners data as CSV
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
    
    // Fetch all cleaners
    const { data: cleaners, error } = await supabase
      .from('cleaners')
      .select('id, name, email, phone, is_active, rating, created_at, bio')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching cleaners:', error);
      throw error;
    }
    
    // Fetch cleaner earnings and booking counts
    const cleanersWithStats = await Promise.all(
      (cleaners || []).map(async (cleaner) => {
        // Get monthly earnings
        const firstDay = new Date();
        firstDay.setDate(1);
        firstDay.setHours(0, 0, 0, 0);
        
        const { data: monthlyBookings } = await supabase
          .from('bookings')
          .select('cleaner_earnings, status')
          .eq('cleaner_id', cleaner.id)
          .eq('status', 'completed')
          .gte('created_at', firstDay.toISOString());
        
        const monthlyEarnings = (monthlyBookings || []).reduce(
          (sum, b) => sum + (b.cleaner_earnings || 0),
          0
        );
        
        const completedCount = (monthlyBookings || []).length;
        
        return {
          ...cleaner,
          monthly_earnings: monthlyEarnings,
          completed_bookings: completedCount,
        };
      })
    );
    
    // Generate CSV
    const csv = arrayToCSV(
      cleanersWithStats,
      [
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'is_active', label: 'Active Status', format: (val) => val ? 'Active' : 'Inactive' },
        { key: 'rating', label: 'Rating', format: (val) => val ? String(val) : 'N/A' },
        { key: 'monthly_earnings', label: 'Monthly Earnings (R)', format: (val) => (val / 100).toFixed(2) },
        { key: 'completed_bookings', label: 'Completed Bookings (This Month)' },
        { key: 'created_at', label: 'Created At', format: formatDate },
      ]
    );
    
    const filename = `cleaners-export-${new Date().toISOString().split('T')[0]}.csv`;
    
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
    
  } catch (error: any) {
    console.error('=== CLEANERS EXPORT ERROR ===', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to export cleaners' },
      { status: 500 }
    );
  }
}
