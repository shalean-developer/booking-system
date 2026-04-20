import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import {
  checkCleanerDay,
  dayOfWeekFromIsoDate,
  fetchEligibleCleanersForAreas,
  isCleanerFreeForInterval,
} from '@/lib/dispatch/cleaner-dispatch';
import { haversineKm, listIncludesArea, normalizeAreaLabel } from '@/lib/matching/geo';
import { timeRangeToMinutes } from '@/lib/matching/is-cleaner-free';

export type CleanerRow = Database['public']['Tables']['cleaners']['Row'];

export type FindAvailableCleanersInput = {
  date: string;
  area: string;
  lat: number | null;
  lng: number | null;
  startTime: string;
  endTime: string;
};

/** Prefer `working_areas` when set; otherwise legacy `areas`. */
export function effectiveWorkingAreas(c: CleanerRow): string[] {
  const wa = (c as { working_areas?: string[] | null }).working_areas;
  if (Array.isArray(wa) && wa.length > 0) return wa;
  return c.areas ?? [];
}

/**
 * Area list match OR radius from base / last location (when coordinates known).
 * If no coordinates: only named areas apply.
 */
export function cleanerCoversLocation(
  c: CleanerRow,
  area: string,
  lat: number | null,
  lng: number | null,
): boolean {
  const names = effectiveWorkingAreas(c);
  const areaOk = listIncludesArea(names, area);

  const radiusKmRaw = (c as { coverage_radius_km?: number | null }).coverage_radius_km;
  const radiusKm =
    typeof radiusKmRaw === 'number' && Number.isFinite(radiusKmRaw) && radiusKmRaw > 0
      ? Math.floor(radiusKmRaw)
      : 10;

  if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return areaOk;
  }

  const baseLat = (c as { base_latitude?: number | null }).base_latitude;
  const baseLng = (c as { base_longitude?: number | null }).base_longitude;
  const useBase =
    typeof baseLat === 'number' &&
    typeof baseLng === 'number' &&
    Number.isFinite(baseLat) &&
    Number.isFinite(baseLng);

  const lat1 = useBase ? baseLat! : c.last_location_lat ?? null;
  const lng1 = useBase ? baseLng! : c.last_location_lng ?? null;

  if (lat1 == null || lng1 == null || !Number.isFinite(lat1) || !Number.isFinite(lng1)) {
    return areaOk;
  }

  const dist = haversineKm(lat1, lng1, lat, lng);
  const geoOk = dist <= radiusKm;

  if (names.length === 0) {
    return geoOk;
  }

  return areaOk || geoOk;
}

async function fetchDayEligibleCleanersLimited(
  supabase: SupabaseClient,
  date: string,
): Promise<CleanerRow[]> {
  const DAY_COLS = [
    'available_sunday',
    'available_monday',
    'available_tuesday',
    'available_wednesday',
    'available_thursday',
    'available_friday',
    'available_saturday',
  ] as const;
  const dayColumn = DAY_COLS[dayOfWeekFromIsoDate(date)];

  const { data, error } = await supabase
    .from('cleaners')
    .select('*')
    .eq('is_active', true)
    .eq('is_available', true)
    .eq(dayColumn, true)
    .limit(500);

  if (error) {
    console.error('[matching] fetchDayEligibleCleanersLimited', error);
    return [];
  }
  return (data ?? []) as CleanerRow[];
}

/**
 * Active cleaners for the slot: area/working_areas + optional radius, minus overlaps.
 */
export async function findAvailableCleaners(
  supabase: SupabaseClient,
  input: FindAvailableCleanersInput,
): Promise<CleanerRow[]> {
  const area = normalizeAreaLabel(input.area);
  if (!area) return [];

  const { start, end } = timeRangeToMinutes(input.startTime, input.endTime);

  const byName = await fetchEligibleCleanersForAreas(supabase, input.date, [input.area.trim()]);
  const candidateMap = new Map<string, CleanerRow>();
  for (const c of byName) {
    candidateMap.set(c.id, c);
  }

  if (input.lat != null && input.lng != null) {
    const pool = await fetchDayEligibleCleanersLimited(supabase, input.date);
    for (const c of pool) {
      if (!candidateMap.has(c.id)) {
        candidateMap.set(c.id, c);
      }
    }
  }

  const out: CleanerRow[] = [];
  for (const c of candidateMap.values()) {
    if (!cleanerCoversLocation(c, input.area.trim(), input.lat, input.lng)) continue;
    const free = await isCleanerFreeForInterval(supabase, {
      date: input.date,
      cleanerId: c.id,
      startMinutes: start,
      endMinutes: end,
    });
    if (free) {
      out.push(c);
    }
  }

  return out.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
}
