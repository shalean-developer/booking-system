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

