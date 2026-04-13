import { NextRequest, NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });
    }

    const supabase = await createClient();

    // Get date range from query params
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    
    const getLocalDateString = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Group related DB statuses into pipeline stages shown in the admin UI
    const buckets: { key: string; statuses: string[] }[] = [
      { key: 'pending', statuses: ['pending', 'reschedule_requested'] },
      { key: 'confirmed', statuses: ['confirmed', 'paid'] },
      { key: 'accepted', statuses: ['accepted'] },
      { key: 'in-progress', statuses: ['in-progress', 'on_my_way'] },
      { key: 'completed', statuses: ['completed'] },
    ];

    const pipeline: Record<string, number> = {};

    for (const { key, statuses } of buckets) {
      let query = supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .in('status', statuses);

      if (dateFrom && dateTo) {
        const dateFromStr = getLocalDateString(new Date(dateFrom));
        const dateToStr = getLocalDateString(new Date(dateTo));
        query = query.gte('booking_date', dateFromStr).lte('booking_date', dateToStr);
      }

      const { count, error } = await query;
      if (error) {
        console.error('Booking pipeline bucket error:', key, error);
        return NextResponse.json(
          { ok: false, error: error.message || 'Failed to load pipeline' },
          { status: 500 }
        );
      }
      pipeline[key] = count || 0;
    }

    return NextResponse.json({
      ok: true,
      pipeline,
    });
  } catch (error) {
    console.error('Error in booking pipeline API:', error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}























