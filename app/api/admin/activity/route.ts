import { NextRequest, NextResponse } from 'next/server';
import { assertAdmin, createClient } from '@/lib/supabase-server';
import { isCompletedBooking } from '@/shared/dashboard-data';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const forbidden = await assertAdmin();
    if (forbidden) return forbidden;

    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10) || 10));

    const activities: Array<{
      id: string;
      type: string;
      message: string;
      status?: string;
      created_at: string;
    }> = [];

    // Run in parallel — sequential awaits were stacking latency on cold DB / large tables.
    const [bookingsResult, paymentsResult, quotesResult, appsResult] = await Promise.all([
      supabase
        .from('bookings')
        .select('id, customer_name, service_type, status, created_at, updated_at')
        .order('updated_at', { ascending: false })
        .limit(limit),
      supabase
        .from('bookings')
        .select('id, customer_name, total_amount, payment_reference, created_at')
        .not('payment_reference', 'is', null)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('quotes')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),
      supabase
        .from('applications')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),
    ]);

    if (bookingsResult.error) {
      console.error('[admin/activity] bookings:', bookingsResult.error.message);
    }
    if (paymentsResult.error) {
      console.error('[admin/activity] payments:', paymentsResult.error.message);
    }
    if (quotesResult.error) {
      console.error('[admin/activity] quotes count:', quotesResult.error.message);
    }
    if (appsResult.error) {
      console.error('[admin/activity] applications count:', appsResult.error.message);
    }

    bookingsResult.data?.forEach((booking) => {
      activities.push({
        id: `booking-${booking.id}`,
        type: 'booking',
        message: `Booking ${isCompletedBooking(booking.status) ? 'completed' : booking.status} for ${booking.customer_name || 'customer'}`,
        status: booking.status,
        created_at: booking.updated_at || booking.created_at,
      });
    });

    paymentsResult.data?.forEach((payment) => {
      activities.push({
        id: `payment-${payment.id}`,
        type: 'payment',
        message: `Payment received from ${payment.customer_name || 'customer'}`,
        status: 'paid',
        created_at: payment.created_at,
      });
    });

    const pendingQuotes = quotesResult.count;
    if (pendingQuotes != null && pendingQuotes > 0) {
      activities.push({
        id: 'quotes-pending',
        type: 'quote',
        message: `${pendingQuotes} pending quote${pendingQuotes > 1 ? 's' : ''} require attention`,
        status: 'pending',
        created_at: new Date().toISOString(),
      });
    }

    const pendingApplications = appsResult.count;
    if (pendingApplications != null && pendingApplications > 0) {
      activities.push({
        id: 'applications-pending',
        type: 'application',
        message: `${pendingApplications} pending application${pendingApplications > 1 ? 's' : ''} require review`,
        status: 'pending',
        created_at: new Date().toISOString(),
      });
    }

    activities.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA;
    });

    return NextResponse.json({
      ok: true,
      activities: activities.slice(0, limit),
    });
  } catch (error) {
    console.error('Error in activity API:', error);
    return NextResponse.json({
      ok: true,
      activities: [],
    });
  }
}
