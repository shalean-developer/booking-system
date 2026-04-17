import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient, isAdmin } from '@/lib/supabase-server';
import { paystackVerifyDetailed } from '@/lib/booking-paid-server';

export const dynamic = 'force-dynamic';

/** Paystack reference for verification (prefer explicit payment_reference). */
function paystackReferenceForBooking(b: {
  payment_reference?: string | null;
  paystack_ref?: string | null;
}): string {
  const a = (b.payment_reference ?? '').trim();
  const c = (b.paystack_ref ?? '').trim();
  return a || c;
}

export async function GET(request: NextRequest) {
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });
    }

    let supabase;
    try {
      supabase = createServiceClient();
    } catch {
      supabase = await createClient();
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const skipPaystackVerify = searchParams.get('skip_verify') === '1';

    const paidOrRefFilter = 'payment_reference.not.is.null,paystack_ref.not.is.null';

    let query = supabase
      .from('bookings')
      .select(
        `
        id,
        customer_name,
        service_type,
        total_amount,
        payment_reference,
        paystack_ref,
        payment_status,
        status,
        created_at
      `
      )
      .or(paidOrRefFilter)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== 'all') {
      if (status === 'completed') {
        query = query.eq('status', 'completed');
      } else if (status === 'pending') {
        query = query.in('status', ['pending', 'confirmed', 'reschedule_requested']);
      } else if (status === 'processing') {
        query = query.in('status', ['accepted', 'on_my_way', 'in-progress']);
      } else if (status === 'failed') {
        query = query.in('status', ['cancelled', 'declined']);
      } else {
        query = query.eq('status', status);
      }
    }

    if (search) {
      query = query.or(
        `customer_name.ilike.%${search}%,payment_reference.ilike.%${search}%,paystack_ref.ilike.%${search}%`
      );
    }

    const { data: bookings, error } = await query;

    if (error) {
      console.error('Error fetching payments:', error);
      return NextResponse.json({ ok: false, error: 'Failed to fetch payments' }, { status: 500 });
    }

    let countQuery = supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .or(paidOrRefFilter);

    if (status && status !== 'all') {
      if (status === 'completed') {
        countQuery = countQuery.eq('status', 'completed');
      } else if (status === 'pending') {
        countQuery = countQuery.in('status', ['pending', 'confirmed', 'reschedule_requested']);
      } else if (status === 'processing') {
        countQuery = countQuery.in('status', ['accepted', 'on_my_way', 'in-progress']);
      } else if (status === 'failed') {
        countQuery = countQuery.in('status', ['cancelled', 'declined']);
      } else {
        countQuery = countQuery.eq('status', status);
      }
    }

    if (search) {
      countQuery = countQuery.or(
        `customer_name.ilike.%${search}%,payment_reference.ilike.%${search}%,paystack_ref.ilike.%${search}%`
      );
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Error fetching payment count:', countError);
    }

    const secret = process.env.PAYSTACK_SECRET_KEY?.trim();

    const payments = await Promise.all(
      (bookings || []).map(async (booking: Record<string, unknown>) => {
        let paymentStatus: string;
        const bookingStatus = String(booking.status ?? '')
          .toLowerCase()
          .trim();
        const ps = String(booking.payment_status ?? '')
          .toLowerCase()
          .trim();
        const ref = paystackReferenceForBooking({
          payment_reference: booking.payment_reference as string | null,
          paystack_ref: booking.paystack_ref as string | null,
        });
        const hasRef = ref.length > 0;

        if (ps === 'success' || ps === 'paid') {
          paymentStatus = 'completed';
        } else if (ps === 'failed') {
          paymentStatus = 'failed';
        } else if (bookingStatus === 'paid') {
          paymentStatus = 'completed';
        } else if (bookingStatus === 'completed') {
          paymentStatus = 'completed';
        } else if (bookingStatus === 'cancelled' || bookingStatus === 'declined') {
          paymentStatus = 'failed';
        } else if (['accepted', 'on_my_way', 'in-progress'].includes(bookingStatus)) {
          paymentStatus = 'processing';
        } else if (
          ['pending', 'confirmed'].includes(bookingStatus) &&
          hasRef &&
          secret &&
          !skipPaystackVerify
        ) {
          const detailed = await paystackVerifyDetailed(secret, ref);
          if (detailed.outcome === 'success') {
            paymentStatus = 'completed';
            (async () => {
              try {
                const svc = createServiceClient();
                await svc
                  .from('bookings')
                  .update({
                    payment_status: 'success',
                    status: 'paid',
                    payment_reference:
                      ((booking.payment_reference as string | null) ?? '').trim() || ref,
                    paystack_ref: ((booking.paystack_ref as string | null) ?? '').trim() || ref,
                    updated_at: new Date().toISOString(),
                  })
                  .eq('id', booking.id);
              } catch (err) {
                console.error(`[admin/payments] backfill paid fields ${booking.id}:`, err);
              }
            })();
          } else if (detailed.outcome === 'failed') {
            paymentStatus = 'failed';
          } else {
            paymentStatus = 'processing';
          }
        } else if (['pending', 'confirmed'].includes(bookingStatus) && hasRef) {
          paymentStatus = 'processing';
        } else if (['pending', 'confirmed'].includes(bookingStatus)) {
          paymentStatus = 'pending';
        } else if (bookingStatus === 'reschedule_requested') {
          paymentStatus = hasRef ? 'processing' : 'pending';
        } else {
          paymentStatus = hasRef ? 'processing' : 'pending';
        }

        return {
          id: booking.id,
          booking_id: booking.id,
          customer_name: (booking.customer_name as string) || 'Unknown Customer',
          service_type: (booking.service_type as string) || null,
          amount: (booking.total_amount as number) || 0,
          payment_method: 'card',
          status: paymentStatus,
          transaction_id: ref || null,
          created_at: booking.created_at,
        };
      })
    );

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      ok: true,
      payments,
      total: count || 0,
      totalPages,
    });
  } catch (error: unknown) {
    console.error('Error in payments GET API:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
