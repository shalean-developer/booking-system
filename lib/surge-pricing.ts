/**
 * Surge Pricing Helper Functions
 * Calculates surge pricing for bookings when demand is high
 */

export interface SurgePricingInfo {
  isActive: boolean;
  percentage: number;
  originalAmount: number;
  surgeAmount: number;
  finalAmount: number;
}

/**
 * Calculate surge pricing for a booking
 * @param originalAmount - Original booking amount in rands
 * @param bookingCount - Current number of bookings on the date
 * @param surgeThreshold - Threshold at which surge pricing kicks in (e.g., 70)
 * @param surgePercentage - Percentage increase when surge is active (e.g., 10.0 for 10%)
 * @returns Surge pricing information
 */
export function calculateSurgePricing(
  originalAmount: number,
  bookingCount: number,
  surgeThreshold: number | null,
  surgePercentage: number | null
): SurgePricingInfo {
  // If surge pricing is not configured or not active, return original amount
  if (!surgeThreshold || !surgePercentage || bookingCount < surgeThreshold) {
    return {
      isActive: false,
      percentage: 0,
      originalAmount,
      surgeAmount: 0,
      finalAmount: originalAmount,
    };
  }

  // Surge pricing is active - apply percentage increase
  const surgeAmount = originalAmount * (surgePercentage / 100);
  const finalAmount = originalAmount + surgeAmount;

  return {
    isActive: true,
    percentage: surgePercentage,
    originalAmount,
    surgeAmount,
    finalAmount,
  };
}

/**
 * Get surge pricing info from availability check result
 * @param originalAmount - Original booking amount in rands
 * @param availabilityResult - Result from availability check API
 * @returns Surge pricing information
 */
export function getSurgePricingFromAvailability(
  originalAmount: number,
  availabilityResult: {
    surge_pricing_active: boolean;
    surge_percentage: number | null;
    current_bookings: number;
  }
): SurgePricingInfo {
  if (!availabilityResult.surge_pricing_active || !availabilityResult.surge_percentage) {
    return {
      isActive: false,
      percentage: 0,
      originalAmount,
      surgeAmount: 0,
      finalAmount: originalAmount,
    };
  }

  const surgeAmount = originalAmount * (availabilityResult.surge_percentage / 100);
  const finalAmount = originalAmount + surgeAmount;

  return {
    isActive: true,
    percentage: availabilityResult.surge_percentage,
    originalAmount,
    surgeAmount,
    finalAmount,
  };
}

