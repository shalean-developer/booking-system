import type { BookingFormData } from '@/components/booking-system-types';
import type { ServiceType as ApiServiceType } from '@/types/booking';
import { formServiceToApi } from '@/lib/booking-pricing-input';
import { estimateMaxWorkHoursFromWizard } from '@/lib/booking-work-hours';
import { calculateOptimalTeam } from '@/lib/team-optimizer';
import { resolveWizardNumberOfCleaners } from './calculate';
import { buildDashboardWizardShim } from './dashboard-wizard-shim';

/** Full team heuristic for crew step (hours, cleaners) — same as legacy `optimalTeam` useMemo. */
export function getWizardOptimalTeamBreakdown(wizard: BookingFormData) {
  if (!wizard.service) {
    return { teamSize: 1, hoursPerCleaner: 3, totalWorkHours: 3 as number };
  }
  const tw = estimateMaxWorkHoursFromWizard(wizard);
  return calculateOptimalTeam({
    totalWorkHours: tw,
    serviceType: formServiceToApi(wizard.service),
  });
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
  const hours = estimateMaxWorkHoursFromWizard(wizard);
  const serviceLabel = input.service === 'Move In/Out' ? 'Move In/Out' : input.service;
  const { teamSize } = calculateOptimalTeam({
    totalWorkHours: hours,
    serviceType: serviceLabel,
  });
  return teamSize;
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
