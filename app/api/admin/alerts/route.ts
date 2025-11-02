import { NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * Admin Alerts API
 * GET: Fetch critical alerts and notifications
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
    
    // Calculate date ranges
    const now = new Date();
    const todayISO = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const tomorrowISO = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const yesterday7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const alerts: any[] = [];
    
    // 1. Urgent: Bookings without assigned cleaner within 24 hours
    const { data: urgentBookings } = await supabase
      .from('bookings')
      .select('id, customer_name, booking_date, booking_time, service_type, status, created_at')
      .or('cleaner_id.is.null,cleaner_id.eq.manual')
      .in('status', ['pending', 'accepted'])
      .gte('booking_date', todayISO)
      .lte('booking_date', tomorrowISO)
      .order('booking_date', { ascending: true })
      .order('booking_time', { ascending: true })
      .limit(10);
    
    if (urgentBookings && urgentBookings.length > 0) {
      const urgentCount = urgentBookings.length;
      alerts.push({
        id: 'urgent-unassigned-bookings',
        severity: 'critical',
        type: 'unassigned_bookings',
        title: 'Urgent: Unassigned Bookings Today',
        message: `${urgentCount} booking${urgentCount > 1 ? 's' : ''} scheduled for today without a cleaner assigned`,
        count: urgentCount,
        details: urgentBookings,
        action: {
          label: 'Assign Cleaners',
          href: '/admin/bookings?filter=unassigned&date=today'
        },
        timestamp: now.toISOString()
      });
    }
    
    // 2. Low cleaner availability today
    const { data: availableCleaners } = await supabase
      .from('cleaners')
      .select('id')
      .eq('is_active', true)
      .eq('is_available', true);
    
    if (availableCleaners && availableCleaners.length < 3) {
      alerts.push({
        id: 'low-cleaner-availability',
        severity: 'warning',
        type: 'low_availability',
        title: 'Low Cleaner Availability',
        message: `Only ${availableCleaners.length} cleaner${availableCleaners.length !== 1 ? 's' : ''} available today. Consider recruiting or activating more cleaners.`,
        count: availableCleaners.length,
        action: {
          label: 'View Applications',
          href: '/admin/applications'
        },
        timestamp: now.toISOString()
      });
    }
    
    // 3. Pending quotes older than 48 hours
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const { data: oldQuotes } = await supabase
      .from('quotes')
      .select('id, first_name, last_name, email, created_at')
      .eq('status', 'pending')
      .lt('created_at', fortyEightHoursAgo.toISOString())
      .order('created_at', { ascending: true })
      .limit(20);
    
    if (oldQuotes && oldQuotes.length > 0) {
      alerts.push({
        id: 'old-pending-quotes',
        severity: 'warning',
        type: 'old_quotes',
        title: 'Old Pending Quotes',
        message: `${oldQuotes.length} quote${oldQuotes.length > 1 ? 's' : ''} pending for over 48 hours`,
        count: oldQuotes.length,
        details: oldQuotes,
        action: {
          label: 'Review Quotes',
          href: '/admin/quotes?status=pending'
        },
        timestamp: now.toISOString()
      });
    }
    
    // 4. Recent negative reviews (< 3 stars)
    const { data: recentReviews } = await supabase
      .from('reviews')
      .select('id, rating, comment, customer_name, booking_id, created_at')
      .lt('rating', 3)
      .gte('created_at', yesterday7Days.toISOString())
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (recentReviews && recentReviews.length > 0) {
      alerts.push({
        id: 'negative-reviews',
        severity: 'warning',
        type: 'negative_review',
        title: 'Recent Negative Reviews',
        message: `${recentReviews.length} review${recentReviews.length > 1 ? 's' : ''} with rating below 3 stars in the last 7 days`,
        count: recentReviews.length,
        details: recentReviews,
        action: {
          label: 'View Reviews',
          href: '/admin/reviews?filter=negative'
        },
        timestamp: now.toISOString()
      });
    }
    
    // 5. High cancellation rate spike (detect if cancellations increased significantly)
    const { data: recentCancellations } = await supabase
      .from('bookings')
      .select('id, status, cancelled_at')
      .eq('status', 'cancelled')
      .gte('cancelled_at', yesterday7Days.toISOString());
    
    // Calculate cancellation rate for recent period
    const recentCancellationRate = recentCancellations?.length || 0;
    
    if (recentCancellationRate > 10) {
      alerts.push({
        id: 'high-cancellation-rate',
        severity: 'warning',
        type: 'high_cancellations',
        title: 'High Cancellation Rate',
        message: `${recentCancellationRate} booking${recentCancellationRate > 1 ? 's' : ''} cancelled in the last 7 days. Review patterns.`,
        count: recentCancellationRate,
        action: {
          label: 'Analyze Cancellations',
          href: '/admin/bookings?status=cancelled&filter=recent'
        },
        timestamp: now.toISOString()
      });
    }
    
    // 6. Revenue drop detection (vs previous period)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    
    const { data: recentRevenue } = await supabase
      .from('bookings')
      .select('total_amount')
      .eq('status', 'completed')
      .gte('completed_at', thirtyDaysAgo.toISOString());
    
    const { data: previousRevenue } = await supabase
      .from('bookings')
      .select('total_amount')
      .eq('status', 'completed')
      .gte('completed_at', sixtyDaysAgo.toISOString())
      .lt('completed_at', thirtyDaysAgo.toISOString());
    
    const recentRevenueTotal = (recentRevenue || []).reduce((sum, b) => sum + (b.total_amount || 0), 0) / 100;
    const previousRevenueTotal = (previousRevenue || []).reduce((sum, b) => sum + (b.total_amount || 0), 0) / 100;
    
    if (previousRevenueTotal > 0) {
      const revenueDropPercentage = ((previousRevenueTotal - recentRevenueTotal) / previousRevenueTotal) * 100;
      if (revenueDropPercentage > 20) {
        alerts.push({
          id: 'revenue-drop',
          severity: 'warning',
          type: 'revenue_drop',
          title: 'Revenue Decline Detected',
          message: `Revenue has dropped ${revenueDropPercentage.toFixed(0)}% compared to previous period`,
          percentage: revenueDropPercentage,
          action: {
            label: 'View Financials',
            href: '/admin/dashboard#financial-overview'
          },
          timestamp: now.toISOString()
        });
      }
    }
    
    // Sort alerts by severity (critical > warning > info)
    const severityOrder = { critical: 0, warning: 1, info: 2, success: 3 };
    alerts.sort((a, b) => severityOrder[a.severity as keyof typeof severityOrder] - severityOrder[b.severity as keyof typeof severityOrder]);
    
    return NextResponse.json({
      ok: true,
      alerts,
      summary: {
        total: alerts.length,
        critical: alerts.filter(a => a.severity === 'critical').length,
        warning: alerts.filter(a => a.severity === 'warning').length,
        info: alerts.filter(a => a.severity === 'info').length
      }
    });
    
  } catch (error: any) {
    console.error('=== ALERTS API ERROR ===', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}

