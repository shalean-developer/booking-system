/**
 * Deterministic referral code from customer UUID (unique with DB constraint).
 */
export function generateReferralCode(customerId: string): string {
  const hex = customerId.replace(/-/g, '').slice(0, 6).toUpperCase();
  return `SHALEAN${hex || 'NEW'}`;
}
