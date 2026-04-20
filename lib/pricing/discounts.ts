/**
 * Promotions & discounts — applied after surge on the unified labor line (Standard/Airbnb).
 * Priority: valid promo code wins; otherwise best single auto discount.
 */

import { roundPrice } from '@/lib/pricing/rounding';

export type Discount =
  | { type: 'percentage'; value: number }
  | { type: 'fixed'; value: number }
  | { type: 'free_extra'; extra_id: string };

export type Promo = {
  code: string;
  discount: Discount;
  valid_from: Date;
  valid_to: Date;
  max_uses?: number;
  used_count?: number;
  min_price?: number;
  applicable_services?: string[];
  first_time_only?: boolean;
};

export type DiscountApplyUser = {
  /** True when the customer has zero completed/paid bookings (server-computed). */
  is_first_booking?: boolean;
};

export type DiscountApplyBooking = {
  date: string;
  time_slot: string;
  /** API service e.g. Standard, Airbnb, or unified standard/airbnb */
  service: string;
  extras?: string[];
  extrasQuantities?: Record<string, number> | null;
};

export type ApplyDiscountInput = {
  /** Post-surge unified labor total (ZAR). */
  price_zar: number;
  promo?: Promo | null;
  user?: DiscountApplyUser;
  booking: DiscountApplyBooking;
  /** Defaults to now (for tests pass explicitly). */
  now?: Date;
  /** Per-extra unit ZAR for free_extra resolution. */
  extra_unit_prices_zar?: Record<string, number>;
};

export type ApplyDiscountResult = {
  ok: true;
  discount_amount_zar: number;
  final_price_zar: number;
  source: 'promo' | 'auto_first_booking' | 'auto_off_peak' | 'none';
  discount_type: string | null;
  promo_code: string | null;
};

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

function inRange(now: Date, from: Date, to: Date): boolean {
  return now >= from && now <= to;
}

function serviceMatches(promo: Promo, service: string): boolean {
  const list = promo.applicable_services;
  if (!list || list.length === 0) return true;
  const s = service.trim();
  return list.some((x) => x === s || x.toLowerCase() === s.toLowerCase());
}

/** Validates promo eligibility; returns null if discount should be ignored. */
export function validatePromo(
  promo: Promo,
  input: Omit<ApplyDiscountInput, 'promo'> & { promo: Promo }
): { ok: true } | { ok: false } {
  const now = input.now ?? new Date();
  const price = input.price_zar;
  if (!Number.isFinite(price) || price <= 0) return { ok: false };
  if (!inRange(now, promo.valid_from, promo.valid_to)) return { ok: false };
  if (promo.max_uses != null && promo.used_count != null && promo.used_count >= promo.max_uses) {
    return { ok: false };
  }
  if (promo.min_price != null && price < promo.min_price) return { ok: false };
  if (!serviceMatches(promo, input.booking.service)) return { ok: false };
  if (promo.first_time_only && !input.user?.is_first_booking) return { ok: false };
  return { ok: true };
}

function discountAmountForType(
  d: Discount,
  price_zar: number,
  extra_unit_prices_zar?: Record<string, number>,
  extras?: string[],
  extrasQuantities?: Record<string, number> | null
): number {
  if (d.type === 'percentage') {
    const pct = Math.max(0, Math.min(100, d.value));
    return roundMoney(price_zar * (pct / 100));
  }
  if (d.type === 'fixed') {
    return roundMoney(Math.max(0, d.value));
  }
  const id = d.extra_id;
  const q =
    extras?.includes(id) || extras?.some((e) => e === id || e.includes(id))
      ? Math.max(1, extrasQuantities?.[id] ?? 1)
      : 0;
  const unit = extra_unit_prices_zar?.[id] ?? 0;
  return roundMoney(Math.min(price_zar, q * unit));
}

/**
 * Applies a single promo if valid; ignores invalid promos (no throw).
 */
export function applyDiscount(input: ApplyDiscountInput): ApplyDiscountResult {
  const price_zar = Math.max(0, input.price_zar);
  if (price_zar <= 0) {
    return {
      ok: true,
      discount_amount_zar: 0,
      final_price_zar: 0,
      source: 'none',
      discount_type: null,
      promo_code: null,
    };
  }

  const promo = input.promo;
  if (promo) {
    const v = validatePromo(promo, { ...input, promo });
    if (v.ok) {
      let raw = discountAmountForType(
        promo.discount,
        price_zar,
        input.extra_unit_prices_zar,
        input.booking.extras,
        input.booking.extrasQuantities
      );
      raw = Math.min(price_zar, raw);
      const final_price_zar = roundPrice(Math.max(0, price_zar - raw));
      const discount_amount_zar = roundMoney(price_zar - final_price_zar);
      if (process.env.NODE_ENV === 'development') {
        console.log('[discount]', {
          promo_code: promo.code,
          discount_amount: discount_amount_zar,
          final_price: final_price_zar,
        });
      }
      return {
        ok: true,
        discount_amount_zar,
        final_price_zar,
        source: 'promo',
        discount_type: promo.discount.type,
        promo_code: promo.code,
      };
    }
  }

  return {
    ok: true,
    discount_amount_zar: 0,
    final_price_zar: roundPrice(price_zar),
    source: 'none',
    discount_type: null,
    promo_code: null,
  };
}

export type AutoDiscountKind = 'first_booking' | 'off_peak';

export type AutoDiscountCandidate = {
  kind: AutoDiscountKind;
  discount: Discount;
};

/**
 * Campaign rules: first booking (10% off), off-peak midday (R30 off).
 * Midday = 11:00–14:59 Africa/Johannesburg.
 */
export function getAutoDiscounts(booking: DiscountApplyBooking): AutoDiscountCandidate[] {
  const out: AutoDiscountCandidate[] = [];
  out.push({
    kind: 'first_booking',
    discount: { type: 'percentage', value: 10 },
  });

  const slot = booking.time_slot?.trim() ?? '';
  const m = /^(\d{1,2}):(\d{2})/.exec(slot);
  let minutes = -1;
  if (m) {
    const h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    if (Number.isFinite(h) && Number.isFinite(min)) minutes = h * 60 + min;
  }
  if (minutes >= 0) {
    const start = 11 * 60;
    const end = 14 * 60 + 59;
    if (minutes >= start && minutes <= end) {
      out.push({
        kind: 'off_peak',
        discount: { type: 'fixed', value: 30 },
      });
    }
  }

  return out;
}

function applySingleAuto(
  price_zar: number,
  d: Discount,
  extra_unit_prices_zar: Record<string, number> | undefined,
  booking: DiscountApplyBooking
): number {
  return discountAmountForType(d, price_zar, extra_unit_prices_zar, booking.extras, booking.extrasQuantities);
}

export type ResolveDiscountsInput = ApplyDiscountInput & {
  /** When true, skip auto discounts (e.g. user already used promo attempt). */
  skip_auto?: boolean;
};

/**
 * Priority: promo code first; else exactly one auto discount with highest monetary value.
 */
export function resolveBestDiscount(input: ResolveDiscountsInput): ApplyDiscountResult {
  const price_zar = Math.max(0, input.price_zar);
  if (price_zar <= 0) {
    return {
      ok: true,
      discount_amount_zar: 0,
      final_price_zar: 0,
      source: 'none',
      discount_type: null,
      promo_code: null,
    };
  }

  if (input.promo) {
    const promoResult = applyDiscount(input);
    if (promoResult.discount_amount_zar > 0.001) return promoResult;
  }

  if (input.skip_auto) {
    return {
      ok: true,
      discount_amount_zar: 0,
      final_price_zar: roundPrice(price_zar),
      source: 'none',
      discount_type: null,
      promo_code: null,
    };
  }

  const autos = getAutoDiscounts(input.booking);
  let bestAmt = 0;
  let bestKind: AutoDiscountKind | null = null;
  let bestType: string | null = null;

  for (const a of autos) {
    if (a.kind === 'first_booking' && !input.user?.is_first_booking) continue;
    const raw = applySingleAuto(price_zar, a.discount, input.extra_unit_prices_zar, input.booking);
    const clamped = Math.min(price_zar, raw);
    if (clamped > bestAmt) {
      bestAmt = clamped;
      bestKind = a.kind;
      bestType = a.discount.type;
    }
  }

  if (bestAmt <= 0.001 || !bestKind) {
    return {
      ok: true,
      discount_amount_zar: 0,
      final_price_zar: roundPrice(price_zar),
      source: 'none',
      discount_type: null,
      promo_code: null,
    };
  }

  const final_price_zar = roundPrice(Math.max(0, price_zar - bestAmt));
  const discount_amount_zar = roundMoney(price_zar - final_price_zar);
  const source: ApplyDiscountResult['source'] =
    bestKind === 'first_booking' ? 'auto_first_booking' : 'auto_off_peak';

  if (process.env.NODE_ENV === 'development') {
    console.log('[discount]', {
      promo_code: null,
      discount_amount: discount_amount_zar,
      final_price: final_price_zar,
      source,
    });
  }

  return {
    ok: true,
    discount_amount_zar,
    final_price_zar,
    source,
    discount_type: bestType,
    promo_code: null,
  };
}

/**
 * Legacy marketing codes (fraction ≤1 = share, >1 = fixed ZAR).
 * Kept in sync with `shared/booking-engine/promo-codes` exports.
 */
export const LEGACY_PROMO_CODES: Record<string, number> = {
  SHALEAN10: 0.1,
  SAVE20: 0.2,
  SAVE50: 50,
  NEWCLIENT: 100,
  FIRSTCLEAN: 100,
};

/** Client-side estimate: legacy hardcoded codes (same as BOOKING_PROMO_CODES semantics). */
export function legacyCodeToPromo(
  code: string,
  legacyMap: Record<string, number>
): Promo | null {
  const c = code.toUpperCase().trim();
  const v = legacyMap[c];
  if (v === undefined) return null;
  const discount: Discount =
    v <= 1
      ? { type: 'percentage', value: v * 100 }
      : { type: 'fixed', value: v };
  return {
    code: c,
    discount,
    valid_from: new Date(0),
    valid_to: new Date('2099-12-31'),
  };
}
