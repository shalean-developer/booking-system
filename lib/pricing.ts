// Central booking price calculation — all amounts in ZAR (not cents). Source: `pricing_config` via `fetchActivePricing`.
// Authoritative labour: `calculateBookingV4` → `calculateFinalBookingPrice` (`lib/pricing/final-pricing.ts`).

import type { ServiceType } from '@/types/booking';
import { fetchActivePricing, type PricingData } from './pricing-db';
import { calculateFinalBookingPrice } from '@/lib/pricing/final-pricing';
import type {
  BookingPriceFrequency,
  CalculateBookingPriceInput,
  BookingPriceResult,
} from '@/lib/pricing/booking-price-types';

export type { PricingData };
export type {
  BookingPriceFrequency,
  CalculateBookingPriceInput,
  UnifiedPricingSnapshot,
  BookingPriceResult,
} from '@/lib/pricing/booking-price-types';

export {
  appliedRulesForLog,
  formatAppliedRulesForDisplay,
  getAppliedRuleIds,
  normalizeAppliedAdminRules,
} from '@/lib/pricing/admin-rule-utils';

/** Fallback / marketing defaults when DB pricing is unavailable (ZAR). */
export const PRICING: PricingData = {
  services: {
    Standard: { base: 250, bedroom: 50, bathroom: 75, extraRoom: 50 },
    Deep: { base: 450, bedroom: 80, bathroom: 120, extraRoom: 80 },
    'Move In/Out': { base: 980, bedroom: 100, bathroom: 150, extraRoom: 100 },
    Airbnb: { base: 280, bedroom: 55, bathroom: 80, extraRoom: 55 },
    Carpet: { base: 55, bedroom: 55, bathroom: 35, extraRoom: 0 },
  },
  extras: {},
  serviceFee: 49,
  frequencyDiscounts: {
    weekly: 15,
    'bi-weekly': 10,
    monthly: 5,
  },
  equipmentChargeZar: 40,
  minimumBookingFeeZar: 0,
};

/** @deprecated Use `calculateFinalBookingPrice` with `PricingData` from the database */
export function calcTotal(input: {
  service: ServiceType | null;
  bedrooms: number;
  bathrooms: number;
  extras: string[];
  extrasQuantities?: Record<string, number>;
}) {
  if (!input.service) return 0;
  return 0;
}

/**
 * Synchronous total — requires pre-fetched `PricingData` (e.g. email/quote routes).
 */
export function calcTotalSync(
  input: CalculateBookingPriceInput,
  frequency: BookingPriceFrequency,
  pricing: PricingData
): BookingPriceResult {
  return calculateFinalBookingPrice(pricing, input, frequency).breakdown.cart;
}

export async function getCurrentPricing(): Promise<PricingData> {
  return fetchActivePricing();
}

export async function getServicePricingAsync(service: ServiceType | null) {
  if (!service) return null;
  const pricing = await fetchActivePricing();
  return pricing.services[service] || null;
}

export async function calcTotalAsync(
  input: CalculateBookingPriceInput,
  frequency: BookingPriceFrequency = 'one-time'
): Promise<BookingPriceResult> {
  const pricing = await fetchActivePricing();
  /** Dynamic demand/supply scores must be merged by server code (`fetchDynamicSignals`); do not import `dynamic-data` here — it pulls `next/headers` and breaks client bundles. */
  return calculateFinalBookingPrice(pricing, input, frequency).breakdown.cart;
}

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
