/**
 * Job duration (hours) for scheduling copy — delegates to `calculateJobHours` / `buildWizardTimeInput`.
 */

import type { BookingFormData } from '@/components/booking-system-types';
import { buildWizardTimeInput, calculateJobHours } from '@/lib/time-estimation';

/** Upper bound of the estimated duration range (hours), used for scheduling + `pricingTotalHours`. */
export function estimateMaxWorkHoursFromWizard(data: BookingFormData): number {
  if (data.pricingMode === 'basic' && data.basicPlannedHours != null) {
    return data.basicPlannedHours;
  }
  return calculateJobHours(buildWizardTimeInput(data));
}

/** Human-readable range + max hours for UI copy. */
export function estimateBookingDurationRange(data: BookingFormData): {
  label: string;
  maxHours: number;
  minHours: number;
} {
  if (!data.service) {
    return { label: '—', maxHours: 3, minHours: 1 };
  }
  if (data.pricingMode === 'basic' && data.basicPlannedHours != null) {
    const h = data.basicPlannedHours;
    return {
      label: `${h} hrs`,
      maxHours: h,
      minHours: h,
    };
  }
  const maxH = calculateJobHours(buildWizardTimeInput(data));
  const minH = Math.max(1, Math.ceil(maxH * 0.9 * 2) / 2);
  return {
    label: `Est. ${minH}–${maxH} hrs`,
    maxHours: maxH,
    minHours: minH,
  };
}
