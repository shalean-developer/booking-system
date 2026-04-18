/**
 * Shared estimate of job duration (hours) for team optimization and pricing.
 * Keeps the same rules as the public wizard `estimatedDuration` in `booking-system.tsx`.
 */

import type { BookingFormData } from '@/components/booking-system-types';
import { getEffectiveRoomCounts } from '@/lib/booking-pricing-input';

function roundHalf(v: number): number {
  return Math.round(v * 2) / 2;
}

/** Upper bound of the estimated duration range (hours), used for team size + pricing engine `totalHours`. */
export function estimateMaxWorkHoursFromWizard(data: BookingFormData): number {
  const selectedService = data.service;
  if (!selectedService) return 3;

  const eff = getEffectiveRoomCounts(data);

  let hours =
    selectedService === 'standard'
      ? 2.0
      : selectedService === 'airbnb'
        ? 2.5
        : selectedService === 'deep'
          ? 4.0
          : selectedService === 'move'
            ? 4.5
            : selectedService === 'carpet'
              ? 2.0
              : 2.5;

  if (selectedService === 'carpet') {
    hours += Math.max(0, eff.bedrooms) * 0.5;
    hours += Math.max(0, eff.bathrooms) * 0.25;
    hours += Math.max(0, eff.extraRooms) * 0.5;
  } else {
    hours += Math.max(0, eff.bedrooms) * 0.5;
    hours += Math.max(0, eff.bathrooms) * 0.75;
    hours += Math.max(0, eff.extraRooms) * 0.5;
    if (data.propertyType === 'office') {
      hours += Math.max(0, eff.bedrooms) * 0.25;
    }
  }

  hours += data.extras.reduce((sum, id) => {
    const q = data.extrasQuantities[id] ?? 1;
    return sum + q * 0.25;
  }, 0);

  const base = Math.min(12, Math.max(1.5, roundHalf(hours)));
  const min = Math.max(1, roundHalf(base * 0.9));
  const max = Math.max(min, roundHalf(base * 1.1));
  return max;
}

/** Human-readable range + max hours for UI copy. */
export function estimateBookingDurationRange(data: BookingFormData): {
  label: string;
  maxHours: number;
  minHours: number;
} {
  const selectedService = data.service;
  if (!selectedService) {
    return { label: '—', maxHours: 3, minHours: 1 };
  }

  const eff = getEffectiveRoomCounts(data);

  let hours =
    selectedService === 'standard'
      ? 2.0
      : selectedService === 'airbnb'
        ? 2.5
        : selectedService === 'deep'
          ? 4.0
          : selectedService === 'move'
            ? 4.5
            : selectedService === 'carpet'
              ? 2.0
              : 2.5;

  if (selectedService === 'carpet') {
    hours += Math.max(0, eff.bedrooms) * 0.5;
    hours += Math.max(0, eff.bathrooms) * 0.25;
    hours += Math.max(0, eff.extraRooms) * 0.5;
  } else {
    hours += Math.max(0, eff.bedrooms) * 0.5;
    hours += Math.max(0, eff.bathrooms) * 0.75;
    hours += Math.max(0, eff.extraRooms) * 0.5;
    if (data.propertyType === 'office') {
      hours += Math.max(0, eff.bedrooms) * 0.25;
    }
  }

  hours += data.extras.reduce((sum, id) => {
    const q = data.extrasQuantities[id] ?? 1;
    return sum + q * 0.25;
  }, 0);

  const base = Math.min(12, Math.max(1.5, roundHalf(hours)));
  const minH = Math.max(1, roundHalf(base * 0.9));
  const maxH = Math.max(minH, roundHalf(base * 1.1));
  return {
    label: `Est. ${minH}–${maxH} hrs`,
    maxHours: maxH,
    minHours: minH,
  };
}
