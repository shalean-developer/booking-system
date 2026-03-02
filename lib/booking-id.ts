/**
 * Booking ID Generation and Validation Utilities
 */

/**
 * Generate a new booking ID in SC format
 * Format: SC{8 random digits} (e.g. SC12345678)
 *
 * @returns A unique booking ID string
 */
export function generateBookingId(): string {
  // Generate 8 random digits (10000000 to 99999999)
  const randomDigits = Math.floor(10000000 + Math.random() * 90000000);
  return `SC${randomDigits}`;
}

/**
 * Generate a booking ID with collision detection
 * Retries up to 5 times if collision occurs
 * 
 * @param existingIds - Array of existing booking IDs to check against
 * @returns A unique booking ID string
 */
export function generateUniqueBookingId(existingIds: string[] = []): string {
  const maxRetries = 5;
  let attempts = 0;
  
  while (attempts < maxRetries) {
    const newId = generateBookingId();
    
    if (!existingIds.includes(newId)) {
      return newId;
    }
    
    attempts++;
  }
  
  // Fallback: add timestamp to ensure uniqueness
  const timestamp = Date.now().toString().slice(-4);
  return `SC${timestamp}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
}

/**
 * Validate if a booking ID is in correct format
 * Accepts old BK- format, legacy SCS- format, and new SC{8 digits} format
 *
 * @param id - The booking ID to validate
 * @returns True if valid format, false otherwise
 */
export function isValidBookingId(id: string): boolean {
  if (!id || typeof id !== 'string') return false;

  // Old format: BK-{timestamp}-{random}
  const oldFormat = /^BK-\d+-[a-z0-9]+$/;
  // Legacy format: SCS-{8 digits}
  const scsFormat = /^SCS-\d{8}$/;
  // New format: SC{8 digits}
  const scFormat = /^SC\d{8}$/;

  return oldFormat.test(id) || scsFormat.test(id) || scFormat.test(id);
}

/**
 * Extract the numeric part from a booking ID
 * Works with old, legacy, and new formats
 *
 * @param id - The booking ID
 * @returns The numeric part or null if invalid
 */
export function extractBookingIdNumber(id: string): string | null {
  if (!isValidBookingId(id)) return null;

  // New format: SC{8 digits}
  if (/^SC\d{8}$/.test(id)) {
    return id.substring(2);
  }
  if (id.startsWith('SCS-')) {
    return id.substring(4); // Return the 8 digits
  }
  if (id.startsWith('BK-')) {
    // Extract timestamp from BK-{timestamp}-{random}
    const parts = id.split('-');
    return parts[1] || null;
  }

  return null;
}

/**
 * Check if a booking ID is in the new SC format (SC + 8 digits)
 *
 * @param id - The booking ID to check
 * @returns True if SC format, false otherwise
 */
export function isSCFormat(id: string): boolean {
  return /^SC\d{8}$/.test(id);
}

/**
 * Check if a booking ID is in the legacy SCS- format
 *
 * @param id - The booking ID to check
 * @returns True if SCS format, false otherwise
 */
export function isSCSFormat(id: string): boolean {
  return /^SCS-\d{8}$/.test(id);
}

/**
 * Check if a booking ID is in the old BK format
 * 
 * @param id - The booking ID to check
 * @returns True if BK format, false otherwise
 */
export function isBKFormat(id: string): boolean {
  return /^BK-\d+-[a-z0-9]+$/.test(id);
}

/**
 * Normalize a payment reference or booking id for display in the customer dashboard.
 * Returns canonical form "SHL-SC" + 8 digits when possible; otherwise a consistent fallback.
 *
 * @param paymentReference - From DB (e.g. SC12345678, SCS-8753, or Paystack ref)
 * @param bookingId - Booking UUID for fallback when payment_reference is null
 * @returns Display string (e.g. SHL-SC12345678, SHL-SC00008753, or as-is for unknown refs)
 */
export function normalizeDisplayRef(
  paymentReference: string | null | undefined,
  bookingId: string
): string {
  const ref = (paymentReference || '').trim();
  if (!ref) {
    const idNoHyphens = (bookingId || '').replace(/-/g, '');
    const suffix = idNoHyphens.length >= 8 ? idNoHyphens.slice(-8).toUpperCase() : idNoHyphens.padStart(8, '0').slice(-8).toUpperCase();
    return `SHL-SC${suffix}`;
  }
  const sc8 = /^SC(\d{8})$/;
  const scs8 = /^SCS-(\d{8})$/;
  const scsShort = /^SCS-(\d+)$/;
  const shlScs = /^SHL-SCS-(\d+)$/i;
  let match = ref.match(sc8);
  if (match) return `SHL-SC${match[1]}`;
  match = ref.match(scs8);
  if (match) return `SHL-SC${match[1]}`;
  match = ref.match(scsShort) || ref.match(shlScs);
  if (match) {
    const num = match[1].padStart(8, '0').slice(-8);
    return `SHL-SC${num}`;
  }
  return ref;
}
