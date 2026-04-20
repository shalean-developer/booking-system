import type { SupabaseClient } from '@supabase/supabase-js';
import { ymdTodayInBusinessTz } from '@/lib/admin-dashboard-business-range';
import { fetchSurgeDemandCounts, ACTIVE_BOOKING_STATUSES } from '@/lib/pricing/surge-demand-server';
import { fetchForecastBookingsScalarForSurge } from '@/lib/pricing/forecast-demand-server';
import {
  computeDemandRatio,
  detectSupplyShortage,
  fetchAndRankSupplyCandidates,
  type ShortageLevel,
} from '@/lib/supply/activation';
import { notifyCleaner } from '@/lib/notifications/cleaner-alerts';

const MAX_NOTIFIED_PER_RUN = 25;

export type SupplyCheckResult = {
  shortage: ShortageLevel;
  demandRatio: number;
  effectiveBookings: number;
  availableCleaners: number;
  notified: number;
  areaLabels: string[];
};

async function resolveTargetAreas(
  supabase: SupabaseClient,
  todayYmd: string,
  opts?: { suburb?: string | null; city?: string | null },
): Promise<Array<{ suburb: string | null; city: string | null; label: string }>> {
  if (opts?.suburb?.trim() || opts?.city?.trim()) {
    return [
      {
        suburb: opts.suburb?.trim() ?? null,
        city: opts.city?.trim() ?? null,
        label: [opts.suburb, opts.city].filter(Boolean).join(', ') || 'Your area',
      },
    ];
  }

  const { data: rows } = await supabase
    .from('bookings')
    .select('address_suburb, address_city')
    .eq('booking_date', todayYmd)
    .in('status', [...ACTIVE_BOOKING_STATUSES]);

  const map = new Map<
    string,
    { suburb: string | null; city: string | null; n: number }
  >();
  for (const r of rows ?? []) {
    const suburb = (r as { address_suburb?: string | null }).address_suburb?.trim() || null;
    const city = (r as { address_city?: string | null }).address_city?.trim() || null;
    const key = `${suburb ?? ''}|${city ?? ''}`;
    if (!suburb && !city) continue;
    const cur = map.get(key) ?? { suburb, city, n: 0 };
    cur.n += 1;
    map.set(key, cur);
  }

  const hotspots = [...map.values()]
    .sort((a, b) => b.n - a.n)
    .slice(0, 8)
    .map((h) => ({
      suburb: h.suburb,
      city: h.city,
      label: [h.suburb, h.city].filter(Boolean).join(', ') || 'Area',
    }));

  return hotspots;
}

/**
 * When forecast + real-time demand exceed supply, notify ranked cleaners (throttled).
 * Call from cron (all hotspot areas) or after a booking (specific suburb/city).
 */
export async function runSupplyActivationCheck(
  supabase: SupabaseClient,
  opts?: { suburb?: string | null; city?: string | null },
): Promise<SupplyCheckResult> {
  const todayYmd = ymdTodayInBusinessTz();
  const counts = await fetchSurgeDemandCounts(supabase, { date: todayYmd });
  const forecast = await fetchForecastBookingsScalarForSurge(supabase);
  const effectiveBookings = Math.max(
    counts.active_bookings,
    Math.ceil(forecast ?? 0),
  );
  const shortage = detectSupplyShortage({
    bookings: effectiveBookings,
    availableCleaners: counts.available_cleaners,
  });
  const demandRatio = computeDemandRatio(effectiveBookings, counts.available_cleaners);

  const areaLabels: string[] = [];
  let notified = 0;

  if (shortage === 'none') {
    console.log('[supply]', {
      area: opts?.suburb || opts?.city || '—',
      demandRatio,
      shortage,
      cleaners_notified: 0,
    });
    return {
      shortage,
      demandRatio,
      effectiveBookings,
      availableCleaners: counts.available_cleaners,
      notified: 0,
      areaLabels: [],
    };
  }

  const targets = await resolveTargetAreas(supabase, todayYmd, opts);
  if (targets.length === 0) {
    console.log('[supply]', {
      area: '—',
      demandRatio,
      shortage,
      cleaners_notified: 0,
    });
    return {
      shortage,
      demandRatio,
      effectiveBookings,
      availableCleaners: counts.available_cleaners,
      notified: 0,
      areaLabels: [],
    };
  }

  const seenCleaner = new Set<string>();
  const level: 'medium' | 'high' = shortage === 'high' ? 'high' : 'medium';

  for (const t of targets) {
    areaLabels.push(t.label);
    const ranked = await fetchAndRankSupplyCandidates(supabase, {
      dateYmd: todayYmd,
      suburb: t.suburb,
      city: t.city,
      limit: 20,
    });

    for (const row of ranked) {
      if (notified >= MAX_NOTIFIED_PER_RUN) break;
      const id = row.cleaner.id;
      if (seenCleaner.has(id)) continue;
      seenCleaner.add(id);

      const res = await notifyCleaner(
        supabase,
        {
          id: row.cleaner.id,
          name: row.cleaner.name,
          phone: row.cleaner.phone,
          email: row.cleaner.email,
        },
        level,
        { areaLabel: t.label, demandRatio },
      );
      if (res.ok) notified += 1;
    }
  }

  console.log('[supply]', {
    area: areaLabels.join('; ') || opts?.suburb || opts?.city || '—',
    demandRatio,
    shortage,
    cleaners_notified: notified,
  });

  return {
    shortage,
    demandRatio,
    effectiveBookings,
    availableCleaners: counts.available_cleaners,
    notified,
    areaLabels,
  };
}
