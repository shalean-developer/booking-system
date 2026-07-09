import type { SupabaseClient } from '@supabase/supabase-js';
import { sanitizeCleanerForAdmin } from '@/lib/cleaner-auth';
import { isExcludedFromRevenueReporting } from '@/lib/booking-revenue-exclusion';
import { isCompletedBooking } from '@/shared/dashboard-data';
import { getCleanerPayoutCents } from '@/shared/finance-engine';

type SupabaseServer = SupabaseClient;

/** Attach booking stats and ratings to cleaner rows (batch). */
export async function attachCleanerStats(supabase: SupabaseServer, cleaners: unknown[]) {
  const cleanerIds = (cleaners || []).map((c: unknown) => (c as { id: string }).id);
  const bookingCounts = new Map<string, { total: number; completed: number; revenue: number }>();
  const ratingMap = new Map<string, number>();

  if (cleanerIds.length > 0) {
    const { data: bookings } = await supabase
      .from('bookings')
      .select('cleaner_id, status, cleaner_earnings, payment_status')
      .in('cleaner_id', cleanerIds);

    bookings?.forEach((booking: Record<string, unknown>) => {
      const cid = booking.cleaner_id as string | undefined;
      if (!cid) return;
      const existing = bookingCounts.get(cid) || { total: 0, completed: 0, revenue: 0 };
      existing.total += 1;
      if (isCompletedBooking(String(booking.status))) {
        existing.completed += 1;
      }
      const payoutCents = getCleanerPayoutCents(
        booking as { cleaner_earnings?: number | null; earnings_final?: number | null },
      );
      if (
        payoutCents > 0 &&
        !isExcludedFromRevenueReporting({
          payment_status: booking.payment_status as string | null | undefined,
          status: booking.status as string | null | undefined,
        })
      ) {
        existing.revenue += payoutCents;
      }
      bookingCounts.set(cid, existing);
    });

    const { data: reviews } = await supabase
      .from('cleaner_reviews')
      .select('cleaner_id, overall_rating')
      .in('cleaner_id', cleanerIds);

    const reviewsByCleaner = new Map<string, number[]>();
    reviews?.forEach((review: { cleaner_id?: string; overall_rating?: number }) => {
      if (!review.cleaner_id) return;
      const ratings = reviewsByCleaner.get(review.cleaner_id) || [];
      ratings.push(review.overall_rating ?? 0);
      reviewsByCleaner.set(review.cleaner_id, ratings);
    });

    reviewsByCleaner.forEach((ratings, cleanerId) => {
      const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
      ratingMap.set(cleanerId, Math.round(avg * 10) / 10);
    });
  }

  return (cleaners || []).map((cleaner: unknown) => {
    const c = cleaner as { id: string; rating?: unknown };
    const stats = bookingCounts.get(c.id) || { total: 0, completed: 0, revenue: 0 };
    const averageRating =
      c.rating !== null && c.rating !== undefined
        ? parseFloat(String(c.rating))
        : (ratingMap.get(c.id) ?? null);

    return {
      ...sanitizeCleanerForAdmin(cleaner as Record<string, unknown>),
      total_bookings: stats.total,
      completed_bookings: stats.completed,
      total_revenue: stats.revenue,
      average_rating: averageRating,
    };
  });
}
