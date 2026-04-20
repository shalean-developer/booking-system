/**
 * Invite / notify cleaners when a slot shows labour shortage.
 * Reuses ranked candidates + throttled `notifyCleaner` (WhatsApp / email).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { fetchAndRankSupplyCandidates } from '@/lib/supply/activation';
import { notifyCleaner } from '@/lib/notifications/cleaner-alerts';

const MAX_INVITES_PER_CALL = 20;

function shortageLevelFromHours(shortage_hours: number): 'medium' | 'high' | null {
  if (shortage_hours <= 0) return null;
  if (shortage_hours >= 12) return 'high';
  return 'medium';
}

export type InviteCleanersParams = {
  suburb: string | null;
  city: string | null;
  /** YYYY-MM-DD */
  dateYmd: string;
  /** HH:mm */
  time: string;
  shortage_hours: number;
};

export type InviteCleanersResult = {
  notified: number;
  candidates: number;
  skipped: number;
  level: 'medium' | 'high' | null;
};

/**
 * Find cleaners in the area, prioritize rating / proximity / workload (via `fetchAndRankSupplyCandidates`),
 * send supply alerts with existing anti-spam rules (`canSendSupplyAlert` inside `notifyCleaner`).
 */
export async function inviteCleaners(
  supabase: SupabaseClient,
  params: InviteCleanersParams
): Promise<InviteCleanersResult> {
  const level = shortageLevelFromHours(params.shortage_hours);
  if (!level) {
    return { notified: 0, candidates: 0, skipped: 0, level: null };
  }

  const ranked = await fetchAndRankSupplyCandidates(supabase, {
    dateYmd: params.dateYmd,
    suburb: params.suburb,
    city: params.city,
    limit: MAX_INVITES_PER_CALL,
  });

  const areaLabel = [params.suburb, params.city].filter(Boolean).join(', ') || 'Your area';
  const demandRatio = 1 + Math.min(2, Math.max(0, params.shortage_hours / 16));

  let notified = 0;
  let skipped = 0;

  for (const row of ranked) {
    if (notified >= MAX_INVITES_PER_CALL) break;
    const res = await notifyCleaner(
      supabase,
      {
        id: row.cleaner.id,
        name: row.cleaner.name,
        phone: row.cleaner.phone,
        email: row.cleaner.email,
      },
      level,
      { areaLabel, demandRatio }
    );
    if (res.ok) notified += 1;
    else skipped += 1;
  }

  return {
    notified,
    candidates: ranked.length,
    skipped,
    level,
  };
}
