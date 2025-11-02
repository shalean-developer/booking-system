import { NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * Admin Cleaner Performance API
 * GET: Fetch cleaner performance metrics including ratings, completion rates, bookings, and earnings
 */
export async function GET(request: Request) {
  try {
    // Check admin access
    if (!await isAdmin()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }
    
    const supabase = await createClient();
    
    // Calculate date for recent period (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();
    
    // Fetch all active cleaners
    const { data: cleaners, error: cleanersError } = await supabase
      .from('cleaners')
      .select('id, name, photo_url, rating, is_active, is_available')
      .eq('is_active', true);
    
    if (cleanersError) {
      throw cleanersError;
    }
    
    if (!cleaners || cleaners.length === 0) {
      return NextResponse.json({
        ok: true,
        cleaners: [],
      });
    }
    
    // Fetch performance metrics for each cleaner
    const cleanerPerformanceData = await Promise.all(
      cleaners.map(async (cleaner) => {
        // Get all bookings for this cleaner
        const { data: allBookings } = await supabase
          .from('bookings')
          .select('id, total_amount, cleaner_earnings, status, cleaner_completed_at')
          .eq('cleaner_id', cleaner.id);
        
        // Get recent bookings (last 30 days)
        const { data: recentBookings } = await supabase
          .from('bookings')
          .select('id, total_amount, cleaner_earnings, status, cleaner_completed_at')
          .eq('cleaner_id', cleaner.id)
          .gte('created_at', thirtyDaysAgoISO);
        
        // Get customer ratings for this cleaner
        const { data: ratings } = await supabase
          .from('reviews')
          .select('rating')
          .eq('cleaner_id', cleaner.id);
        
        // Calculate metrics
        const totalBookings = allBookings?.length || 0;
        const completedBookings = allBookings?.filter(b => b.status === 'completed').length || 0;
        const completionRate = totalBookings > 0 
          ? Math.round((completedBookings / totalBookings) * 100)
          : 0;
        
        const totalEarnings = (allBookings || [])
          .filter(b => b.status === 'completed')
          .reduce((sum, b) => sum + (b.cleaner_earnings || 0), 0) / 100;
        
        const recentBookingsCount = recentBookings?.length || 0;
        const recentEarnings = (recentBookings || [])
          .filter(b => b.status === 'completed')
          .reduce((sum, b) => sum + (b.cleaner_earnings || 0), 0) / 100;
        
        const avgRating = ratings && ratings.length > 0
          ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
          : cleaner.rating || 5.0;
        
        // Calculate performance change (comparing recent period to previous period)
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
        
        const { data: previousBookings } = await supabase
          .from('bookings')
          .select('id, total_amount, cleaner_earnings, status')
          .eq('cleaner_id', cleaner.id)
          .gte('created_at', sixtyDaysAgo.toISOString())
          .lt('created_at', thirtyDaysAgoISO);
        
        const previousBookingsCount = previousBookings?.length || 0;
        
        const performanceChange = previousBookingsCount > 0
          ? ((recentBookingsCount - previousBookingsCount) / previousBookingsCount) * 100
          : recentBookingsCount > 0 ? 100 : 0;
        
        return {
          id: cleaner.id,
          name: cleaner.name,
          photo_url: cleaner.photo_url,
          rating: cleaner.rating || 5.0,
          total_bookings: totalBookings,
          completed_bookings: completedBookings,
          completion_rate: completionRate,
          avg_rating: avgRating,
          total_earnings: totalEarnings,
          recent_bookings: recentBookingsCount,
          recent_earnings: recentEarnings,
          performance_change: performanceChange,
        };
      })
    );
    
    // Sort by performance score (combination of rating, completion rate, and bookings)
    const sortedCleaners = cleanerPerformanceData.sort((a, b) => {
      // Calculate performance score
      const scoreA = (a.avg_rating * 0.4) + (a.completion_rate * 0.3) + (Math.min(a.total_bookings / 100, 1) * 30);
      const scoreB = (b.avg_rating * 0.4) + (b.completion_rate * 0.3) + (Math.min(b.total_bookings / 100, 1) * 30);
      return scoreB - scoreA;
    });
    
    return NextResponse.json({
      ok: true,
      cleaners: sortedCleaners,
    });
    
  } catch (error: any) {
    console.error('=== CLEANER PERFORMANCE ERROR ===', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to fetch cleaner performance' },
      { status: 500 }
    );
  }
}

