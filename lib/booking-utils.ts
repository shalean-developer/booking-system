/**
 * Shared utilities for booking flow
 * Consolidates duplicate slug conversion functions
 */

import type { ServiceType } from '@/types/booking';

/**
 * Convert ServiceType to URL slug
 * Used consistently across all booking components
 */
export function serviceTypeToSlug(serviceType: ServiceType): string {
  if (serviceType === 'Move In/Out') {
    return 'move-in-out';
  }
  
  return serviceType
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/**
 * Convert URL slug back to ServiceType
 * Used consistently across all booking pages
 */
export function slugToServiceType(slug: string): ServiceType | null {
  const serviceMap: Record<string, ServiceType> = {
    'standard': 'Standard',
    'deep': 'Deep',
    'move-inout': 'Move In/Out',
    'move-in-out': 'Move In/Out',
    'airbnb': 'Airbnb',
    'carpet': 'Carpet',
  };
  
  return serviceMap[slug] || null;
}

/**
 * Generate unique payment reference
 * Ensures fresh reference on each payment attempt
 */
export function generatePaymentReference(): string {
  return `BK-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate South African phone number
 */
export function isValidSAPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s-]/g, '');
  // Must be 10-11 digits and start with 0, +27, or 27
  if (cleaned.length < 10 || cleaned.length > 11) return false;
  return cleaned.startsWith('0') || cleaned.startsWith('+27') || cleaned.startsWith('27');
}

/**
 * Check if service requires team assignment
 */
export function requiresTeam(service: ServiceType | null): boolean {
  return service === 'Deep' || service === 'Move In/Out';
}

/**
 * Booking step names and mappings
 */
export type BookingStepName = 'details' | 'schedule' | 'contact' | 'cleaner' | 'review';

const STEP_NAMES: BookingStepName[] = ['details', 'schedule', 'contact', 'cleaner', 'review'];

/**
 * Convert step number to step name
 */
export function getStepName(stepNumber: number): BookingStepName {
  if (stepNumber < 0 || stepNumber >= STEP_NAMES.length) {
    return 'details';
  }
  return STEP_NAMES[stepNumber];
}

/**
 * Convert step name to step number
 */
export function getStepNumber(stepName: string): number {
  const index = STEP_NAMES.indexOf(stepName as BookingStepName);
  return index >= 0 ? index : 0;
}

/**
 * Get next step name
 */
export function getNextStep(currentStep: string): BookingStepName | null {
  const currentIndex = STEP_NAMES.indexOf(currentStep as BookingStepName);
  if (currentIndex < 0 || currentIndex >= STEP_NAMES.length - 1) {
    return null;
  }
  return STEP_NAMES[currentIndex + 1];
}

/**
 * Get previous step name
 */
export function getPreviousStep(currentStep: string): BookingStepName | null {
  const currentIndex = STEP_NAMES.indexOf(currentStep as BookingStepName);
  if (currentIndex <= 0) {
    return null;
  }
  return STEP_NAMES[currentIndex - 1];
}

/**
 * Validate step name
 */
export function isValidStep(step: string): boolean {
  return STEP_NAMES.includes(step as BookingStepName);
}

/**
 * Generate booking URL with optional step
 * If step is not provided, defaults to 'details' for backward compatibility
 */
export function getBookingUrl(slug: string, step?: BookingStepName | number): string {
  const stepName = step !== undefined 
    ? (typeof step === 'number' ? getStepName(step) : step)
    : 'details';
  return `/booking/${slug}/${stepName}`;
}

/**
 * Generate booking URL with session ID and optional state parameters
 * Includes step in URL path
 */
export function getBookingUrlWithSession(
  slug: string,
  sessionId?: string | null,
  step?: BookingStepName | number,
  state?: {
    bedrooms?: number;
    bathrooms?: number;
    offices?: number;
    numberOfCleaners?: number;
    provideEquipment?: boolean;
    date?: string | null;
    timeSlot?: string | null;
    frequency?: string;
    recurringFrequency?: string | null;
    recurringDays?: number[];
    recurringTimesByDay?: Record<number, string>;
    selectedCleanerId?: string | null;
  }
): string {
  const stepName = step !== undefined 
    ? (typeof step === 'number' ? getStepName(step) : step)
    : 'details';
  const baseUrl = `/booking/${slug}/${stepName}`;
  
  if (!sessionId && !state) {
    return baseUrl;
  }
  
  // Build search params synchronously using URLSearchParams
  const params = new URLSearchParams();
  if (sessionId) {
    params.set('sid', sessionId);
  }
  
  if (state) {
    if (state.bedrooms !== undefined && state.bedrooms !== 1) params.set('br', state.bedrooms.toString());
    if (state.bathrooms !== undefined && state.bathrooms !== 1) params.set('bh', state.bathrooms.toString());
    if (state.offices !== undefined && state.offices !== 0) params.set('of', state.offices.toString());
    if (state.numberOfCleaners !== undefined && state.numberOfCleaners !== 1) params.set('cl', state.numberOfCleaners.toString());
    if (state.provideEquipment) params.set('eq', '1');
    if (state.date) params.set('d', state.date);
    if (state.timeSlot) params.set('t', state.timeSlot);
    if (state.frequency && state.frequency !== 'one-time') {
      const freqMap: Record<string, string> = {
        'one-time': 'ot',
        'weekly': 'w',
        'bi-weekly': 'bw',
        'monthly': 'm',
      };
      params.set('f', freqMap[state.frequency] || state.frequency);
    }
    if (state.recurringDays && state.recurringDays.length > 0) {
      params.set('rd', state.recurringDays.join(','));
      if (state.recurringTimesByDay) {
        const times = state.recurringDays
          .map(day => state.recurringTimesByDay?.[day])
          .filter(Boolean) as string[];
        if (times.length > 0) {
          params.set('rt', times.join(','));
        }
      }
    }
    if (state.selectedCleanerId) params.set('clid', state.selectedCleanerId);
  }
  
  const searchString = params.toString();
  return searchString ? `${baseUrl}?${searchString}` : baseUrl;
}

