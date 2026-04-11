import type { SupabaseClient } from '@supabase/supabase-js';

/** Must stay in sync with `PROMO_CODES` in `components/booking-system.tsx` */
export const LEGACY_PROMO_CODES: Record<string, number> = {
  SHALEAN10: 0.1,
  SAVE20: 0.2,
  FIRSTCLEAN: 100,
};

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
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
 * Ensures the claimed discount matches either an active DB code or a legacy promo (same rules as checkout UI).
 */
export async function validateBookingDiscountAmount(
  supabase: SupabaseClient,
  input: {
    discountCode?: string | null;
    discountAmountClaimedZar: number;
    subtotalBeforeDiscountZar: number;
    serviceType: string;
  }
): Promise<{ ok: true; discountAmountZar: number } | { ok: false; error: string; status: number }> {
  const code = input.discountCode?.trim();
  const claimed = roundMoney(input.discountAmountClaimedZar || 0);
  const subtotal = input.subtotalBeforeDiscountZar;

  if (!code) {
    if (claimed > 0.02) {
      return { ok: false, error: 'Invalid discount amount', status: 400 };
    }
    return { ok: true, discountAmountZar: 0 };
  }

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
    return { ok: false, error: 'Discount amount does not match this code. Please refresh and try again.', status: 400 };
  }

  return { ok: true, discountAmountZar: expected };
}
