// Central booking price calculation — all amounts in ZAR (not cents). Source: `pricing_config` via `fetchActivePricing`.

import type { ServiceType } from '@/types/booking';
import { fetchActivePricing, type PricingData } from './pricing-db';

export type { PricingData };

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

export type BookingPriceFrequency = 'one-time' | 'weekly' | 'bi-weekly' | 'monthly';

export type CalculateBookingPriceInput = {
  service: ServiceType | null;
  bedrooms: number;
  bathrooms: number;
  /** Additional rooms (kitchen/lounge/etc.) priced same as bedroom when no dedicated DB column exists. */
  extraRooms?: number;
  extras: string[];
  extrasQuantities?: Record<string, number>;
  carpetDetails?: {
    hasFittedCarpets: boolean;
    hasLooseCarpets: boolean;
    numberOfRooms: number;
    numberOfLooseCarpets: number;
    roomStatus: 'empty' | 'hasProperty';
  } | null;
  provideEquipment?: boolean;
  equipmentChargeOverride?: number;
  /** Standard / Airbnb: labor multiplier (default 1) */
  numberOfCleaners?: number;
};

export type BookingPriceResult = {
  subtotal: number;
  serviceFee: number;
  frequencyDiscount: number;
  frequencyDiscountPercent: number;
  /** After service fee and frequency discount; before promo/tip/surge */
  total: number;
  minimumApplied: number;
  breakdown: {
    base: number;
    bedrooms: number;
    bathrooms: number;
    extraRooms: number;
    carpetFitted: number;
    carpetLoose: number;
    carpetOccupiedFee: number;
    extrasTotal: number;
    equipmentCharge: number;
    laborSubtotalOneCleaner: number;
    numberOfCleaners: number;
  };
};

function roundZar(n: number): number {
  return Math.round(n);
}

function resolveExtraUnitPrice(
  pricing: PricingData,
  extraName: string
): number {
  const normalized = extraName.trim();
  let unit = pricing.extras[normalized] ?? 0;
  if (unit === 0) {
    const key = Object.keys(pricing.extras).find(
      (k) => k.toLowerCase().trim() === normalized.toLowerCase()
    );
    if (key) unit = pricing.extras[key] ?? 0;
  }
  if (unit === 0) {
    const normalizeToken = (v: string) => v.toLowerCase().replace(/[^a-z0-9]/g, '');
    const wanted = normalizeToken(normalized);
    const key = Object.keys(pricing.extras).find((k) => normalizeToken(k) === wanted);
    if (key) unit = pricing.extras[key] ?? 0;
  }
  return unit;
}

/**
 * Single source of truth for booking totals (ZAR). Used by client (with cached form-data pricing) and server (`calcTotalAsync`).
 */
export function calculateBookingPrice(
  pricing: PricingData,
  input: CalculateBookingPriceInput,
  frequency: BookingPriceFrequency = 'one-time'
): BookingPriceResult {
  const empty: BookingPriceResult = {
    subtotal: 0,
    serviceFee: 0,
    frequencyDiscount: 0,
    frequencyDiscountPercent: 0,
    total: 0,
    minimumApplied: 0,
    breakdown: {
      base: 0,
      bedrooms: 0,
      bathrooms: 0,
      extraRooms: 0,
      carpetFitted: 0,
      carpetLoose: 0,
      carpetOccupiedFee: 0,
      extrasTotal: 0,
      equipmentCharge: 0,
      laborSubtotalOneCleaner: 0,
      numberOfCleaners: 1,
    },
  };

  if (!input.service) return empty;

  const servicePricing = pricing.services[input.service];
  if (!servicePricing) return empty;

  const equipmentChargeDefault = pricing.equipmentChargeZar ?? 0;
  const carpetOccupiedFee =
    pricing.extras['Carpet occupied property'] ??
    pricing.extras['Carpet property occupied'] ??
    pricing.extras['Extra Cleaner'] ??
    pricing.extras['Carpet extra cleaner'] ??
    0;

  // --- Carpet ---
  if (input.service === 'Carpet' && input.carpetDetails) {
    const cd = input.carpetDetails;
    const base = servicePricing.base;
    const fitted = cd.hasFittedCarpets ? cd.numberOfRooms * servicePricing.bedroom : 0;
    const loose = cd.hasLooseCarpets ? cd.numberOfLooseCarpets * servicePricing.bathroom : 0;
    const occupied =
      cd.roomStatus === 'hasProperty' ? carpetOccupiedFee : 0;

    const uniqueExtras = Array.from(new Set(input.extras.map((e) => e.trim())));
    let extrasTotal = 0;
    for (const name of uniqueExtras) {
      const q = input.extrasQuantities?.[name] ?? 1;
      extrasTotal += resolveExtraUnitPrice(pricing, name) * Math.max(1, q);
    }

    const labor = base + fitted + loose + occupied + extrasTotal;
    const serviceFee = pricing.serviceFee ?? 0;
    const discountPercent =
      frequency !== 'one-time' ? pricing.frequencyDiscounts[frequency] ?? 0 : 0;
    const frequencyDiscount = (labor * discountPercent) / 100;
    let total = roundZar(labor + serviceFee - frequencyDiscount);
    const minFee = pricing.minimumBookingFeeZar ?? 0;
    let minimumApplied = 0;
    if (minFee > 0 && total < minFee) {
      minimumApplied = minFee - total;
      total = minFee;
    }

    return {
      subtotal: roundZar(labor),
      serviceFee: roundZar(serviceFee),
      frequencyDiscount: roundZar(frequencyDiscount),
      frequencyDiscountPercent: discountPercent,
      total,
      minimumApplied: roundZar(minimumApplied),
      breakdown: {
        base,
        bedrooms: fitted,
        bathrooms: loose,
        extraRooms: 0,
        carpetFitted: fitted,
        carpetLoose: loose,
        carpetOccupiedFee: occupied,
        extrasTotal: roundZar(extrasTotal),
        equipmentCharge: 0,
        laborSubtotalOneCleaner: roundZar(labor),
        numberOfCleaners: 1,
      },
    };
  }

  // --- Standard services ---
  const base = servicePricing.base;
  const beds = (input.bedrooms || 0) * servicePricing.bedroom;
  const baths = (input.bathrooms || 0) * servicePricing.bathroom;
  const extraRoomUnit = servicePricing.extraRoom > 0 ? servicePricing.extraRoom : servicePricing.bedroom;
  const extraRooms = (input.extraRooms || 0) * extraRoomUnit;

  const uniqueExtras = Array.from(new Set(input.extras.map((e) => e.trim())));
  let extrasTotal = 0;
  for (const name of uniqueExtras) {
    const q = input.extrasQuantities?.[name] ?? 1;
    extrasTotal += resolveExtraUnitPrice(pricing, name) * Math.max(1, q);
  }

  let equipmentCharge = 0;
  if (input.provideEquipment && (input.service === 'Standard' || input.service === 'Airbnb')) {
    equipmentCharge = input.equipmentChargeOverride ?? equipmentChargeDefault;
  }

  const laborSubtotalOneCleaner = base + beds + baths + extraRooms + extrasTotal;
  const numberOfCleaners = Math.max(1, Math.round(input.numberOfCleaners ?? 1));
  const laborScaled =
    input.service === 'Standard' || input.service === 'Airbnb'
      ? laborSubtotalOneCleaner * numberOfCleaners + equipmentCharge
      : laborSubtotalOneCleaner + equipmentCharge;

  const serviceFee = pricing.serviceFee ?? 0;
  const discountPercent =
    frequency !== 'one-time' ? pricing.frequencyDiscounts[frequency] ?? 0 : 0;
  const frequencyDiscount = (laborScaled * discountPercent) / 100;
  let total = roundZar(laborScaled + serviceFee - frequencyDiscount);
  const minFee = pricing.minimumBookingFeeZar ?? 0;
  let minimumApplied = 0;
  if (minFee > 0 && total < minFee) {
    minimumApplied = minFee - total;
    total = minFee;
  }

    return {
      subtotal: roundZar(laborScaled),
      serviceFee: roundZar(serviceFee),
      frequencyDiscount: roundZar(frequencyDiscount),
      frequencyDiscountPercent: discountPercent,
      total,
      minimumApplied: roundZar(minimumApplied),
      breakdown: {
        base,
        bedrooms: beds,
        bathrooms: baths,
        extraRooms,
        carpetFitted: 0,
        carpetLoose: 0,
        carpetOccupiedFee: 0,
        extrasTotal: roundZar(extrasTotal),
        equipmentCharge: roundZar(equipmentCharge),
        laborSubtotalOneCleaner: roundZar(laborSubtotalOneCleaner),
        numberOfCleaners,
      },
    };
  }

/** @deprecated Use `calculateBookingPrice` with `PricingData` from the database */
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
  return calculateBookingPrice(pricing, input, frequency);
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
  return calculateBookingPrice(pricing, input, frequency);
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
