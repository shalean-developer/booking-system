/**
 * Unified deterministic pricing + time engine (V4) — Shalean Cleaning Services.
 * Single table-based path for Standard, Airbnb, Deep, Move In/Out, and Carpet.
 */

import { roundPrice } from '@/lib/pricing/rounding';
import {
  capExtraRoomsForLineItems,
  lookupPremiumPriceZar,
  lookupQuickPriceZar,
  lookupTimeHours,
  PREMIUM_EXTRA_ROOM_PRICE_ZAR,
  PREMIUM_EXTRA_ROOM_TIME_H,
  QUICK_EXTRA_ROOM_PRICE_ZAR,
  QUICK_EXTRA_ROOM_TIME_H,
} from '@/lib/pricing/tables';
import { sumUnifiedExtras } from '@/lib/pricing/extras';

export type V4ServiceType = 'standard' | 'airbnb' | 'deep' | 'move' | 'carpet';

/** Legacy carpet shape — normalized once at entry; not read after normalization. */
export type CarpetDetailsLike = {
  numberOfRooms?: number;
  numberOfLooseCarpets?: number;
} | null;

export type CalculateBookingV4Input = {
  service_type: V4ServiceType;
  /** Only used for standard / airbnb */
  pricing_mode?: 'quick' | 'premium';
  bedrooms: number;
  bathrooms: number;
  extra_rooms: number;
  /** Carpet: prefer over `bedrooms` / legacy fields after normalization in V4. */
  carpets?: number;
  /** Carpet: loose rugs count (column axis). */
  rugs?: number;
  /** @deprecated Use `carpets` / `rugs` — read only for normalization at top. */
  carpetDetails?: CarpetDetailsLike;
  extras: string[];
  extrasQuantities?: Record<string, number> | null;
  /** Standard / Airbnb premium only */
  has_extra_cleaner?: boolean;
};

export type CalculateBookingV4Result = {
  price_zar: number;
  total_amount_cents: number;
  table_price_zar: number;
  extra_room_price_zar: number;
  extras_price_zar: number;
  extras_time_hours: number;
  cleaning_subtotal_zar: number;
  hours: number;
  duration: number;
  team_size: number;
  /** cleaning_subtotal_zar / hours — for analytics; hours guarded. */
  effective_hourly_rate_zar: number;
  /** Set for carpet — normalized counts (5+ cap). */
  carpets?: number;
  rugs?: number;
};

export class BookingV4ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BookingV4ValidationError';
  }
}

const CARPET_MIN_H = 1.5;
const CARPET_MAX_H = 5.5;
const DEEP_MOVE_MIN_H = 6;
const STD_AIR_MIN_H = 3.5;
const STD_AIR_MAX_H = 9;

/** Deep / Move — price (ZAR). Rows: beds 1–4, 5+. Cols: baths 1–4, 5+. */
const DEEP_PRICE_ZAR: number[][] = [
  [1650, 1900, 2150, 2400, 2650],
  [1850, 2100, 2350, 2600, 2850],
  [2050, 2300, 2550, 2800, 3050],
  [2250, 2500, 2750, 3000, 3250],
  [2450, 2700, 2950, 3200, 3450],
];

const MOVE_PRICE_ZAR: number[][] = [
  [1390, 1620, 1850, 2080, 2310],
  [1570, 1800, 2030, 2260, 2490],
  [1750, 1980, 2210, 2440, 2670],
  [1930, 2160, 2390, 2620, 2850],
  [2110, 2340, 2570, 2800, 3030],
];

/** Same for Deep and Move */
const DEEP_MOVE_TIME_H: number[][] = [
  [6, 6, 6, 6.5, 7],
  [6, 6, 6.5, 7, 7.5],
  [6, 6.5, 7, 7.5, 8],
  [6.5, 7, 7.5, 8, 8.5],
  [7, 7.5, 8, 8.5, 9],
];

/** Carpet price ZAR. Rows: carpet rooms 1–4, 5+. Cols: rugs 0–3, 4+. */
const CARPET_PRICE_ZAR: number[][] = [
  [550, 700, 850, 1000, 1150],
  [750, 900, 1050, 1200, 1350],
  [950, 1100, 1250, 1400, 1550],
  [1150, 1300, 1450, 1600, 1750],
  [1350, 1500, 1650, 1800, 1950],
];

const CARPET_TIME_H: number[][] = [
  [1.5, 2.0, 2.5, 3.0, 3.5],
  [2.0, 2.5, 3.0, 3.5, 4.0],
  [2.5, 3.0, 3.5, 4.0, 4.5],
  [3.0, 3.5, 4.0, 4.5, 5.0],
  [3.5, 4.0, 4.5, 5.0, 5.5],
];

function normalizeBed5(bedrooms: number): number {
  const b = Math.floor(Number(bedrooms) || 0);
  return Math.min(5, Math.max(1, b >= 5 ? 5 : b));
}

function normalizeBath5(bathrooms: number): number {
  const b = Math.floor(Number(bathrooms) || 0);
  return Math.min(5, Math.max(0, b >= 5 ? 5 : b));
}

function normalizeRugs5(rugs: number): number {
  const r = Math.floor(Number(rugs) || 0);
  return Math.min(5, Math.max(0, r >= 5 ? 5 : r));
}

/** Cap “5+” bucket for carpet room / rug counts. */
function capCarpetDim5(n: number): number {
  const v = Math.floor(Number(n) || 0);
  return Math.min(5, Math.max(0, v >= 5 ? 5 : v));
}

/** 5×5 tables: bed row 0–4, bath col 0–4 (bath 0 maps to col 0 = 1 bath). */
function bedBathIdxDeepMove(bedrooms: number, bathrooms: number): {
  bedIdx: number;
  bathIdx: number;
} {
  const bed = normalizeBed5(bedrooms);
  const bedIdx = bed >= 5 ? 4 : bed - 1;
  const bath = normalizeBath5(bathrooms);
  const effectiveBath = bath <= 0 ? 1 : bath;
  const capped = Math.min(5, effectiveBath);
  const bathIdx = capped >= 5 ? 4 : capped - 1;
  return { bedIdx, bathIdx };
}

function carpetIndices(carpetRooms: number, rugs: number): { roomIdx: number; rugIdx: number } {
  const rooms = normalizeBed5(Math.max(1, carpetRooms));
  const roomIdx = rooms >= 5 ? 4 : rooms - 1;
  const r = normalizeRugs5(rugs);
  const rugIdx = r >= 4 ? 4 : r;
  return { roomIdx, rugIdx };
}

function lookupDeepMovePriceZar(
  table: number[][],
  bedrooms: number,
  bathrooms: number
): number {
  const { bedIdx, bathIdx } = bedBathIdxDeepMove(bedrooms, bathrooms);
  return table[bedIdx][bathIdx];
}

function lookupDeepMoveTimeH(bedrooms: number, bathrooms: number): number {
  const { bedIdx, bathIdx } = bedBathIdxDeepMove(bedrooms, bathrooms);
  return DEEP_MOVE_TIME_H[bedIdx][bathIdx];
}

/**
 * Single source of truth for Deep / Move / Carpet team size from guarded job hours.
 * Standard/Airbnb use premium + extra-cleaner rules separately.
 */
export function resolveTeam(service: V4ServiceType, hours: number): number {
  if (service === 'deep' || service === 'move') {
    return hours >= 7 ? 3 : 2;
  }
  if (service === 'carpet') {
    return hours >= 3 ? 2 : 1;
  }
  return 1;
}

function applyHourGuards(service: V4ServiceType, rawHours: number): number {
  if (service === 'deep' || service === 'move') {
    return Math.max(DEEP_MOVE_MIN_H, rawHours);
  }
  if (service === 'carpet') {
    return Math.min(CARPET_MAX_H, Math.max(CARPET_MIN_H, rawHours));
  }
  if (service === 'standard' || service === 'airbnb') {
    return Math.min(STD_AIR_MAX_H, Math.max(STD_AIR_MIN_H, rawHours));
  }
  return rawHours;
}

function finishResult(
  service: V4ServiceType,
  partial: Omit<
    CalculateBookingV4Result,
    'effective_hourly_rate_zar' | 'carpets' | 'rugs'
  > & { carpets?: number; rugs?: number }
): CalculateBookingV4Result {
  const hours = Math.max(1e-6, partial.hours);
  const effective_hourly_rate_zar = partial.cleaning_subtotal_zar / hours;
  return {
    ...partial,
    effective_hourly_rate_zar,
  };
}

/**
 * Authoritative V4 labour line + job-hours (before dynamic pricing / surge / discounts).
 */
export function calculateBookingV4(input: CalculateBookingV4Input): CalculateBookingV4Result {
  const service = input.service_type;

  let carpetsNorm: number | undefined;
  let rugsNorm: number | undefined;

  if (service === 'carpet') {
    let carpets =
      input.carpets ??
      input.carpetDetails?.numberOfRooms ??
      0;
    let rugs =
      input.rugs ??
      input.carpetDetails?.numberOfLooseCarpets ??
      0;
    if (carpets < 1) {
      carpets = Math.max(1, Math.floor(Number(input.bedrooms) || 1));
    }
    carpetsNorm = capCarpetDim5(carpets);
    if (carpetsNorm < 1) carpetsNorm = 1;
    rugsNorm = capCarpetDim5(rugs);
  }

  const bedrooms = Math.floor(Number(input.bedrooms) || 0);
  const bathrooms = Math.floor(Number(input.bathrooms) || 0);
  const extraRoomsRaw = Math.floor(Number(input.extra_rooms) || 0);

  if (service !== 'carpet' && bedrooms < 1) {
    throw new BookingV4ValidationError('bedrooms must be >= 1');
  }
  if (bathrooms < 0 || extraRoomsRaw < 0) {
    throw new BookingV4ValidationError('bathrooms and extra_rooms must be >= 0');
  }

  const extraRooms = capExtraRoomsForLineItems(extraRoomsRaw);

  const { price_zar: extras_price_zar, time_hours: extras_time_hours } = sumUnifiedExtras(
    input.extras ?? [],
    input.extrasQuantities
  );

  let table_price_zar = 0;
  let extra_room_price_zar = 0;

  if (service === 'standard' || service === 'airbnb') {
    const mode = input.pricing_mode ?? 'premium';
    const isQuick = mode === 'quick';
    const isPremium = mode === 'premium';
    if (!isQuick && !isPremium) {
      throw new BookingV4ValidationError('pricing_mode must be quick or premium');
    }

    table_price_zar = isQuick
      ? lookupQuickPriceZar(bedrooms, bathrooms)
      : lookupPremiumPriceZar(bedrooms, bathrooms);

    const perRoom = isQuick ? QUICK_EXTRA_ROOM_PRICE_ZAR : PREMIUM_EXTRA_ROOM_PRICE_ZAR;
    extra_room_price_zar = roundPrice(extraRooms * perRoom);

    const extraTimePer = isQuick ? QUICK_EXTRA_ROOM_TIME_H : PREMIUM_EXTRA_ROOM_TIME_H;
    const rawFromTables =
      lookupTimeHours(isQuick ? 'quick' : 'premium', bedrooms, bathrooms) +
      extraRooms * extraTimePer +
      extras_time_hours;

    const hours = applyHourGuards(service, rawFromTables);

    const team_size = isPremium && input.has_extra_cleaner ? 2 : 1;
    const duration = hours / team_size;

    const cleaning_subtotal_zar = roundPrice(
      table_price_zar + extra_room_price_zar + extras_price_zar
    );
    const price_zar = cleaning_subtotal_zar;

    return finishResult(service, {
      price_zar,
      total_amount_cents: Math.round(price_zar * 100),
      table_price_zar,
      extra_room_price_zar,
      extras_price_zar,
      extras_time_hours,
      cleaning_subtotal_zar,
      hours,
      duration,
      team_size,
    });
  }

  if (service === 'deep' || service === 'move') {
    const t = service === 'deep' ? DEEP_PRICE_ZAR : MOVE_PRICE_ZAR;
    table_price_zar = lookupDeepMovePriceZar(t, bedrooms, bathrooms);
    extra_room_price_zar = 0;

    const rawHours = lookupDeepMoveTimeH(bedrooms, bathrooms) + extras_time_hours;
    const hours = applyHourGuards(service, rawHours);
    const team_size = resolveTeam(service, hours);
    const duration = hours / team_size;

    const cleaning_subtotal_zar = roundPrice(table_price_zar + extras_price_zar);
    const price_zar = cleaning_subtotal_zar;

    return finishResult(service, {
      price_zar,
      total_amount_cents: Math.round(price_zar * 100),
      table_price_zar,
      extra_room_price_zar,
      extras_price_zar,
      extras_time_hours,
      cleaning_subtotal_zar,
      hours,
      duration,
      team_size,
    });
  }

  if (service === 'carpet') {
    const cr = carpetsNorm ?? 1;
    const rg = rugsNorm ?? 0;
    const { roomIdx, rugIdx } = carpetIndices(cr, rg);
    table_price_zar = CARPET_PRICE_ZAR[roomIdx][rugIdx];
    extra_room_price_zar = 0;

    const rawHours = CARPET_TIME_H[roomIdx][rugIdx] + extras_time_hours;
    const hours = applyHourGuards(service, rawHours);
    const team_size = resolveTeam(service, hours);
    const duration = hours / team_size;

    const cleaning_subtotal_zar = roundPrice(table_price_zar + extras_price_zar);
    const price_zar = cleaning_subtotal_zar;

    return finishResult(service, {
      price_zar,
      total_amount_cents: Math.round(price_zar * 100),
      table_price_zar,
      extra_room_price_zar,
      extras_price_zar,
      extras_time_hours,
      cleaning_subtotal_zar,
      hours,
      duration,
      team_size,
      carpets: cr,
      rugs: rg,
    });
  }

  const _exhaustive: never = service;
  throw new BookingV4ValidationError(`unsupported service: ${_exhaustive}`);
}
