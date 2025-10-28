// Simple in-memory cache for customer profile lookups
// Reduces redundant API calls during booking flow

import type { Customer } from '@/types/booking';

interface CachedCustomer {
  customer: Customer | null;
  timestamp: number;
}

const cache = new Map<string, CachedCustomer>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached customer profile for email address
 * Returns null if not found or cache expired
 */
export function getCachedCustomer(email: string): Customer | null {
  if (!email) return null;
  
  const cached = cache.get(email.toLowerCase().trim());
  if (!cached) return null;
  
  const age = Date.now() - cached.timestamp;
  if (age > CACHE_TTL) {
    // Cache expired, remove it
    cache.delete(email.toLowerCase().trim());
    return null;
  }
  
  return cached.customer;
}

/**
 * Cache customer profile for email address
 */
export function setCachedCustomer(email: string, customer: Customer | null): void {
  if (!email) return;
  
  cache.set(email.toLowerCase().trim(), {
    customer,
    timestamp: Date.now(),
  });
}

/**
 * Clear cached customer profile for email address
 */
export function clearCachedCustomer(email: string): void {
  if (!email) return;
  cache.delete(email.toLowerCase().trim());
}

/**
 * Clear all cached customer profiles
 */
export function clearAllCachedCustomers(): void {
  cache.clear();
}

