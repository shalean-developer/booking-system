/**
 * Timezone-aware date and time utilities
 */

/**
 * Safe locale formatting with fallback support
 * Tries the preferred locale, falls back to browser default, then to 'en-US'
 */
function safeLocaleFormat(
  date: Date,
  locales: string | string[],
  options: Intl.DateTimeFormatOptions,
  formatFn: 'toLocaleDateString' | 'toLocaleTimeString' | 'toLocaleString'
): string {
  try {
    // Try preferred locale first
    const result = date[formatFn](locales, options);
    // Check if result is valid (some browsers return empty string for unsupported locales)
    if (result && result.trim().length > 0) {
      return result;
    }
  } catch (e) {
    // Locale not supported, will try fallback
  }

  try {
    // Fallback to browser default locale
    const result = date[formatFn](undefined, options);
    if (result && result.trim().length > 0) {
      return result;
    }
  } catch (e) {
    // Will try final fallback
  }

  try {
    // Final fallback to 'en-US' (widely supported)
    return date[formatFn]('en-US', options);
  } catch (e) {
    // Last resort: manual formatting
    const month = date.toLocaleDateString(undefined, { month: 'short' }) || 
                  ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
  }
}

/**
 * Format date in user's local timezone
 * Handles edge cases like invalid dates, timezone offsets
 */
export function formatDateSafe(
  dateStr: string | null | undefined,
  options: Intl.DateTimeFormatOptions = {}
): string {
  if (!dateStr) return 'N/A';

  try {
    const date = new Date(dateStr);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }

    // Use safe locale formatting with fallback
    return safeLocaleFormat(date, 'en-ZA', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options,
    }, 'toLocaleDateString');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

/**
 * Format time in user's local timezone
 */
export function formatTimeSafe(
  timeStr: string | null | undefined,
  includeSeconds = false
): string {
  if (!timeStr) return 'N/A';

  try {
    // Handle both "HH:MM" and "HH:MM:SS" formats
    const parts = timeStr.split(':');
    if (parts.length < 2) return timeStr;

    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parts[2] ? parseInt(parts[2], 10) : 0;

    if (isNaN(hours) || isNaN(minutes)) {
      return timeStr;
    }

    // Format as 12-hour time
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 || 12;
    const formattedMinutes = minutes.toString().padStart(2, '0');
    const formattedSeconds = seconds.toString().padStart(2, '0');

    if (includeSeconds) {
      return `${displayHour}:${formattedMinutes}:${formattedSeconds} ${ampm}`;
    }
    return `${displayHour}:${formattedMinutes} ${ampm}`;
  } catch (error) {
    console.error('Error formatting time:', error);
    return timeStr;
  }
}

/**
 * Format date and time together
 */
export function formatDateTimeSafe(
  dateTimeStr: string | null | undefined
): string {
  if (!dateTimeStr) return 'N/A';

  try {
    const date = new Date(dateTimeStr);
    
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }

    return safeLocaleFormat(date, 'en-ZA', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    }, 'toLocaleString');
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return 'Invalid date';
  }
}

/**
 * Get relative time (e.g., "2 hours ago")
 */
export function getRelativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return 'N/A';

  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) {
      return 'just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return formatDateSafe(dateStr);
    }
  } catch (error) {
    console.error('Error getting relative time:', error);
    return 'Invalid date';
  }
}

/**
 * Check if a date is today
 */
export function isToday(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;

  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return false;

    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  } catch {
    return false;
  }
}

/**
 * Check if a date is in the past
 */
export function isPast(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;

  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return false;

    return date.getTime() < Date.now();
  } catch {
    return false;
  }
}
