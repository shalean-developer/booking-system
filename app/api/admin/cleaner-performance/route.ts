import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Fetch active cleaners
    const { data: cleaners, error: cleanersError } = await supabase
      .from('cleaners')
      .select('id, first_name, last_name, name, rating, is_active')
      .eq('is_active', true)
      .limit(limit * 2); // Get more to calculate performance

    if (cleanersError) {
      console.error('Error fetching cleaners:', cleanersError);
      return NextResponse.json({
        ok: true,
        cleaners: [],
      });
    }

    // Calculate performance metrics for each cleaner
    const cleanersWithPerformance = await Promise.all(
      (cleaners || []).map(async (cleaner) => {
        // Get total bookings
        const { count: totalBookings } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('cleaner_id', cleaner.id);

        // Get completed bookings
        const { count: completedBookings } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('cleaner_id', cleaner.id)
          .eq('status', 'completed');

        const completionRate = totalBookings && totalBookings > 0
          ? Math.round((completedBookings || 0) / totalBookings * 100)
          : 0;

        return {
          ...cleaner,
          total_bookings: totalBookings || 0,
          completed_bookings: completedBookings || 0,
          completion_rate: completionRate,
        };
      })
    );

    // Sort by rating and completion rate, then limit
    cleanersWithPerformance.sort((a, b) => {
      const scoreA = (a.rating || 0) * 0.5 + a.completion_rate * 0.5;
      const scoreB = (b.rating || 0) * 0.5 + b.completion_rate * 0.5;
      return scoreB - scoreA;
    });

    return NextResponse.json({
      ok: true,
      cleaners: cleanersWithPerformance.slice(0, limit),
    });
  } catch (error: any) {
    console.error('Error in cleaner-performance GET API:', error);
    return NextResponse.json({
      ok: true,
      cleaners: [],
    });
  }
}














