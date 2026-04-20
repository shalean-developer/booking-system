import type { SupabaseClient } from '@supabase/supabase-js';
import { ymdTodayInBusinessTz } from '@/lib/admin-dashboard-business-range';
import { sendWhatsAppTemplate } from '@/lib/notifications/whatsapp';
import { logNotification } from '@/lib/notifications/log';
import { sendEmail, validateResendConfig } from '@/lib/email/send';

const MAX_ALERTS_PER_CLEANER_PER_DAY = 2;
const MIN_HOURS_BETWEEN_ALERTS = 2;

export const SUPPLY_MESSAGE_MEDIUM = 'High demand in your area — jobs available now';

export const SUPPLY_MESSAGE_HIGH =
  '🔥 High demand! Earn more — bookings waiting in your area';

export function messageForShortage(level: 'medium' | 'high'): string {
  return level === 'high' ? SUPPLY_MESSAGE_HIGH : SUPPLY_MESSAGE_MEDIUM;
}

/**
 * Throttle: max 2 per cleaner per calendar day (business TZ); min 2h between sends.
 */
export async function canSendSupplyAlert(
  supabase: SupabaseClient,
  cleanerId: string,
): Promise<boolean> {
  const twoHoursAgo = new Date(Date.now() - MIN_HOURS_BETWEEN_ALERTS * 60 * 60 * 1000).toISOString();
  const { data: recent } = await supabase
    .from('cleaner_notifications')
    .select('id')
    .eq('cleaner_id', cleanerId)
    .gte('sent_at', twoHoursAgo)
    .limit(1);
  if (recent && recent.length > 0) return false;

  const ymd = ymdTodayInBusinessTz();
  const dayStart = new Date(`${ymd}T00:00:00+02:00`).toISOString();
  const { count } = await supabase
    .from('cleaner_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('cleaner_id', cleanerId)
    .gte('sent_at', dayStart);
  if ((count ?? 0) >= MAX_ALERTS_PER_CLEANER_PER_DAY) return false;
  return true;
}

export type NotifyCleanerInput = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
};

/**
 * Push/SMS/email: WhatsApp template when opted in; email fallback; logs to `notification_logs` and `cleaner_notifications` on success.
 */
export async function notifyCleaner(
  supabase: SupabaseClient,
  cleaner: NotifyCleanerInput,
  shortageLevel: 'medium' | 'high',
  opts: { areaLabel: string; demandRatio: number },
): Promise<{ ok: boolean; channel: string }> {
  const message = messageForShortage(shortageLevel);

  if (!(await canSendSupplyAlert(supabase, cleaner.id))) {
    return { ok: false, channel: 'throttled' };
  }

  const { data: prefs } = await supabase
    .from('notification_preferences')
    .select('whatsapp_opt_in, phone')
    .eq('cleaner_id', cleaner.id)
    .maybeSingle();

  const phone = (prefs?.phone || cleaner.phone || '').trim();
  const whatsappOptIn = prefs?.whatsapp_opt_in === true;

  let channel = 'none';
  let sendOk = false;

  if (whatsappOptIn && phone) {
    const res = await sendWhatsAppTemplate({
      to: phone,
      template: 'supply_area_demand',
      language: 'en',
      components: [
        {
          type: 'body',
          parameters: [{ type: 'text', text: message }],
        },
      ],
    });
    await logNotification({
      channel: 'whatsapp',
      template: 'supply_area_demand',
      recipient_type: 'cleaner',
      recipient_phone: phone,
      payload: { message, shortageLevel, area: opts.areaLabel },
      ok: res.ok,
      status: res.status ?? null,
      error: res.error ?? null,
    });
    if (res.ok && !res.skipped) {
      channel = 'whatsapp';
      sendOk = true;
    }
  }

  if (!sendOk && cleaner.email?.trim()) {
    const cfg = validateResendConfig();
    if (cfg.ok) {
      try {
        await sendEmail({
          to: cleaner.email.trim(),
          subject: 'Shalean — high demand in your area',
          html: `<p>Hi ${cleaner.name || 'there'},</p><p>${message}</p><p>Go available in the app to pick up jobs near you.</p>`,
        });
        channel = 'email';
        sendOk = true;
        await logNotification({
          channel: 'email',
          template: 'supply_area_demand',
          recipient_type: 'cleaner',
          recipient_email: cleaner.email,
          payload: { message, shortageLevel },
          ok: true,
        });
      } catch (e) {
        await logNotification({
          channel: 'email',
          template: 'supply_area_demand',
          recipient_type: 'cleaner',
          recipient_email: cleaner.email,
          payload: { message },
          ok: false,
          error: e instanceof Error ? e.message : 'email failed',
        });
      }
    }
  }

  if (sendOk) {
    await supabase.from('cleaner_notifications').insert({
      cleaner_id: cleaner.id,
      message,
      shortage_level: shortageLevel,
      area_label: opts.areaLabel,
      demand_ratio: opts.demandRatio,
      channel,
      metadata: { push: 'not_configured' },
    });
  }

  return { ok: sendOk, channel };
}
