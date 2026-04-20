import { NextResponse } from 'next/server';
import { createServiceClient, isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 1000;
const MAX_PAGES = 500;

/** Max points returned for demand vs price (scatter) — keeps payload bounded. */
const MAX_DEMAND_PRICE_POINTS = 2000;

/** Risk: alert when share of unified bookings with ≥1 cap / override trace exceeds these. */
const MIN_UNIFIED_FOR_RISK = 6;
const CAP_BOOKING_SHARE_ALERT = 0.22;
const OVERRIDE_BOOKING_SHARE_ALERT = 0.14;

type BookingPricingRow = {
  total_amount: number | null;
  price_snapshot: unknown;
  created_at: string | null;
};

type UnifiedSnap = {
  dynamic_multiplier?: number;
  effective_multiplier?: number;
  demand_score?: number;
  supply_score?: number;
  admin_rule_applied?: Array<{ id?: string; type?: string | null }>;
};

type DailyBucket = {
  revenueCents: number;
  bookings: number;
  dynamicSum: number;
  effectiveSum: number;
  demandSum: number;
  supplySum: number;
  unifiedCount: number;
};

const SERVICE_PARAM_MAP: Record<string, string> = {
  standard: 'Standard',
  deep: 'Deep',
  airbnb: 'Airbnb',
  'move-in-out': 'Move In/Out',
  moveinout: 'Move In/Out',
  'move in/out': 'Move In/Out',
  carpet: 'Carpet',
};

function normalizeServiceFilter(raw: string | null): string | null {
  if (!raw?.trim()) return null;
  const t = raw.trim();
  const lower = t.toLowerCase();
  if (SERVICE_PARAM_MAP[lower]) return SERVICE_PARAM_MAP[lower];
  return t;
}

/** `from` / `to` as YYYY-MM-DD or ISO strings → inclusive UTC window for `created_at`. */
function parseDateRange(from: string | null, to: string | null): { fromIso: string | null; toIso: string | null } {
  let fromIso: string | null = null;
  let toIso: string | null = null;

  if (from?.trim()) {
    const s = from.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      fromIso = `${s}T00:00:00.000Z`;
    } else {
      const d = new Date(s);
      fromIso = Number.isNaN(d.getTime()) ? null : d.toISOString();
    }
  }

  if (to?.trim()) {
    const s = to.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      toIso = `${s}T23:59:59.999Z`;
    } else {
      const d = new Date(s);
      toIso = Number.isNaN(d.getTime()) ? null : d.toISOString();
    }
  }

  if (fromIso && toIso && fromIso > toIso) {
    return { fromIso: toIso, toIso: fromIso };
  }

  return { fromIso, toIso };
}

function readPricingV52(snap: unknown): {
  unified: UnifiedSnap | null;
  priceZar: number | null;
} | null {
  if (snap === null || typeof snap !== 'object') return null;
  const p52 = (snap as Record<string, unknown>).pricing_v5_2;
  if (p52 === null || typeof p52 !== 'object') return null;
  const o = p52 as Record<string, unknown>;
  const unifiedRaw = o.unified;
  let unified: UnifiedSnap | null = null;
  if (unifiedRaw !== null && typeof unifiedRaw === 'object') {
    unified = unifiedRaw as UnifiedSnap;
  }
  const pz = o.price_zar;
  const priceZar =
    typeof pz === 'number' && Number.isFinite(pz) ? pz : typeof pz === 'string' && pz.trim() !== '' ? Number(pz) : null;
  return {
    unified,
    priceZar: priceZar != null && Number.isFinite(priceZar) ? priceZar : null,
  };
}

function dayKey(createdAt: string | null): string | null {
  if (typeof createdAt !== 'string' || createdAt.length < 10) return null;
  return createdAt.slice(0, 10);
}

/** Strip ILIKE wildcards so user input cannot broaden the match unexpectedly. */
function sanitizeAreaPattern(raw: string): string {
  return raw.trim().replace(/[%_\\]/g, '');
}

async function fetchAllBookingPricingRows(
  supabase: ReturnType<typeof createServiceClient>,
  filters: {
    fromIso: string | null;
    toIso: string | null;
    serviceType: string | null;
    areaIlike: string | null;
  },
): Promise<BookingPricingRow[] | null> {
  const rows: BookingPricingRow[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    let q = supabase
      .from('bookings')
      .select('total_amount, price_snapshot, created_at')
      .order('created_at', { ascending: true })
      .range(from, to);

    if (filters.fromIso) q = q.gte('created_at', filters.fromIso);
    if (filters.toIso) q = q.lte('created_at', filters.toIso);
    if (filters.serviceType) q = q.eq('service_type', filters.serviceType);
    if (filters.areaIlike) q = q.ilike('address_suburb', `%${filters.areaIlike}%`);

    const { data, error } = await q;
    if (error) {
      console.error('[admin/pricing/analytics] bookings fetch', error);
      return null;
    }
    if (!data?.length) break;
    rows.push(...(data as BookingPricingRow[]));
    if (data.length < PAGE_SIZE) break;
  }
  return rows;
}

export async function GET(req: Request) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    const serviceRaw = searchParams.get('service') ?? searchParams.get('service_type');
    const areaRaw = searchParams.get('area') ?? searchParams.get('suburb');
    const { fromIso, toIso } = parseDateRange(fromParam, toParam);
    const serviceType = normalizeServiceFilter(serviceRaw);
    const areaSan = areaRaw?.trim() ? sanitizeAreaPattern(areaRaw) : '';
    const areaIlike = areaSan.length > 0 ? areaSan : null;

    const supabase = createServiceClient();
    const bookings = await fetchAllBookingPricingRows(supabase, { fromIso, toIso, serviceType, areaIlike });
    if (bookings === null) {
      return NextResponse.json({ ok: false, error: 'Failed to load bookings' }, { status: 500 });
    }

    let totalRevenue = 0;
    const totalBookings = bookings.length;

    let dynamicSum = 0;
    let effectiveSum = 0;
    let demandSum = 0;
    let supplySum = 0;

    const ruleUsage: Record<string, number> = {};

    const dailyMap = new Map<string, DailyBucket>();
    const demandVsPrice: { demand: number; priceZar: number }[] = [];

    let unifiedBookings = 0;
    let bookingsWithCap = 0;
    let bookingsWithOverride = 0;
    let capRuleHits = 0;
    let overrideRuleHits = 0;

    function ensureDay(dk: string): DailyBucket {
      const existing = dailyMap.get(dk);
      if (existing) return existing;
      const b: DailyBucket = {
        revenueCents: 0,
        bookings: 0,
        dynamicSum: 0,
        effectiveSum: 0,
        demandSum: 0,
        supplySum: 0,
        unifiedCount: 0,
      };
      dailyMap.set(dk, b);
      return b;
    }

    for (const b of bookings) {
      const cents = Number(b.total_amount) || 0;
      totalRevenue += cents;

      const dk = dayKey(b.created_at);
      if (dk) {
        const day = ensureDay(dk);
        day.revenueCents += cents;
        day.bookings += 1;
      }

      const p52 = readPricingV52(b.price_snapshot);
      if (!p52?.unified) continue;

      const unified = p52.unified;
      unifiedBookings += 1;

      if (dk) {
        const day = ensureDay(dk);
        day.unifiedCount += 1;
        day.dynamicSum += unified.dynamic_multiplier || 1;
        day.effectiveSum += unified.effective_multiplier || 1;
        day.demandSum += unified.demand_score || 0;
        day.supplySum += unified.supply_score || 0;
      }

      dynamicSum += unified.dynamic_multiplier || 1;
      effectiveSum += unified.effective_multiplier || 1;
      demandSum += unified.demand_score || 0;
      supplySum += unified.supply_score || 0;

      const rules = unified.admin_rule_applied;
      let sawCap = false;
      let sawOverride = false;
      if (Array.isArray(rules)) {
        for (const r of rules) {
          const id = typeof r?.id === 'string' ? r.id : null;
          if (id) {
            ruleUsage[id] = (ruleUsage[id] || 0) + 1;
          }
          const t = typeof r?.type === 'string' ? r.type.trim().toLowerCase() : '';
          if (t === 'cap') {
            capRuleHits += 1;
            sawCap = true;
          }
          if (t === 'override') {
            overrideRuleHits += 1;
            sawOverride = true;
          }
        }
      }
      if (sawCap) bookingsWithCap += 1;
      if (sawOverride) bookingsWithOverride += 1;

      const demand = unified.demand_score;
      if (demand != null && Number.isFinite(demand)) {
        const priceZar =
          p52.priceZar != null && Number.isFinite(p52.priceZar) ? p52.priceZar : cents / 100;
        if (Number.isFinite(priceZar)) {
          demandVsPrice.push({ demand, priceZar });
          if (demandVsPrice.length > MAX_DEMAND_PRICE_POINTS) {
            demandVsPrice.shift();
          }
        }
      }
    }

    const denom = totalBookings > 0 ? totalBookings : 1;
    const avgDemand = demandSum / denom;
    const avgSupply = supplySum / denom;

    const insights: string[] = [];
    if (avgDemand > 0.8) {
      insights.push('High demand — increase pricing');
    }
    if (avgSupply < 0.5) {
      insights.push('Low supply — increase pricing');
    }

    const riskAlerts: string[] = [];
    if (unifiedBookings >= MIN_UNIFIED_FOR_RISK) {
      const capShare = bookingsWithCap / unifiedBookings;
      const ovShare = bookingsWithOverride / unifiedBookings;
      if (capShare >= CAP_BOOKING_SHARE_ALERT) {
        riskAlerts.push('Too many caps triggered — review min/max price bands');
      }
      if (ovShare >= OVERRIDE_BOOKING_SHARE_ALERT) {
        riskAlerts.push('Too many overrides — review override rules');
      }
    }

    const revenueByDay = Array.from(dailyMap.entries())
      .map(([date, d]) => ({
        date,
        revenueCents: d.revenueCents,
        bookings: d.bookings,
        avgDynamicMultiplier: d.unifiedCount > 0 ? d.dynamicSum / d.unifiedCount : null,
        avgEffectiveMultiplier: d.unifiedCount > 0 ? d.effectiveSum / d.unifiedCount : null,
        avgDemand: d.unifiedCount > 0 ? d.demandSum / d.unifiedCount : null,
        avgSupply: d.unifiedCount > 0 ? d.supplySum / d.unifiedCount : null,
        unifiedBookings: d.unifiedCount,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const trend = revenueByDay.map((r) => ({
      date: r.date,
      revenue: r.revenueCents / 100,
      bookings: r.bookings,
      avgDynamic: r.avgDynamicMultiplier ?? 0,
      avgDemand: r.avgDemand ?? 0,
      avgSupply: r.avgSupply ?? 0,
    }));

    return NextResponse.json({
      ok: true,
      filters: {
        from: fromParam,
        to: toParam,
        service: serviceType,
        area: areaIlike ? areaRaw?.trim() ?? areaIlike : null,
        applied: {
          created_at_gte: fromIso,
          created_at_lte: toIso,
          service_type: serviceType,
          address_suburb_ilike: areaIlike,
        },
      },
      metrics: {
        totalRevenue,
        totalBookings,
        avgBookingValue: totalBookings > 0 ? totalRevenue / totalBookings / 100 : 0,

        avgDynamicMultiplier: dynamicSum / denom,
        avgEffectiveMultiplier: effectiveSum / denom,

        avgDemand,
        avgSupply,
      },
      ruleUsage,
      insights,
      riskAlerts,
      revenueByDay,
      trend,
      demandVsPrice,
      riskStats: {
        unifiedBookings,
        bookingsWithCap,
        bookingsWithOverride,
        capRuleHits,
        overrideRuleHits,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    console.error('[admin/pricing/analytics]', e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
