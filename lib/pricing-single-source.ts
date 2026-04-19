import type { PricingEngineResult } from '@/lib/pricing-engine';

/**
 * Dev/regression guard: log when the public wizard would render pricing without an engine row
 * (catalog-only fallback). Production UI should always have `enginePricing` when `lineCalc` exists.
 */
export function assertSinglePricingSource(input: {
  lineCalcPresent: boolean;
  enginePricing: PricingEngineResult | null;
  context?: string;
}): void {
  if (process.env.NODE_ENV !== 'development') return;
  if (!input.lineCalcPresent) return;
  if (input.enginePricing != null) return;
  const msg = `[pricing] Engine pricing missing — fallback in use${input.context ? ` (${input.context})` : ''}`;
  console.warn(msg);
}
