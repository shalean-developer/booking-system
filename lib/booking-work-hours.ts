/**
 * Job duration (hours) for scheduling copy — `calculateBookingV4` only for V4 services.
 */

import type { BookingFormData } from '@/components/booking-system-types';
import { buildWizardTimeInput, calculateJobHours } from '@/lib/time-estimation';
import { calculateBookingV4 } from '@/lib/pricing/v4/calculateBookingV4';
import { bookingFormDataToV4Input } from '@/lib/pricing/v4/booking-form-to-v4';

function v4HoursFromBookingForm(data: BookingFormData): number {
  return calculateBookingV4(bookingFormDataToV4Input(data)).hours;
}

/** Upper bound of the estimated duration range (hours), used for scheduling + `pricingTotalHours`. */
export function estimateMaxWorkHoursFromWizard(data: BookingFormData): number {
  if (data.pricingMode === 'basic' && data.basicPlannedHours != null) {
    return data.basicPlannedHours;
  }
  if (
    data.service === 'standard' ||
    data.service === 'airbnb' ||
    data.service === 'deep' ||
    data.service === 'move' ||
    data.service === 'carpet'
  ) {
    return v4HoursFromBookingForm(data);
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
  const maxH =
    data.service === 'standard' ||
    data.service === 'airbnb' ||
    data.service === 'deep' ||
    data.service === 'move' ||
    data.service === 'carpet'
      ? v4HoursFromBookingForm(data)
      : calculateJobHours(buildWizardTimeInput(data));
  const minH = Math.max(1, Math.ceil(maxH * 0.9 * 2) / 2);
  return {
    label: `Est. ${minH}–${maxH} hrs`,
    maxHours: maxH,
    minHours: minH,
  };
}
