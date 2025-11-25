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
    const active = searchParams.get('active');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('cleaners')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (active === 'true') {
      query = query.eq('is_active', true);
    } else if (active === 'false') {
      query = query.eq('is_active', false);
    }

    const { data: cleaners, error } = await query;

    if (error) {
      console.error('Error fetching cleaners:', error);
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch cleaners' },
        { status: 500 }
      );
    }

    // Get booking counts for all cleaners in batch
    const cleanerIds = (cleaners || []).map((c: any) => c.id);
    const bookingCounts = new Map<string, { total: number; completed: number; revenue: number }>();
    const ratingMap = new Map<string, number>();

    if (cleanerIds.length > 0) {
      // Fetch all bookings for these cleaners
      const { data: bookings } = await supabase
        .from('bookings')
        .select('cleaner_id, status, cleaner_earnings')
        .in('cleaner_id', cleanerIds);

      // Count bookings per cleaner
      bookings?.forEach((booking: any) => {
        if (!booking.cleaner_id) return;
        const existing = bookingCounts.get(booking.cleaner_id) || { total: 0, completed: 0, revenue: 0 };
        existing.total += 1;
        if (booking.status === 'completed') {
          existing.completed += 1;
        }
        if (booking.cleaner_earnings) {
          existing.revenue += booking.cleaner_earnings;
        }
        bookingCounts.set(booking.cleaner_id, existing);
      });

      // Fetch average ratings from reviews for cleaners without rating
      const { data: reviews } = await supabase
        .from('cleaner_reviews')
        .select('cleaner_id, overall_rating')
        .in('cleaner_id', cleanerIds);

      // Calculate average rating per cleaner from reviews
      const reviewsByCleaner = new Map<string, number[]>();
      reviews?.forEach((review: any) => {
        if (!review.cleaner_id) return;
        const ratings = reviewsByCleaner.get(review.cleaner_id) || [];
        ratings.push(review.overall_rating);
        reviewsByCleaner.set(review.cleaner_id, ratings);
      });

      // Calculate averages
      reviewsByCleaner.forEach((ratings, cleanerId) => {
        const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
        ratingMap.set(cleanerId, Math.round(avg * 10) / 10);
      });
    }

    // Add booking stats and ratings to each cleaner
    const cleanersWithStats = (cleaners || []).map((cleaner: any) => {
      const stats = bookingCounts.get(cleaner.id) || { total: 0, completed: 0, revenue: 0 };
      // Use rating from cleaner table if available, otherwise calculate from reviews
      const averageRating = cleaner.rating !== null && cleaner.rating !== undefined
        ? parseFloat(cleaner.rating.toString())
        : (ratingMap.get(cleaner.id) || null);
      
      return {
        ...cleaner,
        total_bookings: stats.total,
        completed_bookings: stats.completed,
        total_revenue: stats.revenue,
        average_rating: averageRating,
      };
    });

    // Get total count
    let countQuery = supabase
      .from('cleaners')
      .select('*', { count: 'exact', head: true });

    if (active === 'true') {
      countQuery = countQuery.eq('is_active', true);
    } else if (active === 'false') {
      countQuery = countQuery.eq('is_active', false);
    }

    const { count } = await countQuery;

    return NextResponse.json({
      ok: true,
      cleaners: cleanersWithStats,
      total: count || 0,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error: any) {
    console.error('Error in cleaners GET API:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

















