/**
 * Auto pricing *suggestions* for admin review — does not change prices.
 * Consumes output from `getPricingAnalytics`.
 */

import type { PricingAnalyticsResult } from '@/lib/analytics/getPricingAnalytics';

export type PricingSuggestionType = 'underpricing' | 'overpricing' | 'demand' | 'anomaly';

export type PricingSuggestionImpact = 'low' | 'medium' | 'high';

export type PricingSuggestion = {
  type: PricingSuggestionType;
  /** Display label — service name, or "All services" / "Portfolio" for cross-cutting insights */
  service: string;
  message: string;
  recommendation: string;
  impact: PricingSuggestionImpact;
};

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function norm(s: string): string {
  return s.trim().toLowerCase();
}

function isDeepOrMove(service: string): boolean {
  const n = norm(service);
  return n === 'deep' || n.includes('move');
}

function isStandardOrAirbnb(service: string): boolean {
  const n = norm(service);
  return n === 'standard' || n === 'airbnb';
}

function isCarpet(service: string): boolean {
  return norm(service) === 'carpet';
}

/** Deep / Move: R/h below this → underpricing. Standard / Airbnb: lower floor. Carpet: between the two. */
function underpricingThresholdZar(service: string): number | null {
  if (isDeepOrMove(service)) return 250;
  if (isStandardOrAirbnb(service)) return 200;
  if (isCarpet(service)) return 220;
  return null;
}

function underpricingImpact(gapRatio: number): PricingSuggestionImpact {
  if (gapRatio >= 0.15) return 'high';
  if (gapRatio >= 0.08) return 'medium';
  return 'low';
}

/**
 * Generate actionable pricing suggestions from aggregated analytics (last 30 days).
 */
export function generatePricingSuggestions(data: PricingAnalyticsResult): PricingSuggestion[] {
  const out: PricingSuggestion[] = [];

  // —— Service-level: under / over pricing ——
  for (const row of data.services) {
    if (row.bookings < 1) continue;

    const threshold = underpricingThresholdZar(row.service);
    const rate = row.avg_rate;

    if (threshold !== null && rate > 0 && rate < threshold) {
      const gap = (threshold - rate) / threshold;
      const pct = Math.round(gap * 100);
      out.push({
        type: 'underpricing',
        service: row.service,
        message: `${row.service} average effective rate is R${Math.round(rate)}/h — below the R${threshold}/h benchmark for this category.`,
        recommendation: 'Increase base pricing by 5–15% after reviewing competitor positioning.',
        impact: underpricingImpact(gap),
      });
    }

    if (rate > 500) {
      out.push({
        type: 'overpricing',
        service: row.service,
        message: `${row.service} average effective rate is R${Math.round(rate)}/h — above the typical sustainable band.`,
        recommendation: 'Reduce price or improve value perception (inclusions, guarantees) to protect conversion.',
        impact: rate > 580 ? 'high' : 'medium',
      });
    }
  }

  // Carpet: high realised rates + volume — headroom for demand pricing (skip if already flagged underpriced)
  const carpet = data.services.find((s) => isCarpet(s.service));
  const carpetUnderpriced = out.some((x) => x.type === 'underpricing' && isCarpet(x.service));
  if (
    !carpetUnderpriced &&
    carpet &&
    carpet.bookings >= 3 &&
    carpet.avg_rate >= 280 &&
    carpet.avg_rate <= 480
  ) {
    out.push({
      type: 'demand',
      service: carpet.service,
      message: `${carpet.service} shows strong realised rates (R${Math.round(carpet.avg_rate)}/h) with solid volume — margin headroom for demand-based pricing.`,
      recommendation: 'Consider increasing demand / surge multipliers before lifting list prices.',
      impact: 'medium',
    });
  }

  // —— Heatmap: demand spikes ——
  const cells = data.heatmap;
  const totalHeat = cells.reduce((s, c) => s + c.bookings, 0);
  const slotCount = 7 * 13;
  const avgPerSlot = slotCount > 0 ? totalHeat / slotCount : 0;

  if (totalHeat >= 8 && avgPerSlot > 0) {
    const spikes = cells.filter(
      (c) => c.bookings >= 2 && c.bookings > 2 * avgPerSlot
    );
    spikes.sort((a, b) => b.bookings - a.bookings);
    const top = spikes.slice(0, 5);
    for (const c of top) {
      const dayName = DAY_NAMES[c.day] ?? `Day ${c.day}`;
      out.push({
        type: 'demand',
        service: 'All services',
        message: `${dayName} ${c.hour}:00–${c.hour + 1}:00 shows elevated demand (${c.bookings} bookings vs ~${avgPerSlot.toFixed(1)} avg per slot).`,
        recommendation: 'Apply +10–20% surge pricing during this window, subject to cleaner capacity.',
        impact: c.bookings >= Math.max(6, 3 * avgPerSlot) ? 'high' : 'medium',
      });
    }
  }

  // —— Heatmap: low / off-peak ——
  if (data.totalBookings >= 20) {
    const zeroSlots = cells.filter((c) => c.bookings === 0).length;
    const lowSlots = cells.filter((c) => c.bookings <= 1).length;
    if (zeroSlots >= 35 || (lowSlots >= 55 && avgPerSlot < 1.5)) {
      out.push({
        type: 'demand',
        service: 'All services',
        message: `${zeroSlots} time slots had no bookings in the window — demand is thin across many off-peak hours.`,
        recommendation: 'Offer an off-peak discount (~10%) on selected slots to improve utilisation.',
        impact: 'low',
      });
    } else {
      // Weakest weekday by total bookings
      const byDay = new Map<number, number>();
      for (let d = 0; d < 7; d++) byDay.set(d, 0);
      for (const c of cells) {
        byDay.set(c.day, (byDay.get(c.day) ?? 0) + c.bookings);
      }
      const totals = [...byDay.entries()].map(([day, n]) => ({ day, n }));
      const maxD = Math.max(...totals.map((t) => t.n), 1);
      const weak = totals.filter((t) => t.n < maxD * 0.35 && t.n <= 3);
      if (weak.length >= 1 && maxD >= 5) {
        const w = weak.sort((a, b) => a.n - b.n)[0];
        out.push({
          type: 'demand',
          service: 'All services',
          message: `${DAY_NAMES[w.day]} shows noticeably fewer slot bookings than peak days — possible off-peak pattern.`,
          recommendation: 'Test a targeted off-peak discount (around 10%) for that weekday.',
          impact: 'low',
        });
      }
    }
  }

  // —— Anomalies ——
  if (data.anomalies.length > 0) {
    const below = data.anomalies.filter((a) => a.rate < 120).length;
    out.push({
      type: 'anomaly',
      service: 'Portfolio',
      message: `${data.anomalies.length} job(s) have effective rates outside the R120–R600 sanity band (${below} below R120/h).`,
      recommendation: 'Review discounted or mis-scoped jobs; some work may be below a sustainable labour rate.',
      impact: data.anomalies.length >= 10 ? 'high' : data.anomalies.length >= 3 ? 'medium' : 'low',
    });
  }

  // —— Trend: revenue dip with rate pressure (optional insight) ——
  const trends = data.trends.filter((t) => t.revenue > 0);
  if (trends.length >= 14) {
    const mid = Math.floor(trends.length / 2);
    const first = trends.slice(0, mid);
    const second = trends.slice(mid);
    const r1 = first.reduce((s, t) => s + t.revenue, 0) / first.length;
    const r2 = second.reduce((s, t) => s + t.revenue, 0) / second.length;
    if (r2 < r1 * 0.75 && r1 > 100) {
      out.push({
        type: 'demand',
        service: 'All services',
        message: 'Recent half of the period shows materially lower daily revenue than the earlier half.',
        recommendation: 'Correlate with marketing and surge settings; avoid compounding cuts across services.',
        impact: 'medium',
      });
    }
  }

  // Dedupe by (type, service, first 40 chars of message)
  const seen = new Set<string>();
  const deduped: PricingSuggestion[] = [];
  for (const s of out) {
    const key = `${s.type}|${s.service}|${s.message.slice(0, 48)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(s);
  }

  const priority: Record<PricingSuggestionType, number> = {
    anomaly: 0,
    underpricing: 1,
    overpricing: 2,
    demand: 3,
  };
  const impactRank: Record<PricingSuggestionImpact, number> = { high: 0, medium: 1, low: 2 };

  deduped.sort((a, b) => {
    const p = priority[a.type] - priority[b.type];
    if (p !== 0) return p;
    return impactRank[a.impact] - impactRank[b.impact];
  });

  return deduped.slice(0, 25);
}
