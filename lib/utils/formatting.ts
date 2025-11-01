/**
 * Number and Currency Formatting Utilities
 * Provides consistent formatting for numbers, currency, and percentages
 */

/**
 * Format a number with thousand separators
 * @param value - Number to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string (e.g., "79,470.04")
 */
export function formatNumber(value: number, decimals: number = 2): string {
  if (isNaN(value) || !isFinite(value)) return '0.00';
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format a currency value (South African Rand)
 * @param value - Amount in rands
 * @param showDecimals - Whether to show decimal places (default: true)
 * @returns Formatted currency string (e.g., "R79,470.04" or "R79,470")
 */
export function formatCurrency(value: number, showDecimals: boolean = true): string {
  if (isNaN(value) || !isFinite(value)) return showDecimals ? 'R0.00' : 'R0';
  
  const decimals = showDecimals ? 2 : 0;
  return `R${formatNumber(value, decimals)}`;
}

/**
 * Format large numbers with K/M notation
 * @param value - Number to format
 * @param decimals - Decimal places for abbreviated numbers
 * @returns Formatted string (e.g., "1.5K", "2.3M")
 */
export function formatCompactNumber(value: number, decimals: number = 1): string {
  if (isNaN(value) || !isFinite(value)) return '0';
  if (value === 0) return '0';
  
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  
  if (absValue >= 1_000_000) {
    return `${sign}${(absValue / 1_000_000).toFixed(decimals)}M`;
  }
  if (absValue >= 1_000) {
    return `${sign}${(absValue / 1_000).toFixed(decimals)}K`;
  }
  
  return formatNumber(value, 0);
}

/**
 * Format percentage with consistent decimal places
 * @param value - Percentage value (0-100)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string (e.g., "46.5%")
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  if (isNaN(value) || !isFinite(value)) return '0%';
  
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format percentage change (with +/- sign and color indication)
 * @param value - Percentage change value
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted string with sign (e.g., "+5.2%", "-3.1%")
 */
export function formatPercentageChange(value: number, decimals: number = 1): string {
  if (isNaN(value) || !isFinite(value)) return '0%';
  
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

