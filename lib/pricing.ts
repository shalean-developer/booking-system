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
    'Laundry & Ironing': 75,
    'Carpet Cleaning': 120,
    'Ceiling Cleaning': 85,
    'Garage Cleaning': 110,
    'Balcony Cleaning': 90,
    'Couch Cleaning': 130,
    'Outside Window Cleaning': 125,
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
  extrasQuantities?: Record<string, number>;
}) {
  if (!input.service) return 0;

  const servicePricing = PRICING.services[input.service];
  if (!servicePricing) return 0;

  const base = servicePricing.base;
  const beds = (input.bedrooms || 0) * servicePricing.bedroom;
  const baths = (input.bathrooms || 0) * servicePricing.bathroom;
  const extras = input.extras.reduce((sum, extraName) => {
    const quantity = input.extrasQuantities?.[extraName] ?? 1;
    const unitPrice = PRICING.extras[extraName as ExtraKey] ?? 0;
    return sum + unitPrice * Math.max(quantity, 1);
  }, 0);

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
    extrasQuantities?: Record<string, number>;
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
  const beds = (input.bedrooms || 0) * servicePricing.bedroom;
  const baths = (input.bathrooms || 0) * servicePricing.bathroom;
  const extrasTotal = input.extras.reduce((sum, extraName) => {
    const quantity = input.extrasQuantities?.[extraName] ?? 1;
    const unitPrice = PRICING.extras[extraName as ExtraKey] ?? 0;
    return sum + unitPrice * Math.max(quantity, 1);
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
    extrasQuantities?: Record<string, number>;
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

    // Validate service pricing values and use fallback if invalid
    const fallbackPricing = PRICING.services[input.service];
    let useFallback = false;
    const validationIssues: string[] = [];
    
    if (fallbackPricing) {
      // Check if database values are suspiciously different from fallback
      const baseDiff = Math.abs(servicePricing.base - fallbackPricing.base);
      const bedroomDiff = Math.abs(servicePricing.bedroom - fallbackPricing.bedroom);
      const bathroomDiff = Math.abs(servicePricing.bathroom - fallbackPricing.bathroom);
      
      // Validation thresholds (use fallback if exceeded)
      const baseThreshold = fallbackPricing.base * 2; // More than 2x fallback
      const bedroomThreshold = fallbackPricing.bedroom * 5; // More than 5x fallback
      const bathroomThreshold = fallbackPricing.bathroom * 5; // More than 5x fallback
      
      if (servicePricing.base > baseThreshold || baseDiff > fallbackPricing.base * 0.5) {
        useFallback = true;
        validationIssues.push(`Base price invalid: R${servicePricing.base} (fallback: R${fallbackPricing.base})`);
      }
      if (servicePricing.bedroom > bedroomThreshold) {
        useFallback = true;
        validationIssues.push(`Bedroom price invalid: R${servicePricing.bedroom} (fallback: R${fallbackPricing.bedroom})`);
      }
      if (servicePricing.bathroom > bathroomThreshold) {
        useFallback = true;
        validationIssues.push(`Bathroom price invalid: R${servicePricing.bathroom} (fallback: R${fallbackPricing.bathroom})`);
      }
      
      if (useFallback) {
        const dbValues = {
          base: servicePricing.base,
          bedroom: servicePricing.bedroom,
          bathroom: servicePricing.bathroom
        };
        const fallbackValues = {
          base: fallbackPricing.base,
          bedroom: fallbackPricing.bedroom,
          bathroom: fallbackPricing.bathroom
        };
        
        console.warn(`⚠️ Invalid database pricing detected for ${input.service}. Automatically using fallback pricing.`);
        console.warn('Database values:', dbValues);
        console.warn('Fallback values:', fallbackValues);
        console.warn('Validation issues:', validationIssues);
        console.info(`ℹ️ Corrected pricing for ${input.service}: Base=R${fallbackPricing.base}, Bedroom=R${fallbackPricing.bedroom}, Bathroom=R${fallbackPricing.bathroom}`);
        
        // Use fallback pricing instead
        servicePricing.base = fallbackPricing.base;
        servicePricing.bedroom = fallbackPricing.bedroom;
        servicePricing.bathroom = fallbackPricing.bathroom;
      } else if (baseDiff > fallbackPricing.base * 0.5 || servicePricing.base > fallbackPricing.base * 2) {
        console.warn(`⚠️ Database base price for ${input.service} differs significantly from fallback:`, {
          database: servicePricing.base,
          fallback: fallbackPricing.base,
          difference: baseDiff
        });
      }
    }

    // Calculate base + rooms + extras (using validated/fallback pricing)
    const base = servicePricing.base;
    const beds = (input.bedrooms || 0) * servicePricing.bedroom;
    const baths = (input.bathrooms || 0) * servicePricing.bathroom;
    
    // Check for duplicate extras in input
    const uniqueExtras = Array.from(new Set(input.extras));
    if (uniqueExtras.length !== input.extras.length) {
      const duplicates = input.extras.filter((item, index) => input.extras.indexOf(item) !== index);
      console.warn(`⚠️ Duplicate extras detected in input:`, duplicates);
    }
    
    const extrasBreakdown: Array<{ name: string; quantity: number; unitPrice: number; total: number }> = [];
    const extrasTotal = uniqueExtras.reduce((sum, extraName) => {
      const quantity = input.extrasQuantities?.[extraName] ?? 1;
      // Normalize extra name for case-insensitive lookup
      const normalizedName = extraName.trim();
      let unitPrice = pricing.extras[normalizedName] ?? 0;
      
      // Try case-insensitive lookup if exact match failed
      if (unitPrice === 0) {
        const matchingKey = Object.keys(pricing.extras).find(
          key => key.toLowerCase().trim() === normalizedName.toLowerCase()
        );
        if (matchingKey) {
          unitPrice = pricing.extras[matchingKey] ?? 0;
        }
      }
      
      // Fallback to PRICING constant if still 0
      if (unitPrice === 0) {
        unitPrice = PRICING.extras[normalizedName as ExtraKey] ?? 0;
      }
      
      const totalPrice = unitPrice * Math.max(quantity, 1);
      extrasBreakdown.push({
        name: extraName,
        quantity: Math.max(quantity, 1),
        unitPrice,
        total: totalPrice
      });
      
      return sum + totalPrice;
    }, 0);

    const subtotal = base + beds + baths + extrasTotal;

    // Validate and use fallback service fee if invalid
    let serviceFee = pricing.serviceFee ?? PRICING.serviceFee ?? 0;
    const fallbackServiceFee = PRICING.serviceFee;
    
    // Service fee should be R50, allow R40 as acceptable variation
    if (serviceFee > 0 && serviceFee !== 50 && serviceFee !== 40) {
      console.warn(`⚠️ Service fee seems unusual: R${serviceFee} (fallback: R${fallbackServiceFee}). Using fallback.`);
      serviceFee = fallbackServiceFee;
    } else if (serviceFee === 0 && fallbackServiceFee > 0) {
      // If database has 0 or null, use fallback
      serviceFee = fallbackServiceFee;
    }

    // Calculate frequency discount
    const discountPercent = frequency !== 'one-time' 
      ? (pricing.frequencyDiscounts[frequency] || 0)
      : 0;
    const frequencyDiscount = (subtotal * discountPercent) / 100;

    // Calculate total
    const total = Math.round(subtotal + serviceFee - frequencyDiscount);

    // Detailed logging for debugging
    console.log(`💰 calcTotalAsync Calculation Breakdown for ${input.service}:`, {
      input: {
        bedrooms: input.bedrooms,
        bathrooms: input.bathrooms,
        extras: input.extras,
        extrasCount: input.extras.length,
        uniqueExtrasCount: uniqueExtras.length,
        extrasQuantities: input.extrasQuantities,
        frequency
      },
      pricing: {
        base,
        bedroom: servicePricing.bedroom,
        bathroom: servicePricing.bathroom,
        serviceFee,
        fallbackBase: fallbackPricing?.base,
        fallbackBedroom: fallbackPricing?.bedroom,
        fallbackBathroom: fallbackPricing?.bathroom,
        fallbackServiceFee: PRICING.serviceFee,
        usedFallback: useFallback,
        validationIssues: validationIssues.length > 0 ? validationIssues : undefined
      },
      calculation: {
        base,
        beds,
        baths,
        extrasBreakdown,
        extrasTotal,
        subtotal,
        serviceFee,
        frequencyDiscount,
        discountPercent,
        total
      }
    });

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
    if (!servicePricing) {
      console.error(`⚠️ Service pricing not found for ${input.service} in fallback`);
      return {
        subtotal: 0,
        serviceFee: 0,
        frequencyDiscount: 0,
        frequencyDiscountPercent: 0,
        total: 0,
      };
    }
    
    const base = servicePricing.base;
    const beds = (input.bedrooms || 0) * servicePricing.bedroom;
    const baths = (input.bathrooms || 0) * servicePricing.bathroom;
    const extrasTotal = input.extras.reduce((sum, extraName) => {
      const quantity = input.extrasQuantities?.[extraName] ?? 1;
      const unitPrice = PRICING.extras[extraName as ExtraKey] ?? 0;
      return sum + unitPrice * Math.max(quantity, 1);
    }, 0);

    const subtotal = base + beds + baths + extrasTotal;
    const serviceFee = PRICING.serviceFee ?? 0;
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

