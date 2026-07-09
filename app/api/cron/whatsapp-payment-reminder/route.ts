import { NextRequest, NextResponse } from 'next/server';
import { requireCronSecret } from '@/lib/cron-secret';
import { createServiceClient } from '@/lib/supabase-server';
import { sendWhatsApp } from '@/lib/whatsapp/send';
import { initializePaystackForWhatsAppBooking } from '@/lib/whatsapp/init-paystack-for-booking';
import { resolvePublicBaseUrlFromEnv } from '@/lib/public-base-url';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const REMINDER_AFTER_MS = 30 * 60 * 1000;

export async function GET(req: NextRequest) {
  const unauthorized = requireCronSecret(req);
  if (unauthorized) return unauthorized;

  try {
    const supabase = createServiceClient();
    const { data: rows, error } = await supabase
      .from('whatsapp_booking_sessions')
      .select('id, phone_e164, data, step')
      .eq('step', 'payment_pending');

    if (error) {
      console.error('[cron] whatsapp-payment-reminder query', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const base = resolvePublicBaseUrlFromEnv();
    let reminders = 0;
    let cleaned = 0;

    for (const row of rows || []) {
      const data = (row.data || {}) as Record<string, unknown>;
      if (data.payment_reminder_sent === true) continue;

      const sentAt = data.payment_link_sent_at;
      if (!sentAt || typeof sentAt !== 'string') continue;

      const t = new Date(sentAt).getTime();
      if (!Number.isFinite(t) || Date.now() - t < REMINDER_AFTER_MS) continue;

      const bookingId = typeof data.lastBookingId === 'string' ? data.lastBookingId : '';
      if (!bookingId) continue;

      const { data: booking } = await supabase
        .from('bookings')
        .select('id, status')
        .eq('id', bookingId)
        .maybeSingle();

      if (!booking) {
        await supabase
          .from('whatsapp_booking_sessions')
          .update({
            step: 'start',
            data: {},
            updated_at: new Date().toISOString(),
          })
          .eq('id', row.id);
        cleaned += 1;
        continue;
      }

      if (String(booking.status).toLowerCase() !== 'pending') {
        await supabase
          .from('whatsapp_booking_sessions')
          .update({
            step: 'completed',
            data: { ...data, lastBookingId: bookingId, auto_completed: true },
            updated_at: new Date().toISOString(),
          })
          .eq('id', row.id);
        cleaned += 1;
        continue;
      }

      const init = await initializePaystackForWhatsAppBooking({
        bookingId,
        phoneE164: row.phone_e164,
      });

      const msg = init.ok
        ? `Reminder: booking ${bookingId} is still unpaid.\nPay now:\n${init.authorization_url}`
        : `Reminder: complete payment for ${bookingId}.\n${base || 'https://shalean.com'}/dashboard`;

      const send = await sendWhatsApp({ to: row.phone_e164, message: msg });
      if (!send.ok) {
        console.warn('[cron] whatsapp reminder send failed', row.phone_e164, send.error);
        continue;
      }

      await supabase
        .from('whatsapp_booking_sessions')
        .update({
          data: { ...data, payment_reminder_sent: true },
          updated_at: new Date().toISOString(),
        })
        .eq('id', row.id);

      reminders += 1;
    }

    return NextResponse.json({ ok: true, reminders, cleaned, scanned: (rows || []).length });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error('[cron] whatsapp-payment-reminder', msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
