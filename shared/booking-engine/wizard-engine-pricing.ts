import type { BookingFormData, ServiceType as WizardServiceType } from '@/components/booking-system-types';
import type { BookingPriceResult } from './calculate';
import { getEquipmentCentsForEngineService } from '@/lib/pricing-service-config';
import { buildWizardTimeInput } from '@/lib/time-estimation';
import {
  calculatePrice,
  mapWizardServiceToPricingEngineService,
  type PricingEngineResult,
} from '@/lib/pricing-engine';
import type { QuickCleanSettings } from '@/lib/quick-clean-settings';

/** Equipment / extra-cleaner cents for payloads — engine uses config equipment + no extra-cleaner fee line. */
export function getWizardEngineCompanyCostsCents(input: {
  wizard: BookingFormData;
  lineCalc: BookingPriceResult;
  catalogExtraNames?: string[];
}): { equipmentCostCents: number; extraCleanerFeeCents: number } {
  const st = mapWizardServiceToPricingEngineService(input.wizard.service);
  return {
    equipmentCostCents: getEquipmentCentsForEngineService(st),
    extraCleanerFeeCents: 0,
  };
}

/** @deprecated Legacy shape — engine no longer uses catalog labour for extra cleaner. */
export function deriveWizardCompanyCostsCents(
  lineCalc: BookingPriceResult | null,
  dataService: WizardServiceType | undefined
): { equipmentCostCents: number; extraCleanerFeeCents: number } | null {
  if (!lineCalc || !dataService) return null;
  const st = mapWizardServiceToPricingEngineService(dataService);
  return {
    equipmentCostCents: getEquipmentCentsForEngineService(st),
    extraCleanerFeeCents: 0,
  };
}

export function deriveWizardEngineCompanyLinesCents(input: {
  wizard: BookingFormData;
  equipmentChargeZar: number;
  labourCentsTotal: number;
  teamSize: number;
}): { equipmentCostCents: number; extraCleanerFeeCents: number } {
  void input;
  const st = mapWizardServiceToPricingEngineService(input.wizard.service);
  return {
    equipmentCostCents: getEquipmentCentsForEngineService(st),
    extraCleanerFeeCents: 0,
  };
}

export function computeWizardEnginePricingRow(input: {
  lineCalc: BookingPriceResult | null;
  dataService: WizardServiceType | undefined;
  wizard: BookingFormData;
  catalogExtraNames?: string[];
  quickCleanSettings?: QuickCleanSettings;
}): PricingEngineResult | null {
  const { lineCalc, dataService, wizard, catalogExtraNames, quickCleanSettings } = input;
  if (!lineCalc || !dataService) return null;

  const time = buildWizardTimeInput(wizard, catalogExtraNames);
  const st = mapWizardServiceToPricingEngineService(dataService);
  const equipmentCents =
    wizard.pricingMode === 'basic' && wizard.scheduleEquipmentPref !== 'bring'
      ? 0
      : getEquipmentCentsForEngineService(st);

  if (wizard.pricingMode === 'basic') {
    const row = calculatePrice('basic', {
      serviceType: st,
      time,
      teamSize: 1,
      serviceFeeCents: 0,
      equipmentCents,
      extrasIds: wizard.extras,
      extrasQuantities: wizard.extrasQuantities,
      quickCleanSettings,
    });
    const uni = lineCalc.unifiedPricing;
    if (uni) {
      return { ...row, jobHours: uni.hours, hoursPerCleaner: uni.duration };
    }
    return row;
  }

  const teamSize = Math.max(1, Math.round(wizard.numberOfCleaners ?? 1));

  const row = calculatePrice(wizard.pricingMode ?? 'premium', {
    serviceType: st,
    time,
    teamSize,
    serviceFeeCents: Math.round(lineCalc.serviceFee * 100),
    equipmentCents: getEquipmentCentsForEngineService(st),
    extrasIds: wizard.extras,
    extrasQuantities: wizard.extrasQuantities,
    quickCleanSettings,
  });
  const uni = lineCalc.unifiedPricing;
  if (uni) {
    return { ...row, jobHours: uni.hours, hoursPerCleaner: uni.duration };
  }
  return row;
}
