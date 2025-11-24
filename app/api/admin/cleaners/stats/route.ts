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

    // Count total cleaners
    const { count: totalCleaners } = await supabase
      .from('cleaners')
      .select('*', { count: 'exact', head: true });

    // Count active cleaners
    const { count: activeCleaners } = await supabase
      .from('cleaners')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Count inactive cleaners
    const { count: inactiveCleaners } = await supabase
      .from('cleaners')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', false);

    // Get average rating
    const { data: cleaners } = await supabase
      .from('cleaners')
      .select('rating')
      .not('rating', 'is', null);

    const avgRating = cleaners && cleaners.length > 0
      ? cleaners.reduce((sum, c) => sum + (parseFloat(c.rating?.toString() || '0') || 0), 0) / cleaners.length
      : 0;

    return NextResponse.json({
      ok: true,
      stats: {
        total: totalCleaners || 0,
        active: activeCleaners || 0,
        inactive: inactiveCleaners || 0,
        averageRating: Math.round(avgRating * 10) / 10,
      },
    });
  } catch (error) {
    console.error('Error fetching cleaner stats:', error);
    return NextResponse.json({
      ok: true,
      stats: {
        total: 0,
        active: 0,
        inactive: 0,
        averageRating: 0,
      },
    });
  }
}

