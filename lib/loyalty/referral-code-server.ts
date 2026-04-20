import type { SupabaseClient } from '@supabase/supabase-js';
import { generateReferralCode } from '@/lib/loyalty/referral-code';

/** Ensures `customers.referral_code` is set (unique, shareable). */
export async function ensureCustomerReferralCode(
  supabase: SupabaseClient,
  customerId: string,
): Promise<void> {
  const { data } = await supabase
    .from('customers')
    .select('referral_code')
    .eq('id', customerId)
    .maybeSingle();
  if (data?.referral_code?.trim()) return;

  const code = generateReferralCode(customerId);
  const { error } = await supabase.from('customers').update({ referral_code: code }).eq('id', customerId);
  if (error?.code === '23505') {
    const alt = `${code}A`.slice(0, 40);
    await supabase.from('customers').update({ referral_code: alt }).eq('id', customerId);
  }
}
