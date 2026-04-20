/**
 * Shared dynamic-pricing constants — safe for Client Components (no server-only imports).
 */

export const DEMAND_CAPACITY = 20;

export const SUPPLY_REQUIRED = 10;

/** Mid-band demand, balanced supply when DB signals are not loaded. */
export const NEUTRAL_DYNAMIC_SIGNALS = {
  demand_score: 0.5,
  supply_score: 1,
} as const;
