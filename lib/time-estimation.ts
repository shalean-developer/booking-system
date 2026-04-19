/**
 * Time-only job hours from `SERVICE_CONFIG` + add-ons → labour input for the pricing engine.
 */

import type { BookingFormData } from '@/components/booking-system-types';
import {
  SERVICE_CONFIG,
  type WizardServiceKey,
} from '@/lib/pricing-service-config';
import { getEffectiveRoomCounts, slugifyExtraId } from '@/lib/booking-pricing-input';

export const ADD_ON_TIME = {
  garage_cleaning: 2.5,
  mattress_cleaning: 0.75,
  outside_windows: 1.5,
  laundry: 1.0,
  ironing_per_item: 0.03,
};

export type TimeInput = {
  serviceType: WizardServiceKey;
  bedrooms: number;
  bathrooms: number;
  extraRooms: number;
  addOns: {
    garageCleaning?: boolean;
    mattressCount?: number;
    outsideWindows?: boolean;
    laundry?: boolean;
    ironingItems?: number;
  };
};

export function mapWizardServiceToTimeServiceType(
  service: BookingFormData['service']
): WizardServiceKey {
  switch (service) {
    case 'standard':
      return 'standard';
    case 'airbnb':
      return 'airbnb';
    case 'deep':
      return 'deep';
    case 'move':
      return 'move';
    case 'carpet':
      return 'carpet';
    default:
      return 'standard';
  }
}

export function parseAddOnsFromWizardExtras(
  extras: string[],
  extrasQuantities: Record<string, number> | undefined,
  catalogExtraNames?: string[]
): TimeInput['addOns'] {
  const addOns: TimeInput['addOns'] = {};
  const seen = new Set<string>();

  for (const id of extras) {
    if (seen.has(id)) continue;
    seen.add(id);
    if (id === 'equipment' || id === 'extra_cleaner') continue;

    const q = Math.max(1, extrasQuantities?.[id] ?? 1);
    const label =
      catalogExtraNames?.find((n) => slugifyExtraId(n) === id) ?? id;
    const lower = label.toLowerCase();

    if (lower.includes('garage')) addOns.garageCleaning = true;
    if (lower.includes('mattress')) {
      addOns.mattressCount = (addOns.mattressCount ?? 0) + q;
    }
    if (lower.includes('outside') && lower.includes('window')) {
      addOns.outsideWindows = true;
    }
    if (lower.includes('laundry') && lower.includes('iron')) {
      addOns.laundry = true;
      addOns.ironingItems = (addOns.ironingItems ?? 0) + q * 10;
    } else if (lower.includes('laundry') && !lower.includes('iron')) {
      addOns.laundry = true;
    } else if (lower.includes('iron') && !lower.includes('laundry')) {
      addOns.ironingItems = (addOns.ironingItems ?? 0) + q;
    }
  }

  return addOns;
}

export function buildWizardTimeInput(
  wizard: BookingFormData,
  catalogExtraNames?: string[]
): TimeInput {
  const eff = getEffectiveRoomCounts(wizard);
  return {
    serviceType: mapWizardServiceToTimeServiceType(wizard.service),
    bedrooms: Math.max(0, eff.bedrooms),
    bathrooms: Math.max(0, eff.bathrooms),
    extraRooms: Math.max(0, eff.extraRooms),
    addOns: parseAddOnsFromWizardExtras(
      wizard.extras,
      wizard.extrasQuantities,
      catalogExtraNames
    ),
  };
}

export function getBaseTimeHours(serviceType: WizardServiceKey): number {
  return SERVICE_CONFIG[serviceType].baseTime;
}

export function calculateJobHours(input: TimeInput): number {
  const cfg = SERVICE_CONFIG[input.serviceType];
  let hours = cfg.baseTime;
  const rates = cfg.timeRates;
  hours += input.bedrooms * rates.bedroom;
  hours += input.bathrooms * rates.bathroom;
  hours += input.extraRooms * rates.extraRoom;

  if (input.addOns.garageCleaning) {
    hours += ADD_ON_TIME.garage_cleaning;
  }

  if (input.addOns.mattressCount) {
    hours += input.addOns.mattressCount * ADD_ON_TIME.mattress_cleaning;
  }

  if (input.addOns.outsideWindows) {
    hours += ADD_ON_TIME.outside_windows;
  }

  if (input.addOns.laundry) {
    hours += ADD_ON_TIME.laundry;
  }

  if (input.addOns.ironingItems) {
    hours += input.addOns.ironingItems * ADD_ON_TIME.ironing_per_item;
  }

  const rounded = Math.ceil(hours * 2) / 2;
  const base = cfg.baseTime;
  if (rounded < base) return base;
  return rounded;
}

export function validateTimeDrivenHours(
  input: TimeInput,
  hours: number
): void {
  if (!Number.isFinite(hours) || hours <= 0) {
    throw new Error('time-estimation: hours must be a positive finite number');
  }
  const base = getBaseTimeHours(input.serviceType);
  if (hours < base) {
    throw new Error('time-estimation: hours below base time for service');
  }
  const hasAddOn =
    !!input.addOns.garageCleaning ||
    !!input.addOns.outsideWindows ||
    !!input.addOns.laundry ||
    (input.addOns.mattressCount ?? 0) > 0 ||
    (input.addOns.ironingItems ?? 0) > 0;
  if (!hasAddOn || process.env.NODE_ENV === 'production') return;

  const baseOnly = calculateJobHours({
    ...input,
    addOns: {},
  });
  if (hours <= baseOnly) {
    console.warn(
      '[time-estimation] Add-ons selected but rounded hours did not exceed base-only estimate',
      { hours, baseOnly }
    );
  }
}

function teamSizeFromHoursHeuristic(hours: number): number {
  if (hours <= 4) return 1;
  if (hours <= 8) return 2;
  return 3;
}

export function getRecommendedTeamSize(
  hours: number,
  service: WizardServiceKey
): number {
  return Math.max(
    SERVICE_CONFIG[service].teamSize,
    teamSizeFromHoursHeuristic(hours)
  );
}

export function getTeamSizeForJobHours(
  hours: number,
  userTeamSize: number | undefined,
  service: WizardServiceKey
): number {
  const r = getRecommendedTeamSize(hours, service);
  const u =
    typeof userTeamSize === 'number' && userTeamSize >= 1
      ? Math.round(userTeamSize)
      : r;
  return Math.max(r, u);
}
