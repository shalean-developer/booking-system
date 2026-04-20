/**
 * Non-monetary job shape for Standard/Airbnb — mirrors hour/team logic from `calculateBookingUnified`
 * without exposing pricing (V5.2 traceability).
 */
import {
  capExtraRoomsForLineItems,
  lookupTimeHours,
  PREMIUM_EXTRA_ROOM_TIME_H,
  QUICK_EXTRA_ROOM_TIME_H,
  UNIFIED_MAX_HOURS,
  UNIFIED_MIN_HOURS,
} from '@/lib/pricing/tables';
import { sumUnifiedExtras } from '@/lib/pricing/extras';
import type { PricingMode } from '@/lib/pricing-mode';

export function estimateUnifiedJobShape(input: {
  bedrooms: number;
  bathrooms: number;
  extraRooms: number;
  extras: string[];
  extrasQuantities?: Record<string, number> | null;
  pricingMode: PricingMode | undefined;
  hasExtraCleaner: boolean;
}): { estimated_hours: number; team_size: number; base_hours: number } {
  const bedrooms = Math.max(1, Math.floor(Number(input.bedrooms) || 0));
  const bathrooms = Math.max(0, Math.floor(Number(input.bathrooms) || 0));
  const extraRoomsRaw = Math.max(0, Math.floor(Number(input.extraRooms) || 0));
  const extraRooms = capExtraRoomsForLineItems(extraRoomsRaw);
  const isQuick = input.pricingMode === 'basic';
  const isPremium = input.pricingMode === 'premium';

  const { time_hours: extras_time_hours } = sumUnifiedExtras(input.extras ?? [], input.extrasQuantities);

  const extraTimePer = isQuick ? QUICK_EXTRA_ROOM_TIME_H : PREMIUM_EXTRA_ROOM_TIME_H;
  let totalHours =
    lookupTimeHours(isQuick ? 'quick' : 'premium', bedrooms, bathrooms) +
    extraRooms * extraTimePer +
    extras_time_hours;

  totalHours = Math.max(UNIFIED_MIN_HOURS, totalHours);

  let hours: number;
  let team_size: number;
  let duration: number;

  if (totalHours > UNIFIED_MAX_HOURS) {
    if (isPremium && input.hasExtraCleaner) {
      team_size = 2;
      hours = totalHours;
      duration = totalHours / 2;
    } else {
      hours = UNIFIED_MAX_HOURS;
      team_size = 1;
      duration = UNIFIED_MAX_HOURS;
    }
  } else {
    team_size = isPremium && input.hasExtraCleaner ? 2 : 1;
    hours = totalHours;
    duration = totalHours / team_size;
  }

  return {
    estimated_hours: hours,
    team_size,
    base_hours: duration,
  };
}
