import type { SupabaseClient } from '@supabase/supabase-js';
import { generateReferralCode } from '@/lib/loyalty/referral-code';

/** Ensures `customers.referral_code` is set (unique, shareable). Returns the code for API responses. */
export async function ensureCustomerReferralCode(
  supabase: SupabaseClient,
  customerId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from('customers')
    .select('referral_code')
    .eq('id', customerId)
    .maybeSingle();
  const existing = data?.referral_code?.trim();
  if (existing) return existing;

  const code = generateReferralCode(customerId);
  const { error } = await supabase.from('customers').update({ referral_code: code }).eq('id', customerId);
  if (!error) return code;

  if (error.code === '23505') {
    const alt = `${code}A`.slice(0, 40);
    const { error: errAlt } = await supabase.from('customers').update({ referral_code: alt }).eq('id', customerId);
    if (!errAlt) return alt;
    console.error('ensureCustomerReferralCode: duplicate retry failed', errAlt);
    return null;
  }

  console.error('ensureCustomerReferralCode', error);
  return null;
}
