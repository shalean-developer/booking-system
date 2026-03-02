/**
 * Booking session management utilities
 * Handles session ID generation and sessionStorage operations for booking state
 */

/**
 * Generate a unique session ID for booking state
 */
export function generateSessionId(): string {
  // Generate a short, URL-safe session ID
  // Format: 8 character alphanumeric string
  return Math.random().toString(36).substring(2, 10);
}

/**
 * Get session ID from URL search parameters
 */
export function getSessionIdFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  
  const params = new URLSearchParams(window.location.search);
  return params.get('sid');
}

/**
 * Get or create session ID from URL or generate new one
 */
export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') {
    return generateSessionId();
  }
  
  const existingId = getSessionIdFromUrl();
  if (existingId) {
    return existingId;
  }
  
  return generateSessionId();
}

/**
 * Get session storage key for a given session ID
 */
export function getSessionStorageKey(sessionId: string): string {
  return `booking_session:${sessionId}`;
}

const LEGACY_KEY = 'bookingState';

/**
 * Save booking state to sessionStorage (session key only; legacy key removed)
 */
export function saveSessionState(sessionId: string, state: any): void {
  if (typeof window === 'undefined') return;

  try {
    const key = getSessionStorageKey(sessionId);
    const cleaned = cleanStateForStorage(state);
    sessionStorage.setItem(key, JSON.stringify(cleaned));
    sessionStorage.removeItem(LEGACY_KEY);
  } catch (error) {
    console.error('Failed to save session state:', error);
  }
}

/**
 * Load booking state from sessionStorage (session key only).
 * Returns null when sessionId is null or no state exists for that session.
 */
export function loadSessionState(sessionId: string | null): any | null {
  if (typeof window === 'undefined') return null;

  try {
    if (sessionId) {
      const key = getSessionStorageKey(sessionId);
      const stored = sessionStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }
      return null;
    }
    sessionStorage.removeItem(LEGACY_KEY);
    return null;
  } catch (error) {
    console.error('Failed to load session state:', error);
    return null;
  }
}

/**
 * Clean state object for storage (remove non-serializable fields)
 */
function cleanStateForStorage(state: any): any {
  if (!state || typeof state !== 'object') return state;
  
  const cleaned = { ...state };
  
  // Clean up extras - remove icon objects that can't be serialized
  if (cleaned.extras && Array.isArray(cleaned.extras)) {
    cleaned.extras = cleaned.extras.map((extra: any) => {
      const cleanedExtra = { ...extra };
      if (cleanedExtra.icon && typeof cleanedExtra.icon !== 'function') {
        delete cleanedExtra.icon;
      }
      if (!cleanedExtra.iconName && cleanedExtra.name) {
        cleanedExtra.iconName = cleanedExtra.name;
      }
      return cleanedExtra;
    });
  }
  
  return cleaned;
}

/**
 * Clear session state from sessionStorage
 */
export function clearSessionState(sessionId: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const key = getSessionStorageKey(sessionId);
    sessionStorage.removeItem(key);
    sessionStorage.removeItem(LEGACY_KEY);
  } catch (error) {
    console.error('Failed to clear session state:', error);
  }
}
