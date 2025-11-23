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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Fetch active cleaners
    const { data: cleaners, error } = await supabase
      .from('cleaners')
      .select(`
        id,
        first_name,
        last_name,
        name,
        is_active,
        rating
      `)
      .eq('is_active', true)
      .limit(limit);

    if (error) {
      console.error('Error fetching active cleaners:', error);
      return NextResponse.json({
        ok: true,
        cleaners: [],
      });
    }

    if (!cleaners || cleaners.length === 0) {
      return NextResponse.json({
        ok: true,
        cleaners: [],
      });
    }

    // Fetch all active bookings for these cleaners in one query
    const cleanerIds = cleaners.map(c => c.id);
    const { data: activeBookings } = await supabase
      .from('bookings')
      .select('cleaner_id, status')
      .in('cleaner_id', cleanerIds)
      .in('status', ['pending', 'confirmed', 'accepted', 'in-progress']);

    // Group bookings by cleaner
    const bookingsByCleaner = new Map<string, { total: number; inProgress: number }>();
    activeBookings?.forEach((booking) => {
      if (!booking.cleaner_id) return;
      const existing = bookingsByCleaner.get(booking.cleaner_id) || { total: 0, inProgress: 0 };
      existing.total += 1;
      if (booking.status === 'in-progress') {
        existing.inProgress += 1;
      }
      bookingsByCleaner.set(booking.cleaner_id, existing);
    });

    // Map cleaners with stats
    const cleanersWithStats = cleaners.map((cleaner) => {
      const stats = bookingsByCleaner.get(cleaner.id) || { total: 0, inProgress: 0 };
      const status = stats.inProgress > 0 ? 'on-job' : stats.total > 0 ? 'available' : 'available';

      return {
        ...cleaner,
        status,
        bookings_count: stats.total,
      };
    });

    return NextResponse.json({
      ok: true,
      cleaners: cleanersWithStats,
    });
  } catch (error) {
    console.error('Error in active cleaners API:', error);
    return NextResponse.json({
      ok: true,
      cleaners: [],
    });
  }
}

