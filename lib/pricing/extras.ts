import { slugifyExtraId } from '@/lib/booking-pricing-input';
import { roundPrice } from '@/lib/pricing/rounding';

/** Canonical unified extras: slug key → price (ZAR) + time (hours) per unit where applicable */
export const UNIFIED_EXTRA_DEFS: Record<
  string,
  { price_zar: number; time_hours: number }
> = {
  garage_cleaning: { price_zar: 180, time_hours: 2.5 },
  garage: { price_zar: 180, time_hours: 2.5 },
  mattress_cleaning: { price_zar: 120, time_hours: 0.75 },
  mattress: { price_zar: 120, time_hours: 0.75 },
  outside_windows: { price_zar: 150, time_hours: 1.5 },
  laundry: { price_zar: 80, time_hours: 1.0 },
  ironing: { price_zar: 5, time_hours: 0.03 },
  inside_fridge: { price_zar: 60, time_hours: 0.5 },
  inside_oven: { price_zar: 80, time_hours: 0.75 },
  interior_windows: { price_zar: 100, time_hours: 1.0 },
  cabinets: { price_zar: 70, time_hours: 0.5 },
  balcony: { price_zar: 90, time_hours: 1.0 },
};

const INTERNAL_SKIP = new Set(['equipment', 'extra_cleaner']);

function resolveExtraDef(slug: string): { price_zar: number; time_hours: number } | null {
  const s = slug.toLowerCase().trim();
  if (UNIFIED_EXTRA_DEFS[s]) return UNIFIED_EXTRA_DEFS[s];
  if (s.includes('garage')) return UNIFIED_EXTRA_DEFS.garage_cleaning;
  if (s.includes('mattress')) return UNIFIED_EXTRA_DEFS.mattress_cleaning;
  if (s.includes('outside') && s.includes('window')) return UNIFIED_EXTRA_DEFS.outside_windows;
  if (s.includes('laundry')) return UNIFIED_EXTRA_DEFS.laundry;
  if (s.includes('iron')) return UNIFIED_EXTRA_DEFS.ironing;
  if (s.includes('fridge')) return UNIFIED_EXTRA_DEFS.inside_fridge;
  if (s.includes('oven')) return UNIFIED_EXTRA_DEFS.inside_oven;
  return null;
}

export function sumUnifiedExtras(
  extraIds: string[],
  extrasQuantities?: Record<string, number> | null
): { price_zar: number; time_hours: number } {
  if (!Array.isArray(extraIds) || extraIds.length === 0) {
    return { price_zar: 0, time_hours: 0 };
  }
  let price_zar = 0;
  let time_hours = 0;
  const seen = new Set<string>();
  for (const id of extraIds) {
    if (!id || INTERNAL_SKIP.has(id)) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    const slug = slugifyExtraId(id);
    const def = resolveExtraDef(slug) ?? resolveExtraDef(id);
    const q = Math.max(
      1,
      Math.round(Number(extrasQuantities?.[id] ?? extrasQuantities?.[slug]) || 1)
    );
    if (def) {
      price_zar += def.price_zar * q;
      time_hours += def.time_hours * q;
    }
  }
  return { price_zar: roundPrice(price_zar), time_hours };
}

/** Per-slug unit ZAR for free-extra promos. */
export function unifiedExtraUnitPricesZar(
  extraIds: string[],
  extrasQuantities?: Record<string, number> | null
): Record<string, number> {
  const m: Record<string, number> = {};
  if (!Array.isArray(extraIds) || extraIds.length === 0) return m;
  const seen = new Set<string>();
  for (const id of extraIds) {
    if (!id || INTERNAL_SKIP.has(id)) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    const slug = slugifyExtraId(id);
    const def = resolveExtraDef(slug) ?? resolveExtraDef(id);
    if (def) {
      m[id] = def.price_zar;
      m[slug] = def.price_zar;
    }
  }
  void extrasQuantities;
  return m;
}
