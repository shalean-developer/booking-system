import type { BookingFormData } from '@/components/booking-system-types';
import type { ServiceType as ApiServiceType } from '@/types/booking';
import {
  buildWizardTimeInput,
  calculateJobHours,
  getRecommendedTeamSize,
} from '@/lib/time-estimation';
import { calculateBookingV4 } from '@/lib/pricing/v4/calculateBookingV4';
import { bookingFormDataToV4Input } from '@/lib/pricing/v4/booking-form-to-v4';
import { MAX_TEAM_SIZE, MIN_TEAM_SIZE } from '@/lib/team-optimizer';
import { isBasicEligible } from '@/lib/pricing-mode';
import type { QuickCleanSettings } from '@/lib/quick-clean-settings';
import { resolveWizardNumberOfCleaners } from './calculate';
import { buildDashboardWizardShim } from './dashboard-wizard-shim';

/** Full team heuristic for crew step — `calculateBookingV4` only. */
export function getWizardOptimalTeamBreakdown(
  wizard: BookingFormData,
  _quickCleanSettings?: QuickCleanSettings
) {
  void _quickCleanSettings;
  if (!wizard.service) {
    return { teamSize: 1, hoursPerCleaner: 3, totalWorkHours: 3 as number };
  }
  if (
    wizard.service === 'standard' ||
    wizard.service === 'airbnb' ||
    wizard.service === 'deep' ||
    wizard.service === 'move' ||
    wizard.service === 'carpet'
  ) {
    const v4 = calculateBookingV4(bookingFormDataToV4Input(wizard));
    return {
      teamSize: v4.team_size,
      hoursPerCleaner: v4.duration,
      totalWorkHours: v4.hours,
    };
  }
  const timeIn = buildWizardTimeInput(wizard);
  const totalWorkHours = calculateJobHours(timeIn);
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
  return resolveWizardNumberOfCleaners(wizard);
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
