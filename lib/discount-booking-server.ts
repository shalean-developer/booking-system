import type { SupabaseClient } from '@supabase/supabase-js';
import type { Promo } from '@/lib/pricing/discounts';
import { LEGACY_PROMO_CODES, legacyCodeToPromo } from '@/lib/pricing/discounts';

/** @deprecated Import `LEGACY_PROMO_CODES` from `@/lib/pricing/discounts` */
export { LEGACY_PROMO_CODES };

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

export function discountRowToPromo(row: {
  code: string;
  discount_type: string;
  discount_value: number | string;
  valid_from: string;
  valid_until: string | null;
  usage_limit: number | null;
  usage_count: number | null;
  min_purchase_amount: number | string | null;
  applicable_services: string[] | null;
  first_time_only?: boolean | null;
}): Promo {
  const discount =
    row.discount_type === 'percentage'
      ? { type: 'percentage' as const, value: Number(row.discount_value) }
      : { type: 'fixed' as const, value: Number(row.discount_value) };
  const from = new Date(row.valid_from + 'T00:00:00.000Z');
  const to = row.valid_until
    ? new Date(row.valid_until + 'T23:59:59.999Z')
    : new Date('2099-12-31T23:59:59.999Z');
  return {
    code: row.code,
    discount,
    valid_from: from,
    valid_to: to,
    max_uses: row.usage_limit ?? undefined,
    used_count: row.usage_count ?? undefined,
    min_price: row.min_purchase_amount != null ? Number(row.min_purchase_amount) : undefined,
    applicable_services: row.applicable_services ?? undefined,
    first_time_only: Boolean(row.first_time_only),
  };
}

/** Resolves DB row or legacy map entry to a `Promo` for unified pricing. */
export async function fetchPromoForBooking(
  supabase: SupabaseClient,
  code: string | null | undefined
): Promise<Promo | null> {
  if (!code?.trim()) return null;
  const normalized = code.toUpperCase().trim();
  const { data: row, error } = await supabase
    .from('discount_codes')
    .select('*')
    .eq('code', normalized)
    .eq('is_active', true)
    .maybeSingle();
  if (!error && row) return discountRowToPromo(row);
  return legacyCodeToPromo(normalized, LEGACY_PROMO_CODES);
}

/** Paid bookings for first-time promo eligibility (excludes current draft). */
export async function countSuccessfulBookingsByEmail(
  supabase: SupabaseClient,
  email: string | null | undefined
): Promise<number> {
  const e = email?.toLowerCase().trim();
  if (!e) return 0;
  const { count, error } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('customer_email', e)
    .eq('payment_status', 'success');
  if (error) {
    console.warn('[discount] countSuccessfulBookingsByEmail', error);
    return 0;
  }
  return count ?? 0;
}

function computeLegacyDiscount(code: string, subtotalBeforeDiscount: number): number {
  const discount = LEGACY_PROMO_CODES[code.toUpperCase().trim()];
  if (discount === undefined) return 0;
  return discount <= 1
    ? Math.round(subtotalBeforeDiscount * discount)
    : Math.min(subtotalBeforeDiscount, discount);
}

async function computeDbDiscount(
  supabase: SupabaseClient,
  code: string,
  subtotalBeforeDiscount: number,
  serviceType: string
): Promise<number | null> {
  const normalizedCode = code.toUpperCase().trim();
  const today = new Date().toISOString().split('T')[0];

  const { data: discountCode, error } = await supabase
    .from('discount_codes')
    .select('*')
    .eq('code', normalizedCode)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !discountCode) {
    return null;
  }

  if (discountCode.valid_from > today) return null;
  if (discountCode.valid_until && discountCode.valid_until < today) return null;
  if (discountCode.usage_limit && discountCode.usage_count >= discountCode.usage_limit) return null;
  if (discountCode.min_purchase_amount && subtotalBeforeDiscount < discountCode.min_purchase_amount) {
    return null;
  }
  if (
    discountCode.applicable_services &&
    discountCode.applicable_services.length > 0 &&
    serviceType &&
    !discountCode.applicable_services.includes(serviceType)
  ) {
    return null;
  }

  let discountAmount = 0;
  if (discountCode.discount_type === 'percentage') {
    discountAmount = (subtotalBeforeDiscount * discountCode.discount_value) / 100;
    if (discountCode.max_discount_amount && discountAmount > discountCode.max_discount_amount) {
      discountAmount = discountCode.max_discount_amount;
    }
  } else {
    discountAmount = discountCode.discount_value;
    if (discountAmount > subtotalBeforeDiscount) {
      discountAmount = subtotalBeforeDiscount;
    }
  }

  return roundMoney(discountAmount);
}

/**
 * Ensures the claimed discount matches server recomputation (Standard/Airbnb unified),
 * or legacy DB / marketing codes for other services.
 */
export async function validateBookingDiscountAmount(
  supabase: SupabaseClient,
  input: {
    discountCode?: string | null;
    promo_code?: string | null;
    discountAmountClaimedZar: number;
    subtotalBeforeDiscountZar: number;
    serviceType: string;
    /** When provided, claimed amount must match unified engine discount (incl. auto). */
    serverExpectedDiscountZar?: number;
  }
): Promise<{ ok: true; discountAmountZar: number } | { ok: false; error: string; status: number }> {
  const code = (input.discountCode ?? input.promo_code)?.trim();
  const claimed = roundMoney(input.discountAmountClaimedZar || 0);

  if (input.serverExpectedDiscountZar !== undefined) {
    const exp = roundMoney(input.serverExpectedDiscountZar);
    if (Math.abs(claimed - exp) > 0.02) {
      return {
        ok: false,
        error: 'Discount amount does not match server pricing. Please refresh and try again.',
        status: 400,
      };
    }
    return { ok: true, discountAmountZar: claimed };
  }

  if (!code) {
    if (claimed > 0.02) {
      return { ok: false, error: 'Invalid discount amount', status: 400 };
    }
    return { ok: true, discountAmountZar: 0 };
  }

  const subtotal = input.subtotalBeforeDiscountZar;
  if (typeof subtotal !== 'number' || !Number.isFinite(subtotal) || subtotal < 0) {
    return { ok: false, error: 'Invalid subtotal for discount validation', status: 400 };
  }

  let expected = await computeDbDiscount(supabase, code, subtotal, input.serviceType);
  if (expected === null || expected === 0) {
    expected = computeLegacyDiscount(code, subtotal);
  }

  if (expected === 0) {
    return { ok: false, error: 'Invalid or expired discount code', status: 400 };
  }

  if (Math.abs(claimed - expected) > 0.02) {
    return {
      ok: false,
      error: 'Discount amount does not match this code. Please refresh and try again.',
      status: 400,
    };
  }

  return { ok: true, discountAmountZar: expected };
}
