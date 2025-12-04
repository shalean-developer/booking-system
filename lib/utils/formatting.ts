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
  const amount = cents / 100;
  const rounded = Math.round(amount);
  
  try {
    if (showDecimals) {
      const formatted = amount.toLocaleString('en-ZA', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      });
      if (formatted && formatted.trim().length > 0) {
        return `R${formatted}`;
      }
    } else {
      const formatted = rounded.toLocaleString('en-ZA');
      if (formatted && formatted.trim().length > 0) {
        return `R${formatted}`;
      }
    }
  } catch {}
  
  // Fallback formatting
  try {
    if (showDecimals) {
      const formatted = amount.toLocaleString(undefined, { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      });
      return `R${formatted}`;
    } else {
      return `R${rounded.toLocaleString(undefined)}`;
    }
  } catch {
    // Last resort: manual formatting
    if (showDecimals) {
      return `R${amount.toFixed(2)}`;
    } else {
      return `R${rounded}`;
    }
  }
}

/**
 * Format date to short format (e.g., "Jan 15")
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
export function formatDateShort(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    try {
      const result = date.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' });
      if (result && result.trim().length > 0) return result;
    } catch {}
    
    try {
      const result = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      if (result && result.trim().length > 0) return result;
    } catch {}
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) ||
           `${date.getDate()} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()]}`;
  } catch {
    return 'Invalid date';
  }
}

/**
 * Format date to standard format (e.g., "Jan 15, 2024")
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    try {
      const result = date.toLocaleDateString('en-ZA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      if (result && result.trim().length > 0) return result;
    } catch {}
    
    try {
      const result = date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      if (result && result.trim().length > 0) return result;
    } catch {}
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }) || `${date.getDate()} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()]}, ${date.getFullYear()}`;
  } catch {
    return 'Invalid date';
  }
}

/**
 * Format date and time (e.g., "Jan 15, 2024, 10:30 AM")
 * @param dateString - ISO date string
 * @returns Formatted date and time string
 */
export function formatDateTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    try {
      const result = date.toLocaleString('en-ZA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      if (result && result.trim().length > 0) return result;
    } catch {}
    
    try {
      const result = date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      if (result && result.trim().length > 0) return result;
    } catch {}
    
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }) || `${date.getDate()} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()]}, ${date.getFullYear()}, ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  } catch {
    return 'Invalid date';
  }
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
