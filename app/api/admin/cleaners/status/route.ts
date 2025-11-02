import { NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/cleaners/status
 * Fetch cleaners with their current status and booking counts
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

    // Fetch active cleaners (both is_active AND is_available must be true)
    const { data: cleaners, error } = await supabase
      .from('cleaners')
      .select('id, name, is_active, is_available')
      .eq('is_active', true)
      .eq('is_available', true)
      .order('name', { ascending: true });

    if (error) throw error;

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch current bookings for each cleaner
    const cleanersWithStatus = await Promise.all(
      (cleaners || []).map(async (cleaner) => {
        // Count active bookings (accepted or ongoing)
        const { count: activeBookingsCount } = await supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .eq('cleaner_id', cleaner.id)
          .in('status', ['accepted', 'ongoing']);

        // Get average rating if available (would need reviews table)
        // For now, return mock rating
        const rating = 4.5 + (Math.random() * 0.5);

        return {
          id: cleaner.id,
          name: cleaner.name,
          // All cleaners returned have both is_active=true and is_available=true
          // Status is determined by whether they have active bookings
          status: activeBookingsCount && activeBookingsCount > 0 ? 'busy' : 'available',
          currentBookings: activeBookingsCount || 0,
          rating: parseFloat(rating.toFixed(1)),
        };
      })
    );

    return NextResponse.json({
      ok: true,
      cleaners: cleanersWithStatus.slice(0, 10), // Limit to 10 for dashboard
    });
  } catch (error: any) {
    console.error('Error fetching cleaners status:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to fetch cleaners status' },
      { status: 500 }
    );
  }
}

