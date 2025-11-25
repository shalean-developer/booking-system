import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
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

    // Use service client to bypass RLS for admin operations
    const supabase = createServiceClient();
    const { searchParams } = new URL(request.url);
    const cleanerId = searchParams.get('cleaner');

    // Build queries - filter by cleaner if provided
    let bookingsQuery = supabase.from('bookings').select('*', { count: 'exact', head: true });
    let completedBookingsQuery = supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');

    if (cleanerId) {
      bookingsQuery = bookingsQuery.eq('cleaner_id', cleanerId);
      completedBookingsQuery = completedBookingsQuery.eq('cleaner_id', cleanerId);
    }

    // Get total bookings count
    const { count: totalBookings } = await bookingsQuery;

    // Get completed bookings count
    const { count: completedBookings } = await completedBookingsQuery;

    // Calculate completion rate
    const completionRate = totalBookings && totalBookings > 0
      ? (completedBookings || 0) / totalBookings
      : 0;

    // Get average rating from cleaners
    let cleanersQuery = supabase
      .from('cleaners')
      .select('rating')
      .not('rating', 'is', null);

    if (cleanerId) {
      cleanersQuery = cleanersQuery.eq('id', cleanerId);
    }

    const { data: cleaners } = await cleanersQuery;

    const averageRating = cleaners && cleaners.length > 0
      ? cleaners.reduce((sum, c) => sum + (parseFloat(c.rating?.toString() || '0') || 0), 0) / cleaners.length
      : 0;

    // Get total revenue (sum of cleaner_earnings from completed bookings)
    let revenueQuery = supabase
      .from('bookings')
      .select('cleaner_earnings')
      .eq('status', 'completed')
      .not('cleaner_earnings', 'is', null);

    if (cleanerId) {
      revenueQuery = revenueQuery.eq('cleaner_id', cleanerId);
    }

    const { data: completedBookingData } = await revenueQuery;

    const totalRevenue = completedBookingData?.reduce((sum, b) => sum + (b.cleaner_earnings || 0), 0) || 0;

    return NextResponse.json({
      ok: true,
      stats: {
        totalBookings: totalBookings || 0,
        averageRating: Math.round(averageRating * 10) / 10,
        totalRevenue: totalRevenue,
        completionRate: completionRate,
      },
    });
  } catch (error: any) {
    console.error('Error fetching performance stats:', error);
    return NextResponse.json(
      { 
        ok: false, 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

