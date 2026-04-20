import { generateReferralLink, getAbsoluteReferralGrowthUrl } from '@/lib/growth/growthEngine';

/**
 * Canonical growth path: `/ref?code=…` → redirects to signup with the same ref.
 * Accepts referrer customer UUID or `SHALEAN…` referral code.
 */
export function getReferralSignupPath(referrerCustomerId: string): string {
  return generateReferralLink(referrerCustomerId);
}

/** Absolute URL for sharing (copy, WhatsApp, email). */
export function getAbsoluteReferralSignupUrl(referrerCustomerId: string): string {
  return getAbsoluteReferralGrowthUrl(referrerCustomerId);
}
