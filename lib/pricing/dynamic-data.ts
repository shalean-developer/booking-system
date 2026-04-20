/**
 * Real demand/supply ratios for V6.1 dynamic pricing (Supabase).
 * Uses service role client — import only from server code (API routes, booking-server-pricing, etc.).
 */

import 'server-only';

import { createServiceClient } from '@/lib/supabase-server';
import { dayOfWeekFromIsoDate } from '@/lib/dispatch/cleaner-dispatch';
import {
  DEMAND_CAPACITY,
  NEUTRAL_DYNAMIC_SIGNALS,
  SUPPLY_REQUIRED,
} from '@/lib/pricing/dynamic-signals-constants';
import { computeDynamicMultiplierFromSignals } from '@/lib/pricing/dynamic-pricing';

export {
  DEMAND_CAPACITY,
  NEUTRAL_DYNAMIC_SIGNALS,
  SUPPLY_REQUIRED,
} from '@/lib/pricing/dynamic-signals-constants';

const DAY_COLS = [
  'available_sunday',
  'available_monday',
  'available_tuesday',
  'available_wednesday',
  'available_thursday',
  'available_friday',
  'available_saturday',
] as const;

const EXCLUDED_BOOKING_STATUSES = ['cancelled', 'canceled', 'declined'] as const;

/**
 * Demand intensity: count of non-terminal bookings on `date` (optional area filter) ÷ capacity.
 */
export async function getDemandScore(date: string, area?: string): Promise<number> {
  try {
    const supabase = createServiceClient();
    let q = supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('booking_date', date);

    for (const s of EXCLUDED_BOOKING_STATUSES) {
      q = q.neq('status', s);
    }

    if (area?.trim()) {
      const a = area.trim();
      q = q.or(`area.eq."${a.replace(/"/g, '')}",address_suburb.ilike."%${a.replace(/"/g, '')}%"`);
    }

    const { count, error } = await q;
    if (error) throw error;
    const bookings = count ?? 0;
    return bookings / DEMAND_CAPACITY;
  } catch (e) {
    console.warn('[dynamic-data] getDemandScore', e);
    return NEUTRAL_DYNAMIC_SIGNALS.demand_score;
  }
}

/**
 * Supply: cleaners active + available for the weekday, optionally serving `area`, ÷ required baseline.
 */
export async function getSupplyScore(date: string, area?: string): Promise<number> {
  try {
    const supabase = createServiceClient();
    const dow = dayOfWeekFromIsoDate(date);
    const dayCol = DAY_COLS[dow];
    if (!dayCol) return NEUTRAL_DYNAMIC_SIGNALS.supply_score;

    if (!area?.trim()) {
      const { count, error } = await supabase
        .from('cleaners')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('is_available', true)
        .eq(dayCol, true);

      if (error) throw error;
      return (count ?? 0) / SUPPLY_REQUIRED;
    }

    const a = area.trim();
    const seen = new Set<string>();
    for (const col of ['areas', 'working_areas'] as const) {
      const { data, error } = await supabase
        .from('cleaners')
        .select('id')
        .eq('is_active', true)
        .eq('is_available', true)
        .eq(dayCol, true)
        .contains(col, [a]);
      if (error) {
        if (col === 'working_areas') {
          console.warn('[dynamic-data] working_areas query:', error.message);
        } else {
          console.warn('[dynamic-data] areas query:', error.message);
        }
        continue;
      }
      for (const row of data ?? []) seen.add(row.id);
    }
    return seen.size / SUPPLY_REQUIRED;
  } catch (e) {
    console.warn('[dynamic-data] getSupplyScore', e);
    return NEUTRAL_DYNAMIC_SIGNALS.supply_score;
  }
}

export async function fetchDynamicSignals(
  date: string,
  area?: string
): Promise<{ demand_score: number; supply_score: number }> {
  const [demand_score, supply_score] = await Promise.all([
    getDemandScore(date, area),
    getSupplyScore(date, area),
  ]);
  return { demand_score, supply_score };
}

/** Server/tooling — loads scores from DB then applies V6 rules. Lives here so client bundles never reference this file. */
export async function getDynamicPricingMultiplier(input: {
  date: string;
  time: string;
  area?: string;
  serviceType: string;
}): Promise<{ multiplier: number; demand_score: number; supply_score: number }> {
  void input.serviceType;
  const { demand_score, supply_score } = await fetchDynamicSignals(input.date, input.area);
  return computeDynamicMultiplierFromSignals(demand_score, supply_score, input.time, input.date);
}
