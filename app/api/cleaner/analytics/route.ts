import { NextRequest, NextResponse } from 'next/server';
import { getCleanerSession, createCleanerSupabaseClient, cleanerIdToUuid } from '@/lib/cleaner-auth';
import { createServiceClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getCleanerSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient(); // Use service client for analytics
    const { searchParams } = new URL(request.url);
    const cleanerId = cleanerIdToUuid(session.id);
    
    const period = searchParams.get('period') || '30'; // days
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    // Fetch all bookings for this cleaner in the period
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_date,
        booking_time,
        service_type,
        status,
        cleaner_earnings,
        tip_amount,
        cleaner_accepted_at,
        cleaner_started_at,
        cleaner_completed_at,
        created_at
      `)
      .eq('cleaner_id', cleanerId)
      .gte('booking_date', startDateStr)
      .order('booking_date', { ascending: false });

    if (bookingsError) {
      console.error('Error fetching bookings for analytics:', bookingsError);
      return NextResponse.json({ ok: false, error: 'Failed to fetch analytics' }, { status: 500 });
    }

    const allBookings = bookings || [];

    // 1. Earnings Trends (daily breakdown)
    const earningsByDate: Record<string, number> = {};
    allBookings
      .filter((b: any) => b.status === 'completed' && b.cleaner_earnings)
      .forEach((b: any) => {
        const date = b.booking_date;
        earningsByDate[date] = (earningsByDate[date] || 0) + (b.cleaner_earnings || 0);
      });

    const earningsTrend = Object.entries(earningsByDate)
      .map(([date, earnings]) => ({ date, earnings }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 2. Booking Statistics
    const totalBookings = allBookings.length;
    const completedBookings = allBookings.filter((b: any) => b.status === 'completed').length;
    const cancelledBookings = allBookings.filter((b: any) => b.status === 'cancelled').length;
    const pendingBookings = allBookings.filter((b: any) => b.status === 'pending').length;
    const completionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;

    // 3. Earnings Summary
    const totalEarnings = allBookings
      .filter((b: any) => b.status === 'completed')
      .reduce((sum, b: any) => sum + (b.cleaner_earnings || 0), 0);
    
    const totalTips = allBookings
      .filter((b: any) => b.status === 'completed')
      .reduce((sum, b: any) => sum + (b.tip_amount || 0), 0);
    
    const avgEarningsPerBooking = completedBookings > 0 ? totalEarnings / completedBookings : 0;

    // 4. Service Type Breakdown
    const serviceTypeBreakdown: Record<string, { count: number; earnings: number }> = {};
    allBookings
      .filter((b: any) => b.status === 'completed')
      .forEach((b: any) => {
        const serviceType = b.service_type || 'Unknown';
        if (!serviceTypeBreakdown[serviceType]) {
          serviceTypeBreakdown[serviceType] = { count: 0, earnings: 0 };
        }
        serviceTypeBreakdown[serviceType].count++;
        serviceTypeBreakdown[serviceType].earnings += (b.cleaner_earnings || 0);
      });

    const serviceBreakdown = Object.entries(serviceTypeBreakdown).map(([service, data]) => ({
      service,
      count: data.count,
      earnings: data.earnings,
      percentage: completedBookings > 0 ? (data.count / completedBookings) * 100 : 0,
    }));

    // 5. Time-based Insights
    // Best days (by earnings)
    const earningsByDayOfWeek: Record<string, number> = {};
    allBookings
      .filter((b: any) => b.status === 'completed' && b.cleaner_earnings)
      .forEach((b: any) => {
        const date = new Date(b.booking_date);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
        earningsByDayOfWeek[dayName] = (earningsByDayOfWeek[dayName] || 0) + (b.cleaner_earnings || 0);
      });

    const bestDays = Object.entries(earningsByDayOfWeek)
      .map(([day, earnings]) => ({ day, earnings }))
      .sort((a, b) => b.earnings - a.earnings)
      .slice(0, 3);

    // Peak hours (by booking count)
    const bookingsByHour: Record<number, number> = {};
    allBookings
      .filter((b: any) => b.status === 'completed')
      .forEach((b: any) => {
        if (b.booking_time) {
          const hour = parseInt(b.booking_time.split(':')[0]);
          bookingsByHour[hour] = (bookingsByHour[hour] || 0) + 1;
        }
      });

    const peakHours = Object.entries(bookingsByHour)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    // 6. Performance Metrics
    // Average response time (time from booking creation to acceptance)
    const responseTimes: number[] = [];
    allBookings
      .filter((b: any) => b.cleaner_accepted_at && b.created_at)
      .forEach((b: any) => {
        const created = new Date(b.created_at).getTime();
        const accepted = new Date(b.cleaner_accepted_at).getTime();
        const minutes = (accepted - created) / (1000 * 60);
        if (minutes > 0 && minutes < 1440) { // Within 24 hours
          responseTimes.push(minutes);
        }
      });

    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length
      : 0;

    // Average job duration (time from start to completion)
    const jobDurations: number[] = [];
    allBookings
      .filter((b: any) => b.cleaner_started_at && b.cleaner_completed_at)
      .forEach((b: any) => {
        const started = new Date(b.cleaner_started_at).getTime();
        const completed = new Date(b.cleaner_completed_at).getTime();
        const hours = (completed - started) / (1000 * 60 * 60);
        if (hours > 0 && hours < 12) { // Within 12 hours
          jobDurations.push(hours);
        }
      });

    const avgJobDuration = jobDurations.length > 0
      ? jobDurations.reduce((sum, d) => sum + d, 0) / jobDurations.length
      : 0;

    // 7. Get cleaner rating
    const { data: cleaner } = await supabase
      .from('cleaners')
      .select('rating')
      .eq('id', cleanerId)
      .single();

    // 8. Review/Feedback Analytics
    const { data: reviews, error: reviewsError } = await supabase
      .from('cleaner_reviews')
      .select(`
        id,
        overall_rating,
        quality_rating,
        punctuality_rating,
        professionalism_rating,
        cleaner_response,
        cleaner_response_at,
        created_at
      `)
      .eq('cleaner_id', cleanerId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    let reviewStats: {
      total_reviews: number;
      avg_overall_rating: number;
      avg_quality_rating: number;
      avg_punctuality_rating: number;
      avg_professionalism_rating: number;
      response_rate: number;
      rating_distribution: { 1: number; 2: number; 3: number; 4: number; 5: number };
      reviews_by_date: Array<{ date: string; count: number; avg_rating: number }>;
    } = {
      total_reviews: 0,
      avg_overall_rating: 0,
      avg_quality_rating: 0,
      avg_punctuality_rating: 0,
      avg_professionalism_rating: 0,
      response_rate: 0,
      rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      reviews_by_date: [],
    };

    if (!reviewsError && reviews && reviews.length > 0) {
      const totalReviews = reviews.length;
      const reviewsWithResponse = reviews.filter((r: any) => r.cleaner_response).length;
      
      // Calculate averages
      const avgOverall = reviews.reduce((sum: number, r: any) => sum + (r.overall_rating || 0), 0) / totalReviews;
      const avgQuality = reviews.reduce((sum: number, r: any) => sum + (r.quality_rating || 0), 0) / totalReviews;
      const avgPunctuality = reviews.reduce((sum: number, r: any) => sum + (r.punctuality_rating || 0), 0) / totalReviews;
      const avgProfessionalism = reviews.reduce((sum: number, r: any) => sum + (r.professionalism_rating || 0), 0) / totalReviews;

      // Rating distribution
      const distribution: { 1: number; 2: number; 3: number; 4: number; 5: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      reviews.forEach((r: any) => {
        const rating = Math.round(r.overall_rating || 0);
        if (rating === 1) distribution[1]++;
        else if (rating === 2) distribution[2]++;
        else if (rating === 3) distribution[3]++;
        else if (rating === 4) distribution[4]++;
        else if (rating === 5) distribution[5]++;
      });

      // Reviews by date
      const reviewsByDate: Record<string, { count: number; totalRating: number }> = {};
      reviews.forEach((r: any) => {
        const date = r.created_at.split('T')[0];
        if (!reviewsByDate[date]) {
          reviewsByDate[date] = { count: 0, totalRating: 0 };
        }
        reviewsByDate[date].count++;
        reviewsByDate[date].totalRating += (r.overall_rating || 0);
      });

      const reviewsTrend = Object.entries(reviewsByDate)
        .map(([date, data]) => ({
          date,
          count: data.count,
          avg_rating: data.totalRating / data.count,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      reviewStats = {
        total_reviews: totalReviews,
        avg_overall_rating: Math.round(avgOverall * 10) / 10,
        avg_quality_rating: Math.round(avgQuality * 10) / 10,
        avg_punctuality_rating: Math.round(avgPunctuality * 10) / 10,
        avg_professionalism_rating: Math.round(avgProfessionalism * 10) / 10,
        response_rate: totalReviews > 0 ? Math.round((reviewsWithResponse / totalReviews) * 100) : 0,
        rating_distribution: distribution,
        reviews_by_date: reviewsTrend,
      };
    }

    return NextResponse.json({
      ok: true,
      period: days,
      summary: {
        total_bookings: totalBookings,
        completed_bookings: completedBookings,
        cancelled_bookings: cancelledBookings,
        pending_bookings: pendingBookings,
        completion_rate: Math.round(completionRate * 10) / 10,
        total_earnings: totalEarnings,
        total_tips: totalTips,
        avg_earnings_per_booking: Math.round(avgEarningsPerBooking),
        avg_rating: cleaner?.rating || 0,
        avg_response_time_minutes: Math.round(avgResponseTime),
        avg_job_duration_hours: Math.round(avgJobDuration * 10) / 10,
      },
      trends: {
        earnings_by_date: earningsTrend,
      },
      breakdowns: {
        service_types: serviceBreakdown,
      },
      insights: {
        best_days: bestDays,
        peak_hours: peakHours,
      },
      reviews: reviewStats,
    });
  } catch (error) {
    console.error('Error in analytics route:', error);
    return NextResponse.json(
      { ok: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
}

