import type { CalculateBookingPriceInput } from '@/lib/pricing';
import type { ServiceType } from '@/types/booking';

const SERVICE_TYPES: ServiceType[] = ['Standard', 'Deep', 'Move In/Out', 'Airbnb', 'Carpet'];

function isRecord(v: unknown): v is Record<string, number> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function pickQuantities(v: unknown): Record<string, number> {
  if (!isRecord(v)) return {};
  const out: Record<string, number> = {};
  for (const [k, val] of Object.entries(v)) {
    const n = Number(val);
    if (Number.isFinite(n)) out[k] = n;
  }
  return out;
}

/** Price snapshot fragment (booking row or nested). */
export type PriceSnapshotPricingFragment = {
  extras?: string[] | null;
  extrasQuantities?: Record<string, number> | null;
  extras_quantities?: Record<string, number> | null;
  service?: {
    type?: string | null;
    numberOfCleaners?: number | null;
    bedroom?: number | null;
    bathroom?: number | null;
  } | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
};

/**
 * Raw booking-like data from API bodies, DB rows, schedules, or forms.
 * Multiple naming conventions are merged (see normalizePricingInput).
 */
export type RawBookingLikePricing = {
  service?: ServiceType | string | null;
  service_type?: string | null;
  serviceType?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  extraRooms?: number | null;
  extras?: string[] | null;
  extrasQuantities?: Record<string, number> | null;
  extras_quantities?: Record<string, number> | null;
  numberOfCleaners?: number | null;
  number_of_cleaners?: number | null;
  team_size?: number | null;
  provideEquipment?: boolean | null;
  equipmentChargeOverride?: number | null;
  carpetDetails?: CalculateBookingPriceInput['carpetDetails'];
  price_snapshot?: PriceSnapshotPricingFragment | null;
};

function resolveService(raw: RawBookingLikePricing): ServiceType | null {
  const candidates = [
    raw.service,
    raw.service_type,
    raw.serviceType,
    raw.price_snapshot?.service?.type,
  ];
  for (const c of candidates) {
    if (c == null || String(c).trim() === '') continue;
    const s = String(c).trim();
    if ((SERVICE_TYPES as string[]).includes(s)) return s as ServiceType;
  }
  return null;
}

function resolveNumberOfCleaners(raw: RawBookingLikePricing): number | undefined {
  const candidates = [
    raw.numberOfCleaners,
    raw.number_of_cleaners,
    raw.team_size,
    raw.price_snapshot?.service?.numberOfCleaners,
  ];
  for (const c of candidates) {
    if (c == null || !Number.isFinite(Number(c))) continue;
    return Math.max(1, Math.round(Number(c)));
  }
  return undefined;
}

/**
 * Merge extras quantity maps: snapshot (snake + camel) then top-level (snake + camel). Later keys win.
 */
export function mergeExtrasQuantitiesFromRaw(raw: RawBookingLikePricing): Record<string, number> {
  const snap = raw.price_snapshot;
  return {
    ...pickQuantities(snap?.extras_quantities),
    ...pickQuantities(snap?.extrasQuantities),
    ...pickQuantities(raw.extras_quantities),
    ...pickQuantities(raw.extrasQuantities),
  };
}

function roundRoom(n: unknown, fallback: number): number {
  const v = n != null && Number.isFinite(Number(n)) ? Math.round(Number(n)) : fallback;
  return Math.max(1, v);
}

function roundExtraRooms(n: unknown): number {
  if (n == null || !Number.isFinite(Number(n))) return 0;
  return Math.max(0, Math.round(Number(n)));
}

/**
 * Single catalog-pricing input for `calcTotalAsync` / `calculateBookingPrice`.
 * Throws if `service` cannot be resolved.
 */
export function normalizePricingInput(raw: RawBookingLikePricing): CalculateBookingPriceInput {
  const service = resolveService(raw);
  if (!service) {
    throw new Error('normalizePricingInput: missing or invalid `service` (expected a known ServiceType)');
  }

  const snap = raw.price_snapshot;
  const bedrooms = roundRoom(
    raw.bedrooms ?? snap?.bedrooms ?? snap?.service?.bedroom,
    1
  );
  const bathrooms = roundRoom(
    raw.bathrooms ?? snap?.bathrooms ?? snap?.service?.bathroom,
    1
  );
  const extraRooms = roundExtraRooms(raw.extraRooms);

  const mergedQuantities = mergeExtrasQuantitiesFromRaw(raw);
  let extras = Array.isArray(raw.extras) ? [...raw.extras] : [];
  if (extras.length === 0 && Object.keys(mergedQuantities).length > 0) {
    extras = Object.keys(mergedQuantities);
  }

  const numberOfCleaners = resolveNumberOfCleaners(raw);

  const equipmentChargeOverride =
    raw.equipmentChargeOverride != null && Number.isFinite(raw.equipmentChargeOverride)
      ? Number(raw.equipmentChargeOverride)
      : undefined;

  const carpetDetails =
    raw.carpetDetails !== undefined ? raw.carpetDetails : null;

  const input: CalculateBookingPriceInput = {
    service,
    bedrooms,
    bathrooms,
    extraRooms,
    extras,
    extrasQuantities: mergedQuantities,
    carpetDetails,
  };

  if (raw.provideEquipment === true) {
    input.provideEquipment = true;
  }
  if (equipmentChargeOverride !== undefined) {
    input.equipmentChargeOverride = equipmentChargeOverride;
  }
  if (numberOfCleaners !== undefined) {
    input.numberOfCleaners = numberOfCleaners;
  }

  return input;
}
