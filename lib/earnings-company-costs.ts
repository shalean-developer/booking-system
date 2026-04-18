import type { SupabaseClient } from '@supabase/supabase-js';
import { computeServerPreSurgeTotalZar, type BookingBodyForPricing } from '@/lib/booking-server-pricing';
import { deriveCompanyOnlyCostsCents as deriveCompanyOnlyCostsCentsPure } from '@/lib/derive-company-only-costs';

/** Re-export for server/API callers — same implementation as `lib/derive-company-only-costs`. */
export const deriveCompanyOnlyCostsCents = deriveCompanyOnlyCostsCentsPure;

export async function fetchCompanyOnlyCostsCents(
  supabase: SupabaseClient,
  body: BookingBodyForPricing
): Promise<{ equipmentCostCents: number; extraCleanerFeeCents: number }> {
  const serverCart = await computeServerPreSurgeTotalZar(supabase, body);
  const b = serverCart.calc.breakdown;
  return deriveCompanyOnlyCostsCentsPure({
    serviceType: body.service ?? null,
    equipmentChargeZar: b.equipmentCharge,
    laborSubtotalOneCleanerZar: b.laborSubtotalOneCleaner,
    numberOfCleaners: b.numberOfCleaners,
  });
}
