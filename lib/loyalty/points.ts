/**
 * Loyalty points: earn rate, redemption, validation.
 * Balance stored in `customers.rewards_points`.
 *
 * Earn: 1 point per R10 spent (floor).
 * Redeem: **100 points = R10 off** → discount ZAR = points_used / 10.
 */

import { roundPrice } from '@/lib/pricing/rounding';

/** Points required for R1 discount (100 pts = R10 → 10 pts = R1). */
export const POINTS_PER_RAND_DISCOUNT = 10;

export const FIRST_BOOKING_BONUS_POINTS = 50;
export const REPEAT_WITHIN_7D_BONUS_POINTS = 20;
/** Referrer reward after referee's first paid booking (~R50 credit at 10 pts/ZAR). */
export const REFERRER_REWARD_POINTS = 500;

/** First booking with a referral code: fixed discount on labour (ZAR). */
export const REFERRAL_REFEREE_FIXED_ZAR = 30;

/** Points earned from amount paid (ZAR). */
export function calculatePoints(price_zar: number): number {
  if (!Number.isFinite(price_zar) || price_zar <= 0) return 0;
  return Math.floor(price_zar / 10);
}

/** ZAR discount from points redeemed (100 pts → R10). */
export function discountZarFromPoints(points_used: number): number {
  const p = Math.max(0, Math.floor(Number(points_used) || 0));
  return roundPrice(p / POINTS_PER_RAND_DISCOUNT);
}

/** Max points that can discount a given labour subtotal. */
export function maxPointsForDiscountZar(max_discount_zar: number): number {
  const z = Math.max(0, Number(max_discount_zar) || 0);
  return Math.floor(z * POINTS_PER_RAND_DISCOUNT);
}

export type PointsRedemptionInput = {
  use_points: number;
  balance_points: number;
  /** Max ZAR that can be discounted (e.g. labour line after other discounts). */
  max_discount_zar: number;
};

export type PointsRedemptionResult =
  | { ok: true; points_used: number; discount_zar: number }
  | { ok: false; error: string };

/**
 * Validates and clamps redemption: 100 pts = R10 off; cannot exceed balance or labour cap.
 */
export function validateAndClampPointsRedemption(input: PointsRedemptionInput): PointsRedemptionResult {
  const raw = Math.floor(Number(input.use_points) || 0);
  if (raw < 0) {
    return { ok: false, error: 'Points cannot be negative' };
  }
  if (raw === 0) {
    return { ok: true, points_used: 0, discount_zar: 0 };
  }
  const balance = Math.max(0, Math.floor(Number(input.balance_points) || 0));
  if (raw > balance) {
    return { ok: false, error: 'Not enough loyalty points' };
  }
  const maxZar = Math.max(0, Number(input.max_discount_zar) || 0);
  const maxPts = maxPointsForDiscountZar(maxZar);
  const points_used = Math.min(raw, balance, maxPts);
  const discount_zar = discountZarFromPoints(points_used);
  return { ok: true, points_used, discount_zar };
}

/** @deprecated Prefer REFERRAL_REFEREE_FIXED_ZAR + fixed discount — kept for tests referencing % */
export const REFERRAL_FIRST_BOOKING_PERCENT = 10;

export function applyReferralFirstBookingDiscount(labor_zar: number): {
  discount_zar: number;
  labor_after_zar: number;
} {
  const z = Math.max(0, labor_zar);
  const discount_zar = roundPrice(Math.min(REFERRAL_REFEREE_FIXED_ZAR, z));
  return {
    discount_zar,
    labor_after_zar: roundPrice(Math.max(0, z - discount_zar)),
  };
}
