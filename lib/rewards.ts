/**
 * Single source of truth for rewards: points per booking, tier thresholds, and helpers.
 * Safe to use on client and server.
 */

export type RewardTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

/** Points awarded per completed booking */
export const POINTS_PER_COMPLETED_BOOKING = 100;

/** Minimum points required for each tier (Bronze = 0 implied) */
export const TIER_THRESHOLDS = {
  Silver: 500,
  Gold: 1000,
  Platinum: 2500,
} as const;

/** Points required to reach this tier (used for progress bar "next" goal) */
export const NEXT_TIER_GOAL: Record<RewardTier, number> = {
  Bronze: 500,
  Silver: 1000,
  Gold: 2500,
  Platinum: 5000,
};

/**
 * Get tier from current points.
 */
export function getTierFromPoints(points: number): RewardTier {
  if (points >= TIER_THRESHOLDS.Platinum) return 'Platinum';
  if (points >= TIER_THRESHOLDS.Gold) return 'Gold';
  if (points >= TIER_THRESHOLDS.Silver) return 'Silver';
  return 'Bronze';
}

/**
 * Points required to reach the next tier (for progress bar). Platinum returns same goal (5000) as "max".
 */
export function getNextTierGoal(tier: RewardTier): number {
  return NEXT_TIER_GOAL[tier];
}

/**
 * Points needed from current points to reach next tier. If at Platinum, returns 0 (no next tier).
 */
export function getPointsToNextTier(points: number): number {
  const tier = getTierFromPoints(points);
  if (tier === 'Platinum') return 0;
  const nextGoal = NEXT_TIER_GOAL[tier];
  return Math.max(0, nextGoal - points);
}

/**
 * Compute total points from number of completed bookings (fallback when DB has no rewards_points).
 */
export function computePointsFromCompletedBookings(completedCount: number): number {
  return completedCount * POINTS_PER_COMPLETED_BOOKING;
}
