import type { BookingFormData } from '@/components/booking-system-types';
import type { ServiceType as ApiServiceType } from '@/types/booking';
import {
  buildWizardTimeInput,
  calculateJobHours,
  getRecommendedTeamSize,
} from '@/lib/time-estimation';
import { MAX_TEAM_SIZE, MIN_TEAM_SIZE } from '@/lib/team-optimizer';
import { isBasicEligible, isBasicPlannedPathExtrasValid } from '@/lib/pricing-mode';
import { resolveWizardNumberOfCleaners } from './calculate';
import { buildDashboardWizardShim } from './dashboard-wizard-shim';

/** Full team heuristic for crew step — aligned with `getRecommendedTeamSize` + pricing engine. */
export function getWizardOptimalTeamBreakdown(wizard: BookingFormData) {
  if (!wizard.service) {
    return { teamSize: 1, hoursPerCleaner: 3, totalWorkHours: 3 as number };
  }
  const timeIn = buildWizardTimeInput(wizard);
  const totalWorkHours = calculateJobHours(timeIn);
  if (
    wizard.pricingMode === 'basic' &&
    wizard.basicPlannedHours != null &&
    isBasicPlannedPathExtrasValid(timeIn, wizard.extras)
  ) {
    const h = wizard.basicPlannedHours;
    return {
      teamSize: 1,
      hoursPerCleaner: h,
      totalWorkHours: h,
    };
  }
  if (wizard.pricingMode === 'basic' && isBasicEligible(timeIn, wizard.extras)) {
    return {
      teamSize: 1,
      hoursPerCleaner: totalWorkHours,
      totalWorkHours,
    };
  }
  const teamSize = Math.min(
    MAX_TEAM_SIZE,
    Math.max(MIN_TEAM_SIZE, getRecommendedTeamSize(totalWorkHours, timeIn.serviceType))
  );
  const hoursPerCleaner = teamSize > 0 ? totalWorkHours / teamSize : totalWorkHours;
  return { teamSize, hoursPerCleaner, totalWorkHours };
}

export function getDashboardOptimalTeamSize(input: {
  service: ApiServiceType;
  bedrooms: number;
  bathrooms: number;
  extraRooms: number;
  selectedExtraIds: string[];
  extrasQuantitiesById: Record<string, number>;
}): number {
  const wizard = buildDashboardWizardShim(input);
  const timeIn = buildWizardTimeInput(wizard);
  const hours = calculateJobHours(timeIn);
  return Math.min(
    MAX_TEAM_SIZE,
    Math.max(MIN_TEAM_SIZE, getRecommendedTeamSize(hours, timeIn.serviceType))
  );
}

export type OptimalTeamInput =
  | { kind: 'wizard'; wizard: BookingFormData }
  | {
      kind: 'dashboard';
      service: ApiServiceType;
      bedrooms: number;
      bathrooms: number;
      extraRooms: number;
      selectedExtraIds: string[];
      extrasQuantitiesById: Record<string, number>;
    };

/** Single entry for team size: wizard overrides + dashboard shim use the same rules as pricing. */
export function getOptimalTeamSize(input: OptimalTeamInput): number {
  if (input.kind === 'wizard') {
    return resolveWizardNumberOfCleaners(input.wizard);
  }
  return getDashboardOptimalTeamSize(input);
}
