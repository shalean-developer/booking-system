import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { sendWhatsApp } from '@/lib/whatsapp/send';
import { resolvePublicBaseUrlFromEnv } from '@/lib/public-base-url';

function normalizePhoneE164(phone: string): string | null {
  const t = phone.trim().replace(/\s/g, '');
  if (t.startsWith('+') && /^\+\d{8,15}$/.test(t)) return t;
  return null;
}

/**
 * Idempotent WhatsApp "payment received" ping after Paystack webhook finalizes the booking.
 */
export async function sendWhatsAppPaymentConfirmedIfEligible(params: {
  supabase: SupabaseClient<Database>;
  bookingId: string;
  phoneE164: string;
  paymentReference: string;
}): Promise<{ sent: boolean; reason?: string }> {
  const phone = normalizePhoneE164(params.phoneE164);
  if (!phone) {
    return { sent: false, reason: 'invalid_phone' };
  }

  const { error: insertErr } = await params.supabase.from('whatsapp_payment_notifications').insert({
    booking_id: params.bookingId,
    kind: 'paid_confirmation',
  });

  if (insertErr) {
    const code = (insertErr as { code?: string }).code;
    if (code === '23505') {
      return { sent: false, reason: 'already_sent' };
    }
    console.error('[whatsapp_payment_notifications] insert', insertErr);
    return { sent: false, reason: 'db_error' };
  }

  const base = resolvePublicBaseUrlFromEnv() || 'https://shalean.com';
  const msg = [
    `Payment received — you're all set.`,
    `Booking: ${params.bookingId}`,
    `Ref: ${params.paymentReference}`,
    `Manage: ${base}/dashboard`,
    `Type BOOK anytime to make another reservation.`,
  ].join('\n');

  const res = await sendWhatsApp({ to: phone, message: msg });
  if (!res.ok) {
    console.error('[whatsapp] payment confirm send', res.error);
    await params.supabase.from('whatsapp_payment_notifications').delete().eq('booking_id', params.bookingId);
    return { sent: false, reason: res.error };
  }

  return { sent: true };
}
