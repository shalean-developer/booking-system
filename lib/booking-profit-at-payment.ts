/**
 * Compute locked P&L fields from persisted pricing snapshot + cleaner rates at payment time.
 * Revenue is always snapshot.final_price (whole ZAR) — never client totals.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { BookingPaidRow } from '@/lib/payments/booking-types';

export type LockedProfitFields = {
  revenue_zar: number;
  cleaner_cost_zar: number;
  profit_zar: number;
  margin_percent: number;
};

type SnapshotJson = {
  engine?: { result?: { duration?: number } };
};

export async function computeLockedProfitFieldsForBooking(
  supabase: SupabaseClient,
  booking: Pick<BookingPaidRow, 'pricing_snapshot_id' | 'requires_team'>,
): Promise<LockedProfitFields | null> {
  const sid = booking.pricing_snapshot_id?.trim();
  if (!sid) return null;

  const { data: snapshot, error } = await supabase
    .from('booking_pricing_snapshots')
    .select('final_price, snapshot_json')
    .eq('id', sid)
    .maybeSingle();

  if (error || !snapshot) {
    console.warn('[booking-profit-at-payment] snapshot not found', { pricing_snapshot_id: sid, error });
    return null;
  }

  const revenueZar = Math.round(Number(snapshot.final_price) || 0);
  const sj = snapshot.snapshot_json as SnapshotJson | null | undefined;
  const rawDuration = Number(sj?.engine?.result?.duration);
  const durationHours = Number.isFinite(rawDuration) && rawDuration > 0 ? rawDuration : 0.25;

  const { data: rateRows } = await supabase
    .from('cleaner_pricing_config')
    .select('cleaner_type, base_rate')
    .eq('is_active', true);

  let individual = 0;
  let team = 0;
  for (const r of rateRows ?? []) {
    const t = String((r as { cleaner_type?: string }).cleaner_type ?? '').toLowerCase();
    const br = Math.round(Number((r as { base_rate?: unknown }).base_rate) || 0);
    if (t === 'individual') individual = br;
    if (t === 'team') team = br;
  }

  const useTeam = booking.requires_team === true;
  let hourlyZar = useTeam ? team : individual;
  if (hourlyZar <= 0) {
    hourlyZar = Math.max(individual, team, 1);
  }

  const cleanerCostZar = Math.round(durationHours * hourlyZar);
  const profitZar = revenueZar - cleanerCostZar;
  const marginPercent = revenueZar > 0 ? (profitZar / revenueZar) * 100 : 0;

  return {
    revenue_zar: revenueZar,
    cleaner_cost_zar: cleanerCostZar,
    profit_zar: profitZar,
    margin_percent: Math.round(marginPercent * 10000) / 10000,
  };
}
