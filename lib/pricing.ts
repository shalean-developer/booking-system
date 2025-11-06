// Service-specific pricing model with dynamic database support

import type { ServiceType } from '@/types/booking';
import { fetchActivePricing, type PricingData } from './pricing-db';

// Re-export PricingData for convenience
export type { PricingData };

// Fallback pricing structure (used when database is unavailable)
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
  serviceFee: 50,
  frequencyDiscounts: {
    'weekly': 15,
    'bi-weekly': 10,
    'monthly': 5,
  },
} as const;

export type ExtraKey = keyof typeof PRICING.extras;

/**
 * Get service-specific pricing rates (synchronous - uses fallback)
 * @deprecated Use getCurrentPricing() for dynamic database pricing
 */
export function getServicePricing(service: ServiceType | null) {
  if (!service) return null;
  return PRICING.services[service];
}

/**
 * Get current pricing from database (async)
 * Falls back to hardcoded PRICING if database is unavailable
 */
export async function getCurrentPricing(): Promise<PricingData> {
  try {
    return await fetchActivePricing();
  } catch (error) {
    console.warn('⚠️ Failed to fetch pricing from database, using fallback:', error);
    return PRICING as PricingData;
  }
}

/**
 * Get service-specific pricing from database (async)
 */
export async function getServicePricingAsync(service: ServiceType | null) {
  if (!service) return null;
  
  try {
    const pricing = await fetchActivePricing();
    return pricing.services[service] || null;
  } catch (error) {
    console.warn('⚠️ Failed to fetch pricing from database, using fallback:', error);
    return PRICING.services[service] || null;
  }
}

/**
 * Calculate total booking price (synchronous - uses fallback pricing)
 * @deprecated Use calcTotalAsync() for dynamic database pricing
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
 * Calculate total booking price with service fee and frequency discount (synchronous)
 * Uses fallback PRICING constant for immediate calculation
 * @param input Booking details
 * @param frequency Booking frequency: 'one-time', 'weekly', 'bi-weekly', 'monthly'
 * @returns Object with subtotal, serviceFee, discount, and total
 */
export function calcTotalSync(
  input: {
    service: ServiceType | null;
    bedrooms: number;
    bathrooms: number;
    extras: string[];
  },
  frequency: 'one-time' | 'weekly' | 'bi-weekly' | 'monthly' = 'one-time'
): {
  subtotal: number;
  serviceFee: number;
  frequencyDiscount: number;
  frequencyDiscountPercent: number;
  total: number;
} {
  if (!input.service) {
    return {
      subtotal: 0,
      serviceFee: 0,
      frequencyDiscount: 0,
      frequencyDiscountPercent: 0,
      total: 0,
    };
  }

  const servicePricing = PRICING.services[input.service];
  if (!servicePricing) {
    return {
      subtotal: 0,
      serviceFee: 0,
      frequencyDiscount: 0,
      frequencyDiscountPercent: 0,
      total: 0,
    };
  }

  // Calculate base + rooms + extras
  const base = servicePricing.base;
  const beds = input.bedrooms * servicePricing.bedroom;
  const baths = input.bathrooms * servicePricing.bathroom;
  const extrasTotal = input.extras.reduce((sum, extraName) => {
    return sum + (PRICING.extras[extraName as ExtraKey] ?? 0);
  }, 0);

  const subtotal = base + beds + baths + extrasTotal;

  // Add service fee
  const serviceFee = PRICING.serviceFee;

  // Calculate frequency discount
  const discountPercent = frequency !== 'one-time' 
    ? (PRICING.frequencyDiscounts[frequency] || 0)
    : 0;
  const frequencyDiscount = (subtotal * discountPercent) / 100;

  // Calculate total
  const total = Math.round(subtotal + serviceFee - frequencyDiscount);

  return {
    subtotal: Math.round(subtotal),
    serviceFee: Math.round(serviceFee),
    frequencyDiscount: Math.round(frequencyDiscount),
    frequencyDiscountPercent: discountPercent,
    total,
  };
}

/**
 * Calculate total booking price with service fee and frequency discount (async)
 * @param input Booking details
 * @param frequency Booking frequency: 'one-time', 'weekly', 'bi-weekly', 'monthly'
 * @returns Object with subtotal, serviceFee, discount, and total
 */
export async function calcTotalAsync(
  input: {
    service: ServiceType | null;
    bedrooms: number;
    bathrooms: number;
    extras: string[];
  },
  frequency: 'one-time' | 'weekly' | 'bi-weekly' | 'monthly' = 'one-time'
): Promise<{
  subtotal: number;
  serviceFee: number;
  frequencyDiscount: number;
  frequencyDiscountPercent: number;
  total: number;
}> {
  if (!input.service) {
    return {
      subtotal: 0,
      serviceFee: 0,
      frequencyDiscount: 0,
      frequencyDiscountPercent: 0,
      total: 0,
    };
  }

  try {
    const pricing = await fetchActivePricing();

    const servicePricing = pricing.services[input.service];
    if (!servicePricing) {
      throw new Error(`Service pricing not found for ${input.service}`);
    }

    // Calculate base + rooms + extras
    const base = servicePricing.base;
    const beds = input.bedrooms * servicePricing.bedroom;
    const baths = input.bathrooms * servicePricing.bathroom;
    const extrasTotal = input.extras.reduce((sum, extraName) => {
      return sum + (pricing.extras[extraName] ?? 0);
    }, 0);

    const subtotal = base + beds + baths + extrasTotal;

    // Add service fee
    const serviceFee = pricing.serviceFee || 0;

    // Calculate frequency discount
    const discountPercent = frequency !== 'one-time' 
      ? (pricing.frequencyDiscounts[frequency] || 0)
      : 0;
    const frequencyDiscount = (subtotal * discountPercent) / 100;

    // Calculate total
    const total = Math.round(subtotal + serviceFee - frequencyDiscount);

    return {
      subtotal: Math.round(subtotal),
      serviceFee: Math.round(serviceFee),
      frequencyDiscount: Math.round(frequencyDiscount),
      frequencyDiscountPercent: discountPercent,
      total,
    };
  } catch (error) {
    console.warn('⚠️ Failed to calculate total from database, using fallback:', error);

    // Fallback calculation
    const servicePricing = PRICING.services[input.service];
    const base = servicePricing.base;
    const beds = input.bedrooms * servicePricing.bedroom;
    const baths = input.bathrooms * servicePricing.bathroom;
    const extrasTotal = input.extras.reduce((sum, extraName) => {
      return sum + (PRICING.extras[extraName as ExtraKey] ?? 0);
    }, 0);

    const subtotal = base + beds + baths + extrasTotal;
    const serviceFee = PRICING.serviceFee;
    const discountPercent = frequency !== 'one-time' 
      ? (PRICING.frequencyDiscounts[frequency] || 0)
      : 0;
    const frequencyDiscount = (subtotal * discountPercent) / 100;
    const total = Math.round(subtotal + serviceFee - frequencyDiscount);

    return {
      subtotal: Math.round(subtotal),
      serviceFee: Math.round(serviceFee),
      frequencyDiscount: Math.round(frequencyDiscount),
      frequencyDiscountPercent: discountPercent,
      total,
    };
  }
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

