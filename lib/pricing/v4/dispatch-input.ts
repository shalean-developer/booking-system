/**
 * Map booking dispatch payloads to `CalculateBookingV4Input` — single path for duration/team.
 */

import type { CalculateBookingV4Input } from '@/lib/pricing/v4/calculateBookingV4';

export function dispatchBodyToV4Input(input: {
  service?: string | null;
  pricingMode?: 'basic' | 'premium' | null;
  bedrooms?: number;
  bathrooms?: number;
  extraRooms?: number;
  extras: string[];
  extrasQuantities?: Record<string, number>;
}): CalculateBookingV4Input | null {
  const svc = (input.service ?? '').trim();
  if (svc === 'Standard' || svc === 'Airbnb') {
    const hasX = (input.extras || []).some(
      (id) => id === 'extra_cleaner' || id.includes('extra_cleaner')
    );
    return {
      service_type: svc === 'Standard' ? 'standard' : 'airbnb',
      pricing_mode: input.pricingMode === 'basic' ? 'quick' : 'premium',
      bedrooms: Math.max(1, input.bedrooms ?? 1),
      bathrooms: Math.max(0, input.bathrooms ?? 0),
      extra_rooms: Math.max(0, input.extraRooms ?? 0),
      extras: input.extras || [],
      extrasQuantities: input.extrasQuantities,
      has_extra_cleaner: input.pricingMode !== 'basic' && hasX,
    };
  }
  if (svc === 'Deep') {
    return {
      service_type: 'deep',
      bedrooms: Math.max(1, input.bedrooms ?? 1),
      bathrooms: Math.max(0, input.bathrooms ?? 0),
      extra_rooms: 0,
      extras: input.extras || [],
      extrasQuantities: input.extrasQuantities,
    };
  }
  if (svc === 'Move In/Out') {
    return {
      service_type: 'move',
      bedrooms: Math.max(1, input.bedrooms ?? 1),
      bathrooms: Math.max(0, input.bathrooms ?? 0),
      extra_rooms: 0,
      extras: input.extras || [],
      extrasQuantities: input.extrasQuantities,
    };
  }
  if (svc === 'Carpet') {
    const rooms = Math.max(1, input.bedrooms ?? 1);
    return {
      service_type: 'carpet',
      bedrooms: rooms,
      bathrooms: 0,
      extra_rooms: 0,
      carpets: rooms,
      rugs: Math.max(0, input.bathrooms ?? 0),
      extras: input.extras || [],
      extrasQuantities: input.extrasQuantities,
    };
  }
  return null;
}
