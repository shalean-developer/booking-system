import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check admin access first
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Create Supabase client
    let supabase;
    try {
      supabase = await createClient();
    } catch (clientError) {
      console.error('Error creating Supabase client:', clientError);
      return NextResponse.json(
        { ok: false, error: 'Database connection error' },
        { status: 500 }
      );
    }
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('bookings')
      .select(`
        id,
        customer_name,
        total_amount,
        payment_reference,
        status,
        created_at
      `)
      .not('payment_reference', 'is', null) // Only bookings with payment references
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== 'all') {
      // Map payment status to booking status
      if (status === 'completed') {
        query = query.eq('status', 'completed');
      } else if (status === 'pending') {
        // Pending payments: bookings that are pending, confirmed, or reschedule_requested
        query = query.in('status', ['pending', 'confirmed', 'reschedule_requested']);
      } else if (status === 'processing') {
        // Processing payments: bookings that are accepted, on_my_way, or in-progress
        query = query.in('status', ['accepted', 'on_my_way', 'in-progress']);
      } else if (status === 'failed') {
        // Failed payments: bookings that are cancelled or declined
        query = query.in('status', ['cancelled', 'declined']);
      } else {
        query = query.eq('status', status);
      }
    }

    if (search) {
      query = query.or(
        `customer_name.ilike.%${search}%,payment_reference.ilike.%${search}%`
      );
    }

    const { data: bookings, error } = await query;

    if (error) {
      console.error('Error fetching payments:', error);
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch payments' },
        { status: 500 }
      );
    }

    // Get total count
    let countQuery = supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .not('payment_reference', 'is', null);

    if (status && status !== 'all') {
      if (status === 'completed') {
        countQuery = countQuery.eq('status', 'completed');
      } else if (status === 'pending') {
        // Pending payments: bookings that are pending, confirmed, or reschedule_requested
        countQuery = countQuery.in('status', ['pending', 'confirmed', 'reschedule_requested']);
      } else if (status === 'processing') {
        // Processing payments: bookings that are accepted, on_my_way, or in-progress
        countQuery = countQuery.in('status', ['accepted', 'on_my_way', 'in-progress']);
      } else if (status === 'failed') {
        // Failed payments: bookings that are cancelled or declined
        countQuery = countQuery.in('status', ['cancelled', 'declined']);
      } else {
        countQuery = countQuery.eq('status', status);
      }
    }

    if (search) {
      countQuery = countQuery.or(
        `customer_name.ilike.%${search}%,payment_reference.ilike.%${search}%`
      );
    }

    const { count, error: countError } = await countQuery;
    
    if (countError) {
      console.error('Error fetching payment count:', countError);
      // Continue with count = 0 rather than failing
    }

    // Helper function to verify payment with Paystack (for bookings that might be successful but webhook hasn't fired)
    async function verifyPaymentStatus(paymentReference: string): Promise<'success' | 'failed' | 'unknown'> {
      try {
        const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
        if (!paystackSecretKey) {
          return 'unknown';
        }

        const verificationUrl = `https://api.paystack.co/transaction/verify/${paymentReference}`;
        const response = await fetch(verificationUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${paystackSecretKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          return 'unknown';
        }

        const data = await response.json();
        if (data.status && data.data && data.data.status === 'success') {
          return 'success';
        }
        return 'failed';
      } catch (error) {
        console.error('Error verifying payment with Paystack:', error);
        return 'unknown';
      }
    }

    // Transform to payment format
    // Map booking statuses to payment statuses:
    // - completed → completed (payment successful, confirmed by webhook)
    // - cancelled, declined → failed (payment failed/cancelled)
    // - accepted, on_my_way, in-progress → processing (work in progress, payment was successful)
    // - pending, confirmed → verify with Paystack if payment_reference exists (payment might be successful but webhook hasn't fired)
    // - reschedule_requested → pending (awaiting action)
    const payments = await Promise.all((bookings || []).map(async (booking: any) => {
      let paymentStatus: string;
      const bookingStatus = booking.status?.toLowerCase() || '';
      const hasPaymentReference = !!booking.payment_reference;
      
      if (bookingStatus === 'completed') {
        // Booking completed - payment was successful (confirmed by webhook)
        paymentStatus = 'completed';
      } else if (bookingStatus === 'cancelled' || bookingStatus === 'declined') {
        // Booking cancelled/declined - payment failed
        paymentStatus = 'failed';
      } else if (['accepted', 'on_my_way', 'in-progress'].includes(bookingStatus)) {
        // Work in progress - payment was successful (otherwise booking wouldn't be in progress)
        paymentStatus = 'processing';
      } else if (['pending', 'confirmed'].includes(bookingStatus) && hasPaymentReference) {
        // If payment_reference exists, verify with Paystack to see if payment was actually successful
        // This handles cases where webhook hasn't fired yet
        // Only verify recent payments (within last 24 hours) to avoid unnecessary API calls
        const bookingDate = new Date(booking.created_at);
        const hoursSinceBooking = (Date.now() - bookingDate.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceBooking <= 24) {
          // Recent booking - verify with Paystack
          const paystackStatus = await verifyPaymentStatus(booking.payment_reference);
          if (paystackStatus === 'success') {
            // Payment was successful - update booking status and show as completed
            paymentStatus = 'completed';
            // Update booking status in database (fire and forget)
            (async () => {
              try {
                await supabase
                  .from('bookings')
                  .update({ status: 'completed', updated_at: new Date().toISOString() })
                  .eq('id', booking.id);
                console.log(`✅ Updated booking ${booking.id} to completed after Paystack verification`);
              } catch (err) {
                console.error(`❌ Error updating booking ${booking.id}:`, err);
              }
            })();
          } else if (paystackStatus === 'failed') {
            paymentStatus = 'failed';
          } else {
            // Unknown status - show as processing (payment initiated but not confirmed)
            paymentStatus = 'processing';
          }
        } else {
          // Old booking - assume processing (webhook should have fired by now, but show as processing to be safe)
          paymentStatus = 'processing';
        }
      } else if (['pending', 'confirmed'].includes(bookingStatus)) {
        // No payment_reference - no payment yet
        paymentStatus = 'pending';
      } else if (bookingStatus === 'reschedule_requested') {
        // Awaiting reschedule - payment status depends on whether payment was made
        paymentStatus = hasPaymentReference ? 'processing' : 'pending';
      } else {
        // Default: if payment_reference exists, assume processing, otherwise pending
        paymentStatus = hasPaymentReference ? 'processing' : 'pending';
      }
      
      return {
        id: booking.id,
        booking_id: booking.id,
        customer_name: booking.customer_name || 'Unknown Customer',
        amount: booking.total_amount || 0,
        payment_method: 'card', // Default payment method
        status: paymentStatus,
        transaction_id: booking.payment_reference || null,
        created_at: booking.created_at,
      };
    }));

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      ok: true,
      payments,
      total: count || 0,
      totalPages,
    });
  } catch (error: any) {
    console.error('Error in payments GET API:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}


