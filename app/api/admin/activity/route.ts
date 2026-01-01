import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const activities: any[] = [];

    // Fetch recent bookings
    const { data: recentBookings } = await supabase
      .from('bookings')
      .select('id, customer_name, service_type, status, created_at, updated_at')
      .order('updated_at', { ascending: false })
      .limit(limit);

    recentBookings?.forEach((booking) => {
      activities.push({
        id: `booking-${booking.id}`,
        type: 'booking',
        message: `Booking ${booking.status === 'completed' ? 'completed' : booking.status} for ${booking.customer_name || 'customer'}`,
        status: booking.status,
        created_at: booking.updated_at || booking.created_at,
      });
    });

    // Fetch recent payments
    const { data: recentPayments } = await supabase
      .from('bookings')
      .select('id, customer_name, total_amount, payment_reference, created_at')
      .not('payment_reference', 'is', null)
      .order('created_at', { ascending: false })
      .limit(5);

    recentPayments?.forEach((payment) => {
      activities.push({
        id: `payment-${payment.id}`,
        type: 'payment',
        message: `Payment received from ${payment.customer_name || 'customer'}`,
        status: 'paid',
        created_at: payment.created_at,
      });
    });

    // Fetch pending quotes
    const { count: pendingQuotes } = await supabase
      .from('quotes')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (pendingQuotes && pendingQuotes > 0) {
      activities.push({
        id: 'quotes-pending',
        type: 'quote',
        message: `${pendingQuotes} pending quote${pendingQuotes > 1 ? 's' : ''} require attention`,
        status: 'pending',
        created_at: new Date().toISOString(),
      });
    }

    // Fetch pending applications
    const { count: pendingApplications } = await supabase
      .from('cleaner_applications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (pendingApplications && pendingApplications > 0) {
      activities.push({
        id: 'applications-pending',
        type: 'application',
        message: `${pendingApplications} pending application${pendingApplications > 1 ? 's' : ''} require review`,
        status: 'pending',
        created_at: new Date().toISOString(),
      });
    }

    // Sort by date and limit
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
































































