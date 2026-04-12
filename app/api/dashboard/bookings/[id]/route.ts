import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase-server';

/**
 * Customer dashboard: cancel own booking (authenticated + ownership check).
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = await createClient();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !authUser) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    if (body?.action !== 'cancel') {
      return NextResponse.json({ ok: false, error: 'Unsupported action' }, { status: 400 });
    }

    const { id: bookingId } = await params;
    if (!bookingId) {
      return NextResponse.json({ ok: false, error: 'Booking id required' }, { status: 400 });
    }

    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('auth_user_id', authUser.id)
      .maybeSingle();

    if (customerError || !customer) {
      return NextResponse.json({ ok: false, error: 'Customer profile not found' }, { status: 404 });
    }

    const service = createServiceClient();
    const { data: booking, error: fetchError } = await service
      .from('bookings')
      .select('id, customer_id, status')
      .eq('id', bookingId)
      .maybeSingle();

    if (fetchError || !booking) {
      return NextResponse.json({ ok: false, error: 'Booking not found' }, { status: 404 });
    }

    if (booking.customer_id !== customer.id) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
    }

    const terminal = ['completed', 'cancelled', 'canceled', 'declined'];
    if (terminal.includes(String(booking.status || '').toLowerCase())) {
      return NextResponse.json(
        { ok: false, error: 'This booking can no longer be cancelled' },
        { status: 409 }
      );
    }

    const { error: updateError } = await service
      .from('bookings')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', bookingId);

    if (updateError) {
      console.error('Cancel booking error:', updateError);
      return NextResponse.json(
        { ok: false, error: 'Could not cancel booking', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, id: bookingId, status: 'cancelled' });
  } catch (e) {
    console.error('PATCH /api/dashboard/bookings/[id]', e);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
