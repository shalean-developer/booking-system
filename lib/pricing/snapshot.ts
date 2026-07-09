import { randomUUID } from 'node:crypto';
import type { PricingInput, PricingResult } from '@/lib/pricing/engine';
import type { PricingConfig } from '@/lib/pricing/config';
import type { computeAuthoritativeBookingPricing } from '@/lib/booking-server-pricing';
import { calculateBookingPrice } from '@/lib/pricing/engine';

export type PricingSnapshot = {
  id: string;
  input: PricingInput;
  result: PricingResult;
  configVersion: number;
  createdAt: string;
};

type AuthoritativeCart = Awaited<ReturnType<typeof computeAuthoritativeBookingPricing>>;

export function createPricingSnapshot(
  input: PricingInput,
  config: PricingConfig,
  authoritative: AuthoritativeCart,
): PricingSnapshot {
  const result = calculateBookingPrice(input, config, authoritative);
  return {
    id: randomUUID(),
    input,
    result,
    configVersion: config.version,
    createdAt: new Date().toISOString(),
  };
}

/** Default client-side TTL for locked quotes (matches product expectation; server enforces via token). */
export const PRICING_SNAPSHOT_TTL_MS = 30 * 60 * 1000;

export function buildSnapshotExpiresAt(base = new Date()): string {
  return new Date(base.getTime() + PRICING_SNAPSHOT_TTL_MS).toISOString();
}
