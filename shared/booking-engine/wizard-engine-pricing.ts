import type { ServiceType as WizardServiceType } from '@/components/booking-system-types';
import type { BookingPriceResult } from './calculate';
import { formServiceToApi } from '@/lib/booking-pricing-input';
import { deriveCompanyOnlyCostsCents } from '@/lib/derive-company-only-costs';
import {
  calculateBookingPrice,
  mapWizardServiceToPricingEngineService,
  type PricingEngineResult,
} from '@/lib/pricing-engine';

export function deriveWizardCompanyCostsCents(
  lineCalc: BookingPriceResult | null,
  dataService: WizardServiceType | undefined
): { equipmentCostCents: number; extraCleanerFeeCents: number } | null {
  if (!lineCalc || !dataService) return null;
  return deriveCompanyOnlyCostsCents({
    serviceType: formServiceToApi(dataService),
    equipmentChargeZar: lineCalc.breakdown.equipmentCharge,
    laborSubtotalOneCleanerZar: lineCalc.breakdown.laborSubtotalOneCleaner,
    numberOfCleaners: lineCalc.breakdown.numberOfCleaners,
  });
}

/** Cost-plus row aligned with earnings-v2 — same as former `enginePricing` useMemo in `booking-system`. */
export function computeWizardEnginePricingRow(input: {
  lineCalc: BookingPriceResult | null;
  dataService: WizardServiceType | undefined;
  estimatedMaxHours: number;
}): PricingEngineResult | null {
  const { lineCalc, dataService, estimatedMaxHours } = input;
  if (!lineCalc || !dataService) return null;
  const companyCostsForEngine = deriveWizardCompanyCostsCents(lineCalc, dataService);
  if (!companyCostsForEngine) return null;
  return calculateBookingPrice({
    serviceType: mapWizardServiceToPricingEngineService(dataService),
    totalHours: estimatedMaxHours,
    teamSize: Math.max(1, lineCalc.breakdown.numberOfCleaners ?? 1),
    equipmentCost: companyCostsForEngine.equipmentCostCents,
    extraCleanerFee: companyCostsForEngine.extraCleanerFeeCents,
    serviceFee: Math.round(lineCalc.serviceFee * 100),
  });
}
