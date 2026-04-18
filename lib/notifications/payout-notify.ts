/**
 * Payout outcomes: audit log (system) + optional WhatsApp when enabled.
 */

import { createServiceClient } from '@/lib/supabase-server';
import { sendWhatsAppTemplate } from './whatsapp';
import { logNotification } from './log';

function formatZar(cents: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
  }).format(Math.round(cents) / 100);
}

export async function notifyCleanerPayoutOutcome(params: {
  cleanerId: string;
  success: boolean;
  amountCents: number;
  idempotencyKey: string;
  paystackReference?: string | null;
  reason?: string | null;
}): Promise<void> {
  const supabase = createServiceClient();

  const { data: cleaner, error: cErr } = await supabase
    .from('cleaners')
    .select('id, name, phone')
    .eq('id', params.cleanerId)
    .maybeSingle();

  if (cErr || !cleaner) {
    await logNotification({
      channel: 'system',
      template: params.success ? 'payout_completed' : 'payout_failed',
      recipient_type: 'cleaner',
      payload: {
        error: 'cleaner_not_found',
        cleaner_id: params.cleanerId,
        idempotency_key: params.idempotencyKey,
      },
      ok: false,
      error: cErr?.message ?? 'cleaner not found',
    });
    return;
  }

  const { data: prefs } = await supabase
    .from('notification_preferences')
    .select('whatsapp_opt_in, phone')
    .eq('cleaner_id', params.cleanerId)
    .maybeSingle();

  const phone = (prefs?.phone || cleaner.phone || '').trim();
  const whatsappEnabled = prefs?.whatsapp_opt_in === true;

  await logNotification({
    channel: 'system',
    template: params.success ? 'payout_transfer_success' : 'payout_transfer_failed',
    recipient_type: 'cleaner',
    recipient_phone: phone || null,
    payload: {
      cleaner_id: params.cleanerId,
      cleaner_name: cleaner.name,
      amount_cents: params.amountCents,
      amount_display: formatZar(params.amountCents),
      idempotency_key: params.idempotencyKey,
      paystack_reference: params.paystackReference ?? null,
      reason: params.reason ?? null,
      whatsapp_eligible: whatsappEnabled && !!phone,
    },
    ok: true,
  });

  if (!whatsappEnabled || !phone) {
    return;
  }

  const waPayload = {
    to: phone,
    template: params.success ? 'cleaner_payout_success' : 'cleaner_payout_failed',
    language: 'en',
    components: [
      {
        type: 'body' as const,
        parameters: [
          { type: 'text' as const, text: cleaner.name || 'there' },
          { type: 'text' as const, text: formatZar(params.amountCents) },
          { type: 'text' as const, text: params.paystackReference || '—' },
          { type: 'text' as const, text: (params.reason || '—').slice(0, 120) },
        ],
      },
    ],
  };

  const res = await sendWhatsAppTemplate(waPayload as Parameters<typeof sendWhatsAppTemplate>[0]);
  await logNotification({
    channel: 'whatsapp',
    template: waPayload.template,
    recipient_type: 'cleaner',
    recipient_phone: phone,
    payload: waPayload,
    ok: res.ok,
    status: res.status ?? null,
    error: res.error ?? null,
  });
}
