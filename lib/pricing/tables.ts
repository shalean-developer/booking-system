/** Rows: beds 1,2,3,4,5+. Cols: baths 0,1,2,3,4,5+ */

import { roundPrice } from '@/lib/pricing/rounding';

export const PREMIUM_PRICE_TABLE: number[][] = [
  [320, 360, 400, 440, 480, 520],
  [350, 390, 430, 470, 510, 550],
  [380, 420, 460, 500, 540, 580],
  [410, 450, 490, 530, 570, 610],
  [440, 480, 520, 560, 600, 640],
];

export const QUICK_CLEAN_TIME_TABLE: number[][] = [
  [3.5, 3.5, 4.0, 4.5, 5.0, 5.5],
  [3.5, 4.0, 4.5, 5.0, 5.5, 6.0],
  [4.5, 5.0, 5.5, 6.0, 6.5, 7.0],
  [5.5, 6.0, 6.5, 7.0, 7.5, 8.0],
  [6.5, 7.0, 7.5, 8.0, 8.5, 9.0],
];

export const PREMIUM_TIME_TABLE: number[][] = [
  [3.5, 4.0, 4.5, 5.0, 5.5, 6.0],
  [4.0, 4.5, 5.0, 5.5, 6.0, 6.5],
  [5.0, 5.5, 6.0, 6.5, 7.0, 7.5],
  [6.0, 6.5, 7.0, 7.5, 8.0, 8.5],
  [7.0, 7.5, 8.0, 8.5, 9.0, 9.0],
];

export const QUICK_EXTRA_ROOM_PRICE_ZAR = 20;
export const PREMIUM_EXTRA_ROOM_PRICE_ZAR = 25;

export const QUICK_EXTRA_ROOM_TIME_H = 0.25;
export const PREMIUM_EXTRA_ROOM_TIME_H = 0.35;

export const UNIFIED_MIN_HOURS = 3.5;
export const UNIFIED_MAX_HOURS = 9;

export const QUICK_PRICE_MULTIPLIER = 0.88;

export function bedBathIndices(bedrooms: number, bathrooms: number): {
  bedIdx: number;
  bathIdx: number;
} {
  const b = Math.max(1, Math.min(5, Math.floor(Number(bedrooms) || 1)));
  const bath = Math.max(0, Math.min(5, Math.floor(Number(bathrooms) || 0)));
  const bedIdx = b >= 5 ? 4 : b - 1;
  const bathIdx = bath >= 5 ? 5 : bath;
  return { bedIdx, bathIdx };
}

export function lookupPremiumPriceZar(bedrooms: number, bathrooms: number): number {
  const { bedIdx, bathIdx } = bedBathIndices(bedrooms, bathrooms);
  return PREMIUM_PRICE_TABLE[bedIdx][bathIdx];
}

export function lookupQuickPriceZar(bedrooms: number, bathrooms: number): number {
  return roundPrice(lookupPremiumPriceZar(bedrooms, bathrooms) * QUICK_PRICE_MULTIPLIER);
}

export function lookupTimeHours(
  mode: 'quick' | 'premium',
  bedrooms: number,
  bathrooms: number
): number {
  const { bedIdx, bathIdx } = bedBathIndices(bedrooms, bathrooms);
  const t =
    mode === 'quick'
      ? QUICK_CLEAN_TIME_TABLE[bedIdx][bathIdx]
      : PREMIUM_TIME_TABLE[bedIdx][bathIdx];
  return t;
}

export function capExtraRoomsForLineItems(extraRooms: number): number {
  return Math.min(5, Math.max(0, Math.floor(Number(extraRooms) || 0)));
}

export function clampHours(h: number): number {
  return Math.min(UNIFIED_MAX_HOURS, Math.max(UNIFIED_MIN_HOURS, h));
}
