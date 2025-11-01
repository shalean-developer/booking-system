/**
 * Safe Calculation Utilities
 * Provides helper functions for safe mathematical operations with zero-division guards
 */

/**
 * Safely calculate percentage without division by zero
 * @param numerator - Top value of division
 * @param denominator - Bottom value of division
 * @param decimals - Number of decimal places (default: 1)
 * @returns Percentage value (0-100), or 0 if denominator is 0 or invalid
 */
export function safePercentage(
  numerator: number,
  denominator: number,
  decimals: number = 1
): number {
  if (!denominator || isNaN(denominator) || !isFinite(denominator) || denominator === 0) {
    return 0;
  }
  
  if (isNaN(numerator) || !isFinite(numerator)) {
    return 0;
  }
  
  const result = (numerator / denominator) * 100;
  
  // Round to specified decimals
  const multiplier = Math.pow(10, decimals);
  return Math.round(result * multiplier) / multiplier;
}

/**
 * Safely calculate percentage of part relative to total
 * @param part - The part value
 * @param total - The total value
 * @param decimals - Number of decimal places (default: 1)
 * @returns Percentage (0-100) representing part as % of total
 */
export function percentageOfTotal(
  part: number,
  total: number,
  decimals: number = 1
): number {
  return safePercentage(part, total, decimals);
}

/**
 * Safely calculate percentage change between two values
 * @param current - Current value
 * @param previous - Previous value
 * @param decimals - Number of decimal places (default: 1)
 * @returns Percentage change (can be negative)
 */
export function percentageChange(
  current: number,
  previous: number,
  decimals: number = 1
): number {
  if (!previous || isNaN(previous) || !isFinite(previous) || previous === 0) {
    // If previous is 0 and current > 0, it's a 100% increase (or undefined)
    // Return 0 to avoid showing confusing values
    return 0;
  }
  
  if (isNaN(current) || !isFinite(current)) {
    return 0;
  }
  
  const change = ((current - previous) / previous) * 100;
  const multiplier = Math.pow(10, decimals);
  return Math.round(change * multiplier) / multiplier;
}

/**
 * Safely divide two numbers
 * @param numerator - Top value
 * @param denominator - Bottom value
 * @param defaultValue - Value to return if division is invalid (default: 0)
 * @returns Result of division or defaultValue if invalid
 */
export function safeDivide(
  numerator: number,
  denominator: number,
  defaultValue: number = 0
): number {
  if (!denominator || isNaN(denominator) || !isFinite(denominator) || denominator === 0) {
    return defaultValue;
  }
  
  if (isNaN(numerator) || !isFinite(numerator)) {
    return defaultValue;
  }
  
  return numerator / denominator;
}

/**
 * Calculate what percentage the recent value represents of the total value
 * Specifically for showing "X% from last 30 days" type metrics
 * @param recent - Recent period value
 * @param total - Total value
 * @param decimals - Number of decimal places (default: 1)
 * @returns Percentage (0-100) of total that comes from recent period
 */
export function recentPeriodPercentage(
  recent: number,
  total: number,
  decimals: number = 1
): number {
  return percentageOfTotal(recent, total, decimals);
}

