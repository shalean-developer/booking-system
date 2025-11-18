/**
 * Timezone-aware date and time utilities
 */

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

    // Use user's local timezone
    return date.toLocaleDateString('en-ZA', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options,
    });
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

    return date.toLocaleString('en-ZA', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });
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
