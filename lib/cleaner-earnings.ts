/**
 * Cleaner Earnings Calculation Utilities
 * 
 * Handles calculation of cleaner earnings based on experience:
 * - < 3 months experience: 60% of subtotal (total - service_fee)
 * - 4+ months experience: 70% of subtotal (total - service_fee)
 * - Service fee goes 100% to company
 * - Applies to ALL service types
 */

export function calculateCleanerEarnings(
  totalAmount: number | null,
  serviceFee: number | null,
  cleanerHireDate: string | null
): number {
  if (!totalAmount) return 0;
  
  const subtotal = totalAmount - (serviceFee || 0);
  const commissionRate = getCommissionRate(cleanerHireDate);
  
  return Math.round(subtotal * commissionRate);
}

export function getCommissionRate(hireDate: string | null): number {
  if (!hireDate) return 0.60; // Default for unassigned/new cleaners
  
  const hire = new Date(hireDate);
  const now = new Date();
  const monthsDiff = (now.getFullYear() - hire.getFullYear()) * 12 
                   + (now.getMonth() - hire.getMonth());
  
  return monthsDiff >= 4 ? 0.70 : 0.60;
}

export function getExperienceLevel(hireDate: string | null): 'new' | 'experienced' {
  const rate = getCommissionRate(hireDate);
  return rate >= 0.70 ? 'experienced' : 'new';
}

export function calculateCompanyEarnings(
  totalAmount: number | null,
  cleanerEarnings: number | null
): number {
  if (!totalAmount) return 0;
  return totalAmount - (cleanerEarnings || 0);
}

export function calculateSubtotal(
  totalAmount: number | null,
  serviceFee: number | null
): number {
  if (!totalAmount) return 0;
  return totalAmount - (serviceFee || 0);
}

export function formatEarnings(cents: number | null): string {
  if (!cents) return 'TBD';
  return `R${(cents / 100).toFixed(2)}`;
}

export function getCommissionRatePercentage(hireDate: string | null): number {
  return Math.round(getCommissionRate(hireDate) * 100);
}
