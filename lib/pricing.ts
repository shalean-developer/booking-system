// Service-specific pricing model

import type { ServiceType } from '@/types/booking';

// Service-specific pricing structure
export const PRICING = {
  services: {
    'Standard': { base: 250, bedroom: 20, bathroom: 30 },
    'Deep': { base: 1200, bedroom: 180, bathroom: 250 },
    'Move In/Out': { base: 980, bedroom: 160, bathroom: 220 },
    'Airbnb': { base: 230, bedroom: 18, bathroom: 26 },
  },
  extras: {
    'Inside Fridge': 30,
    'Inside Oven': 30,
    'Inside Cabinets': 30,
    'Interior Windows': 40,
    'Interior Walls': 35,
    'Ironing': 35,
    'Laundry': 40,
  },
} as const;

export type ExtraKey = keyof typeof PRICING.extras;

/**
 * Get service-specific pricing rates
 */
export function getServicePricing(service: ServiceType | null) {
  if (!service) return null;
  return PRICING.services[service];
}

/**
 * Calculate total booking price based on service type, home details, and extras
 */
export function calcTotal(input: {
  service: ServiceType | null;
  bedrooms: number;
  bathrooms: number;
  extras: string[];
}) {
  if (!input.service) return 0;

  const servicePricing = PRICING.services[input.service];
  if (!servicePricing) return 0;

  const base = servicePricing.base;
  const beds = input.bedrooms * servicePricing.bedroom;
  const baths = input.bathrooms * servicePricing.bathroom;
  const extras = input.extras.reduce(
    (sum, k) => sum + (PRICING.extras[k as ExtraKey] ?? 0),
    0
  );

  return Math.round(base + beds + baths + extras);
}

/**
 * Generate time slots from 07:00 to 13:00 in 30-minute intervals
 */
export function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let hour = 7; hour <= 13; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
    if (hour < 13) {
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
  }
  return slots;
}

