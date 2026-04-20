/**
 * Wizard `BookingFormData` → `CalculateBookingV4Input` for UI (hours, team, duration).
 */

import type { BookingFormData } from '@/components/booking-system-types';
import {
  buildCarpetDetailsForPricing,
  getEffectiveRoomCounts,
} from '@/lib/booking-pricing-input';
import type { CalculateBookingV4Input } from '@/lib/pricing/v4/calculateBookingV4';

export function bookingFormDataToV4Input(data: BookingFormData): CalculateBookingV4Input {
  if (data.service === 'standard' || data.service === 'airbnb') {
    const hasExtraCleaner = (data.extras ?? []).some(
      (id) => id === 'extra_cleaner' || id.includes('extra_cleaner')
    );
    return {
      service_type: data.service === 'standard' ? 'standard' : 'airbnb',
      pricing_mode: data.pricingMode === 'basic' ? 'quick' : 'premium',
      bedrooms: Math.max(1, data.bedrooms),
      bathrooms: Math.max(0, data.bathrooms ?? 0),
      extra_rooms: Math.max(0, data.extraRooms ?? 0),
      extras: data.extras ?? [],
      extrasQuantities: data.extrasQuantities,
      has_extra_cleaner: data.pricingMode !== 'basic' && hasExtraCleaner,
    };
  }

  if (data.service === 'deep' || data.service === 'move') {
    const eff = getEffectiveRoomCounts(data);
    return {
      service_type: data.service === 'deep' ? 'deep' : 'move',
      bedrooms: Math.max(1, eff.bedrooms),
      bathrooms: Math.max(0, eff.bathrooms),
      extra_rooms: 0,
      extras: data.extras ?? [],
      extrasQuantities: data.extrasQuantities,
    };
  }

  if (data.service === 'carpet') {
    const eff = getEffectiveRoomCounts(data);
    return {
      service_type: 'carpet',
      bedrooms: Math.max(1, data.bedrooms),
      bathrooms: 0,
      extra_rooms: 0,
      carpets: data.carpetRooms ?? data.bedrooms,
      rugs: data.carpetRugs ?? eff.bathrooms,
      carpetDetails: buildCarpetDetailsForPricing(data),
      extras: data.extras ?? [],
      extrasQuantities: data.extrasQuantities,
    };
  }

  throw new Error('bookingFormDataToV4Input: unsupported service');
}
