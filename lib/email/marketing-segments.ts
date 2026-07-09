import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export type CampaignSegment =
  | 'all_users'
  | 'no_bookings'
  | 'active_users'
  | 'inactive_users';

type Svc = SupabaseClient<Database>;

export type CampaignRecipient = { email: string; name: string | null };

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

/**
 * Subscribed rows from `email_subscribers`, filtered by segment (batched fetch).
 */
export async function fetchCampaignRecipients(
  svc: Svc,
  segment: CampaignSegment,
): Promise<CampaignRecipient[]> {
  const { data: subs, error: subsError } = await svc
    .from('email_subscribers')
    .select('email, name, subscribed')
    .eq('subscribed', true);
  if (subsError || !subs?.length) {
    if (subsError) console.warn('[marketing] fetchCampaignRecipients subs', subsError.message);
    return [];
  }

  const emails = subs.map((s) => s.email.trim().toLowerCase()).filter(Boolean);
  if (segment === 'all_users') {
    return subs.map((s) => ({ email: s.email, name: s.name }));
  }

  const customers: { id: string; email: string | null; total_bookings: number | null }[] = [];
  const chunkSize = 120;
  for (let i = 0; i < emails.length; i += chunkSize) {
    const slice = emails.slice(i, i + chunkSize);
    const { data: chunk, error: custError } = await svc
      .from('customers')
      .select('id, email, total_bookings')
      .in('email', slice);
    if (custError) {
      console.warn('[marketing] fetchCampaignRecipients customers', custError.message);
      return [];
    }
    if (chunk?.length) customers.push(...chunk);
  }

  const byEmail = new Map<string, { id: string; total_bookings: number | null }>();
  for (const c of customers || []) {
    const e = (c.email || '').trim().toLowerCase();
    if (e) byEmail.set(e, { id: c.id, total_bookings: c.total_bookings });
  }

  const inactiveCutoff = daysAgoIso(30);

  async function lastBookingDate(customerId: string): Promise<string | null> {
    const { data: rows } = await svc
      .from('bookings')
      .select('booking_date')
      .eq('customer_id', customerId)
      .in('status', ['paid', 'completed', 'accepted', 'assigned', 'on_my_way', 'arrived', 'in-progress'])
      .order('booking_date', { ascending: false })
      .limit(1);
    const r = rows?.[0]?.booking_date;
    return typeof r === 'string' ? r : null;
  }

  const out: CampaignRecipient[] = [];

  for (const s of subs) {
    const e = s.email.trim().toLowerCase();
    const cust = byEmail.get(e);

    if (segment === 'no_bookings') {
      if (!cust || (cust.total_bookings ?? 0) < 1) {
        out.push({ email: s.email, name: s.name });
      }
      continue;
    }

    if (segment === 'active_users') {
      if (cust && (cust.total_bookings ?? 0) >= 1) {
        out.push({ email: s.email, name: s.name });
      }
      continue;
    }

    if (segment === 'inactive_users') {
      if (!cust || (cust.total_bookings ?? 0) < 1) continue;
      const last = await lastBookingDate(cust.id);
      if (last && last < inactiveCutoff) {
        out.push({ email: s.email, name: s.name });
      }
    }
  }

  return out;
}
