import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get date range from query params
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    
    // Count bookings by status with optional date filtering
    const statuses = ['pending', 'confirmed', 'accepted', 'in-progress', 'completed'];
    const pipeline: Record<string, number> = {};

    for (const status of statuses) {
      let query = supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('status', status);
      
      // Helper function to get local date string (YYYY-MM-DD) to avoid timezone issues
      const getLocalDateString = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      // Apply date filters if provided - use booking_date (when service is scheduled)
      if (dateFrom && dateTo) {
        const dateFromStr = getLocalDateString(new Date(dateFrom));
        const dateToStr = getLocalDateString(new Date(dateTo));
        query = query
          .gte('booking_date', dateFromStr)
          .lte('booking_date', dateToStr);
      }
      
      const { count } = await query;
      pipeline[status] = count || 0;
    }

    return NextResponse.json({
      ok: true,
      pipeline,
    });
  } catch (error) {
    console.error('Error in booking pipeline API:', error);
    return NextResponse.json({
      ok: true,
      pipeline: {},
    });
  }
}























