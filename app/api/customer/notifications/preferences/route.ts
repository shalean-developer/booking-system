import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const bookingId: string = body.bookingId;
    const email: string = (body.email || '').toLowerCase().trim();
    const whatsapp_opt_in: boolean = !!body.whatsapp_opt_in;

    if (!bookingId || !email) {
      return NextResponse.json({ ok: false, error: 'bookingId and email are required' }, { status: 400 });
    }

    const svc = createServiceClient();

    // Verify booking and email match
    const { data: booking, error } = await svc
      .from('bookings')
      .select('id, customer_id, customer_email')
      .eq('id', bookingId)
      .maybeSingle();

    if (error || !booking) {
      return NextResponse.json({ ok: false, error: 'Booking not found' }, { status: 404 });
    }

    if ((booking.customer_email || '').toLowerCase().trim() !== email) {
      return NextResponse.json({ ok: false, error: 'Email does not match booking' }, { status: 403 });
    }

    if (!booking.customer_id) {
      return NextResponse.json({ ok: false, error: 'No customer linked to booking' }, { status: 400 });
    }

    const { data: prefs, error: upsertError } = await svc
      .from('customer_notification_preferences')
      .upsert(
        { customer_id: booking.customer_id, whatsapp_opt_in, updated_at: new Date().toISOString() },
        { onConflict: 'customer_id' }
      )
      .select()
      .maybeSingle();

    if (upsertError) {
      return NextResponse.json({ ok: false, error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, preferences: prefs });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500 }
    );
  }
}


