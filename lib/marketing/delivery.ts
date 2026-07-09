import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { sendEmailSafe } from '@/lib/email/send';
import { wrapEmailHtmlForTracking } from '@/lib/marketing/tracking-html';
import { htmlToPlainText } from '@/lib/marketing/html-to-text';
import { sendWhatsApp, isWhatsAppConfigured } from '@/lib/whatsapp/send';
import { publicSiteBaseUrl } from '@/lib/booking-manage';

type Svc = SupabaseClient<Database>;

export async function resolveUserIdByEmail(svc: Svc, email: string): Promise<string | null> {
  const e = email.trim().toLowerCase();
  const { data } = await svc.from('customers').select('auth_user_id').eq('email', e).maybeSingle();
  const uid = data?.auth_user_id;
  return typeof uid === 'string' && uid ? uid : null;
}

type SubscriberPrefs = {
  prefers_whatsapp: boolean;
  whatsapp_number: string | null;
  subscribed: boolean;
};

export async function getSubscriberPrefs(svc: Svc, email: string): Promise<SubscriberPrefs | null> {
  const { data } = await svc
    .from('email_subscribers')
    .select('prefers_whatsapp, whatsapp_number, subscribed')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle();
  if (!data) return null;
  return {
    prefers_whatsapp: Boolean(data.prefers_whatsapp),
    whatsapp_number: data.whatsapp_number?.trim() || null,
    subscribed: data.subscribed !== false,
  };
}

/** Campaign or lifecycle: one row in email_logs; tracking only for email channel. */
export async function deliverSmartMessage(svc: Svc, params: {
  userId: string | null;
  email: string;
  subject: string;
  html: string;
  /** Plain text for WhatsApp when HTML is verbose */
  whatsappBody?: string;
  campaignId?: string | null;
}): Promise<{ ok: boolean; channel: 'email' | 'whatsapp'; error?: string }> {
  const prefs = await getSubscriberPrefs(svc, params.email);
  if (prefs && prefs.subscribed === false) {
    return { ok: false, channel: 'email', error: 'unsubscribed' };
  }

  const useWa =
    Boolean(prefs?.prefers_whatsapp) &&
    Boolean(prefs?.whatsapp_number?.trim()) &&
    isWhatsAppConfigured();

  if (useWa) {
    const body =
      params.whatsappBody?.trim() ||
      htmlToPlainText(params.html).slice(0, 4000) ||
      params.subject;
    const { data: inserted, error: insErr } = await svc
      .from('email_logs')
      .insert({
        user_id: params.userId,
        email: params.email.trim().toLowerCase(),
        subject: params.subject,
        status: 'pending',
        campaign_id: params.campaignId ?? null,
        channel: 'whatsapp',
      })
      .select('id')
      .single();

    if (insErr || !inserted?.id) {
      console.warn('[marketing] log insert', insErr?.message);
    }

    try {
      let wa = await sendWhatsApp({ to: prefs!.whatsapp_number!, message: body });
      if (!wa.ok) {
        await new Promise((r) => setTimeout(r, 400));
        wa = await sendWhatsApp({ to: prefs!.whatsapp_number!, message: body });
      }
      if (!wa.ok) {
        if (inserted?.id) {
          await svc.from('email_logs').update({ status: 'failed' }).eq('id', inserted.id);
        }
        return { ok: false, channel: 'whatsapp', error: wa.error };
      }
      if (inserted?.id) {
        await svc.from('email_logs').update({ status: 'sent' }).eq('id', inserted.id);
      }
      return { ok: true, channel: 'whatsapp' };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (inserted?.id) {
        await svc.from('email_logs').update({ status: 'failed' }).eq('id', inserted.id);
      }
      return { ok: false, channel: 'whatsapp', error: msg };
    }
  }

  const { data: inserted, error: insErr } = await svc
    .from('email_logs')
    .insert({
      user_id: params.userId,
      email: params.email.trim().toLowerCase(),
      subject: params.subject,
      status: 'pending',
      campaign_id: params.campaignId ?? null,
      channel: 'email',
    })
    .select('id')
    .single();

  if (insErr || !inserted?.id) {
    console.warn('[marketing] email log insert', insErr?.message);
    const r = await sendEmailSafe({
      to: params.email,
      subject: params.subject,
      html: params.html,
    });
    return { ok: r.success, channel: 'email', error: r.success ? undefined : r.error };
  }

  const trackedHtml = wrapEmailHtmlForTracking(params.html, inserted.id);

  let lastErr = 'send failed';
  for (let attempt = 0; attempt < 3; attempt++) {
    const result = await sendEmailSafe({
      to: params.email,
      subject: params.subject,
      html: trackedHtml,
    });
    if (result.success) {
      await svc.from('email_logs').update({ status: 'sent' }).eq('id', inserted.id);
      return { ok: true, channel: 'email' };
    }
    lastErr = result.error;
    if (attempt < 2) await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
  }
  await svc.from('email_logs').update({ status: 'failed' }).eq('id', inserted.id);
  return { ok: false, channel: 'email', error: lastErr };
}

export function bookingLink(): string {
  return `${publicSiteBaseUrl()}/book`;
}

export function welcomeWhatsAppMessage(name: string): string {
  const n = name.trim() || 'there';
  return `Hi ${n}, welcome to Shalean 👋 Book your first cleaning here: ${bookingLink()}`;
}

export function bookingConfirmedWhatsAppMessage(dateStr: string, timeStr?: string): string {
  const t = timeStr ? ` at ${timeStr}` : '';
  return `Your cleaning is confirmed for ${dateStr}${t}. We'll take care of the rest.`;
}

export function reengagementWhatsAppMessage(name: string): string {
  const n = name.trim() || 'there';
  return `It's been a while 👀 Ready for a fresh clean? Book here: ${bookingLink()}`;
}

export function repeatCustomerWhatsAppMessage(name: string): string {
  const n = name.trim() || 'there';
  return `Thanks ${n}! Ready for your next clean? Book here: ${bookingLink()}`;
}
