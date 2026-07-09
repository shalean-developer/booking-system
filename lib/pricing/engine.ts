import type { computeAuthoritativeBookingPricing } from '@/lib/booking-server-pricing';
import type { PricingConfig } from '@/lib/pricing/config';

export type PricingInput = {
  serviceType: string;
  bedrooms: number;
  bathrooms: number;
  extras: string[];
  date: string;
  time: string;
  location?: string;
};

export type PricingResult = {
  basePrice: number;
  extrasTotal: number;
  adjustmentsTotal: number;
  surgeMultiplier: number;
  /** Negative when money off (e.g. -50). */
  discountTotal: number;
  finalPrice: number;
  duration: number;
  breakdown: {
    label: string;
    amount: number;
  }[];
};

type AuthoritativeCart = Awaited<ReturnType<typeof computeAuthoritativeBookingPricing>>;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Maps the **authoritative** server cart (same path as checkout) into a stable, display-first
 * {@link PricingResult}. All monetary fields are ZAR.
 */
export function mapAuthoritativeBookingToPricingResult(cart: AuthoritativeCart): PricingResult {
  const fp = cart.finalPrice;
  const b = fp.breakdown.cart.breakdown;
  const uni = fp.breakdown.unified;
  const adj = fp.breakdown.adjustments;
  const uSnap = cart.calc.unifiedPricing;

  const surgeMultiplier = uSnap?.surge_multiplier ?? uni.dynamic_multiplier ?? 1;
  const duration = uSnap?.duration ?? uSnap?.hours ?? 0;

  const discountOffZar =
    (adj.frequency ?? 0) + (adj.referral ?? 0) + (adj.loyalty ?? 0) + (adj.tier ?? 0);

  const adjustmentsTotal =
    b.bathrooms +
    b.extraRooms +
    (b.carpetFitted + b.carpetLoose + b.carpetOccupiedFee) +
    b.equipmentCharge +
    (adj.equipment ?? 0) +
    (adj.min_fee ?? 0) +
    (adj.admin_min_clamp_zar ?? 0) -
    (adj.admin_max_clamp_zar ?? 0);

  const breakdown: { label: string; amount: number }[] = [];
  if (b.base > 0) breakdown.push({ label: 'Base service', amount: round2(b.base) });
  if (b.bedrooms > 0) breakdown.push({ label: 'Bedrooms', amount: round2(b.bedrooms) });
  if (b.bathrooms > 0) breakdown.push({ label: 'Bathrooms', amount: round2(b.bathrooms) });
  if (b.extraRooms > 0) breakdown.push({ label: 'Extra rooms', amount: round2(b.extraRooms) });
  if (b.carpetFitted + b.carpetLoose + b.carpetOccupiedFee > 0) {
    breakdown.push({
      label: 'Carpet',
      amount: round2(b.carpetFitted + b.carpetLoose + b.carpetOccupiedFee),
    });
  }
  if (b.extrasTotal > 0) breakdown.push({ label: 'Extras', amount: round2(b.extrasTotal) });
  if (b.equipmentCharge > 0) breakdown.push({ label: 'Equipment', amount: round2(b.equipmentCharge) });

  if (uni.surge > 0.005) {
    breakdown.push({
      label: `Surge ×${surgeMultiplier.toFixed(2)}`,
      amount: round2(uni.surge),
    });
  }

  if (adj.frequency > 0.005) {
    breakdown.push({ label: 'Frequency discount', amount: round2(-adj.frequency) });
  }
  if (adj.referral > 0.005) {
    breakdown.push({ label: 'Referral discount', amount: round2(-adj.referral) });
  }
  if (adj.loyalty > 0.005) {
    breakdown.push({ label: 'Loyalty', amount: round2(-adj.loyalty) });
  }
  if (adj.tier > 0.005) {
    breakdown.push({ label: 'Tier discount', amount: round2(-adj.tier) });
  }
  if (adj.min_fee > 0.005) {
    breakdown.push({ label: 'Minimum fee', amount: round2(adj.min_fee) });
  }

  const basePrice = round2(b.base + b.bedrooms);
  const extrasTotal = round2(cart.extrasTotalZar);

  return {
    basePrice,
    extrasTotal,
    adjustmentsTotal: round2(adjustmentsTotal),
    surgeMultiplier: round2(surgeMultiplier),
    discountTotal: discountOffZar > 0 ? round2(-discountOffZar) : 0,
    finalPrice: round2(cart.price_zar),
    duration,
    breakdown,
  };
}

/**
 * Single entrypoint required by the stabilization spec — **must** receive the authoritative cart
 * produced with the same inputs as checkout (`computeAuthoritativeBookingPricing`).
 * `input` + `config` are carried for audit / version stamping on snapshots.
 */
export function calculateBookingPrice(
  input: PricingInput,
  config: PricingConfig,
  authoritative: AuthoritativeCart,
): PricingResult {
  void input;
  void config.version;
  return mapAuthoritativeBookingToPricingResult(authoritative);
}
