// Simple pricing model - edit values here

export const PRICING = {
  base: 250, // base fee
  perBedroom: 20, // per bedroom
  perBathroom: 30, // per bathroom
  extras: {
    'Inside Fridge': 60,
    'Inside Oven': 80,
    'Inside Cabinets': 70,
    'Interior Windows': 100,
    'Interior Walls': 120,
    'Water Plants': 40,
    'Ironing': 50,
    'Laundry': 70,
  },
} as const;

export type ExtraKey = keyof typeof PRICING.extras;

/**
 * Calculate total booking price based on service type, home details, and extras
 */
export function calcTotal(input: {
  service: 'Standard' | 'Deep' | 'Move In/Out' | 'Airbnb' | null;
  bedrooms: number;
  bathrooms: number;
  extras: string[];
}) {
  // Apply service multiplier to base fee
  const baseMultiplier =
    input.service === 'Deep' ? 1.4 :
    input.service === 'Move In/Out' ? 1.6 :
    input.service === 'Airbnb' ? 1.2 : 1;

  const base = PRICING.base * baseMultiplier;
  const beds = input.bedrooms * PRICING.perBedroom;
  const baths = input.bathrooms * PRICING.perBathroom;
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

