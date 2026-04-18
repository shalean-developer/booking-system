/**
 * Pure helpers for company-only revenue lines (equipment, extra cleaners).
 * Kept separate from `earnings-company-costs.ts` so client bundles never import server-only pricing/Supabase code.
 */

export function deriveCompanyOnlyCostsCents(params: {
  serviceType: string | null;
  equipmentChargeZar: number;
  laborSubtotalOneCleanerZar: number;
  numberOfCleaners: number;
}): { equipmentCostCents: number; extraCleanerFeeCents: number } {
  const eq = Math.max(0, Math.round((params.equipmentChargeZar || 0) * 100));
  const n = Math.max(1, Math.round(params.numberOfCleaners || 1));
  const labor = params.laborSubtotalOneCleanerZar || 0;
  const s = params.serviceType || '';
  const isStdAir = s === 'Standard' || s === 'Airbnb';
  const extraZar = isStdAir && n > 1 ? (n - 1) * labor : 0;
  return {
    equipmentCostCents: eq,
    extraCleanerFeeCents: Math.max(0, Math.round(extraZar * 100)),
  };
}
