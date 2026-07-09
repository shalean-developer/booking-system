import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

type Svc = SupabaseClient<Database>;

export type MarketingStats = {
  /** Email rows that left "pending" successfully */
  emailDelivered: number;
  opened: number;
  clicked: number;
  whatsappSent: number;
  openRatePct: number;
  clickRatePct: number;
};

export async function getMarketingStats(svc: Svc): Promise<MarketingStats> {
  const { data: rows, error } = await svc.from('email_logs').select('status, channel');
  if (error || !rows?.length) {
    if (error) console.warn('[marketing] stats', error.message);
    return {
      emailDelivered: 0,
      opened: 0,
      clicked: 0,
      whatsappSent: 0,
      openRatePct: 0,
      clickRatePct: 0,
    };
  }

  let emailDelivered = 0;
  let opened = 0;
  let clicked = 0;
  let whatsappSent = 0;

  for (const r of rows) {
    if (r.channel === 'whatsapp' && r.status === 'sent') {
      whatsappSent += 1;
      continue;
    }
    if (r.channel !== 'email') continue;
    if (r.status === 'failed' || r.status === 'pending') continue;
    if (r.status === 'sent' || r.status === 'opened' || r.status === 'clicked') {
      emailDelivered += 1;
    }
    if (r.status === 'opened' || r.status === 'clicked') opened += 1;
    if (r.status === 'clicked') clicked += 1;
  }

  const openRatePct = emailDelivered > 0 ? Math.round((opened / emailDelivered) * 1000) / 10 : 0;
  const clickRatePct = emailDelivered > 0 ? Math.round((clicked / emailDelivered) * 1000) / 10 : 0;

  return {
    emailDelivered,
    opened,
    clicked,
    whatsappSent,
    openRatePct,
    clickRatePct,
  };
}
