/**
 * Shared formatting utilities for admin dashboard
 */

/**
 * Format currency amount (in cents) to South African Rand format
 * @param cents - Amount in cents
 * @param showDecimals - Whether to show decimal places (default: true)
 * @returns Formatted currency string (e.g., "R1,234.56" or "R1,235")
 */
export function formatCurrency(cents: number, showDecimals: boolean = true): string {
  if (showDecimals) {
    return `R${(cents / 100).toLocaleString('en-ZA', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  } else {
    return `R${Math.round(cents / 100).toLocaleString('en-ZA')}`;
  }
}

/**
 * Format date to short format (e.g., "Jan 15")
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
export function formatDateShort(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-ZA', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format date to standard format (e.g., "Jan 15, 2024")
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format date and time (e.g., "Jan 15, 2024, 10:30 AM")
 * @param dateString - ISO date string
 * @returns Formatted date and time string
 */
export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get date range for a given period
 * @param period - Period type ('today', 'week', 'month', 'year')
 * @returns Object with dateFrom and dateTo ISO strings
 */
export function getDateRange(period: 'today' | 'week' | 'month' | 'year'): { dateFrom: string; dateTo: string } {
  const now = new Date();
  const dateTo = now.toISOString();
  let dateFrom: Date;

  switch (period) {
    case 'today':
      dateFrom = new Date(now);
      dateFrom.setHours(0, 0, 0, 0);
      break;
    case 'week':
      dateFrom = new Date(now);
      dateFrom.setDate(dateFrom.getDate() - 7);
      break;
    case 'month':
      dateFrom = new Date(now);
      dateFrom.setDate(dateFrom.getDate() - 30);
      break;
    case 'year':
      dateFrom = new Date(now);
      dateFrom.setFullYear(dateFrom.getFullYear() - 1);
      break;
    default:
      dateFrom = new Date(now);
      dateFrom.setDate(dateFrom.getDate() - 30);
  }

  return {
    dateFrom: dateFrom.toISOString(),
    dateTo,
  };
}
