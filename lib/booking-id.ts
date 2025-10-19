/**
 * Booking ID Generation and Validation Utilities
 */

/**
 * Generate a new booking ID in SCS format
 * Format: SCS-{8 random digits}
 * 
 * @returns A unique booking ID string
 */
export function generateBookingId(): string {
  // Generate 8 random digits (10000000 to 99999999)
  const randomDigits = Math.floor(10000000 + Math.random() * 90000000);
  return `SCS-${randomDigits}`;
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
  return `SCS-${timestamp}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
}

/**
 * Validate if a booking ID is in correct format
 * Accepts both old BK- format and new SCS- format
 * 
 * @param id - The booking ID to validate
 * @returns True if valid format, false otherwise
 */
export function isValidBookingId(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  
  // Old format: BK-{timestamp}-{random}
  const oldFormat = /^BK-\d+-[a-z0-9]+$/;
  
  // New format: SCS-{8 digits}
  const newFormat = /^SCS-\d{8}$/;
  
  return oldFormat.test(id) || newFormat.test(id);
}

/**
 * Extract the numeric part from a booking ID
 * Works with both old and new formats
 * 
 * @param id - The booking ID
 * @returns The numeric part or null if invalid
 */
export function extractBookingIdNumber(id: string): string | null {
  if (!isValidBookingId(id)) return null;
  
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
 * Check if a booking ID is in the new SCS format
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
