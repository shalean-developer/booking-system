import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { nudgeEmail, reengagementEmail } from '@/emails/templates';
import { MARKETING_EVENT } from '@/lib/email/marketing-events';
import {
  deliverSmartMessage,
  reengagementWhatsAppMessage,
} from '@/lib/marketing/delivery';
import { htmlToPlainText } from '@/lib/marketing/html-to-text';

type Svc = SupabaseClient<Database>;

const NUDGE_HOURS = 48;
const REENGAGE_DAYS = 30;

function isoHoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function ymdDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

async function loadCustomerByAuthUserId(
  svc: Svc,
  userId: string,
): Promise<{ email: string; first_name: string | null; last_name: string | null } | null> {
  const { data } = await svc
    .from('customers')
    .select('email, first_name, last_name')
    .eq('auth_user_id', userId)
    .maybeSingle();
  return data ?? null;
}

async function claimMarketingEvent(svc: Svc, userId: string, eventType: string): Promise<boolean> {
  const { error } = await svc.from('email_events').insert({ user_id: userId, event_type: eventType });
  if (!error) return true;
  if (error.code === '23505') return false;
  console.warn('[marketing] claimMarketingEvent', eventType, error.message);
  return false;
}

/**
 * Automated lifecycle emails (cron). Idempotent via partial unique indexes on email_events.
 */
export async function runMarketingEmailTriggers(svc: Svc): Promise<{
  nudgeSent: number;
  reengagementSent: number;
}> {
  let nudgeSent = 0;
  let reengagementSent = 0;

  const signupCutoff = isoHoursAgo(NUDGE_HOURS);

  const { data: signups, error: signupsErr } = await svc
    .from('email_events')
    .select('user_id, created_at')
    .eq('event_type', MARKETING_EVENT.signup);

  if (signupsErr) {
    console.warn('[marketing] cron signups', signupsErr.message);
    return { nudgeSent: 0, reengagementSent: 0 };
  }

  const signupByUser = new Map<string, string>();
  for (const row of signups || []) {
    const uid = row.user_id;
    const prev = signupByUser.get(uid);
    const t = row.created_at;
    if (!prev || t < prev) signupByUser.set(uid, t);
  }

  const { data: booked } = await svc
    .from('email_events')
    .select('user_id')
    .eq('event_type', MARKETING_EVENT.bookingCreated);

  const bookedSet = new Set((booked || []).map((r) => r.user_id));

  for (const [userId, firstSignupAt] of signupByUser) {
    if (firstSignupAt >= signupCutoff) continue;
    if (bookedSet.has(userId)) continue;

    const cust = await loadCustomerByAuthUserId(svc, userId);
    if (!cust?.email) {
      continue;
    }

    const { data: sub } = await svc
      .from('email_subscribers')
      .select('subscribed')
      .eq('email', cust.email.trim().toLowerCase())
      .maybeSingle();
    if (sub && sub.subscribed === false) {
      continue;
    }

    const claimed = await claimMarketingEvent(svc, userId, MARKETING_EVENT.marketingNudgeSent);
    if (!claimed) continue;

    const name = [cust.first_name, cust.last_name].filter(Boolean).join(' ').trim() || 'there';
    const html = nudgeEmail(name, cust.email);
    const r = await deliverSmartMessage(svc, {
      userId,
      email: cust.email,
      subject: 'Ready to book your first clean?',
      html,
      whatsappBody: htmlToPlainText(html).slice(0, 1600),
    });
    if (r.ok) {
      nudgeSent += 1;
      console.log('[marketing] nudge sent', { userId, channel: r.channel });
    } else {
      console.warn('[marketing] nudge send failed', r.error);
    }
  }

  const inactiveCutoff = ymdDaysAgo(REENGAGE_DAYS);

  const { data: customers, error: custErr } = await svc
    .from('customers')
    .select('id, auth_user_id, email, first_name, last_name, total_bookings')
    .not('auth_user_id', 'is', null)
    .gte('total_bookings', 1);

  if (custErr) {
    console.warn('[marketing] cron customers', custErr.message);
    return { nudgeSent, reengagementSent };
  }

  for (const c of customers || []) {
    const authId = c.auth_user_id;
    if (!authId || !c.email) continue;

    const { data: lastRows } = await svc
      .from('bookings')
      .select('booking_date')
      .eq('customer_id', c.id)
      .order('booking_date', { ascending: false })
      .limit(1);
    const last = lastRows?.[0]?.booking_date;
    if (typeof last !== 'string' || last >= inactiveCutoff) continue;

    const { data: sub } = await svc
      .from('email_subscribers')
      .select('subscribed')
      .eq('email', c.email.trim().toLowerCase())
      .maybeSingle();
    if (sub && sub.subscribed === false) continue;

    const claimed = await claimMarketingEvent(svc, authId, MARKETING_EVENT.marketingReengagementSent);
    if (!claimed) continue;

    const name = [c.first_name, c.last_name].filter(Boolean).join(' ').trim() || 'there';
    const html = reengagementEmail(name, c.email);
    const r = await deliverSmartMessage(svc, {
      userId: authId,
      email: c.email,
      subject: 'Book a fresh clean with Shalean',
      html,
      whatsappBody: reengagementWhatsAppMessage(name),
    });
    if (r.ok) {
      reengagementSent += 1;
      console.log('[marketing] re-engagement sent', { userId: authId, channel: r.channel });
    } else {
      console.warn('[marketing] re-engagement send failed', r.error);
    }
  }

  return { nudgeSent, reengagementSent };
}
