/**
 * Environment variable validation utilities
 * Validates that all required environment variables are configured
 */

import { getZohoBooksConfigGaps } from '@/lib/zoho-books-server';

export interface EnvValidationResult {
  valid: boolean;
  missing: string[];
  errors: string[];
}

function isNonEmpty(v: string | undefined): boolean {
  return typeof v === 'string' && v.trim().length > 0;
}

/**
 * Validates env for POST /api/bookings (paid flow).
 * - Always requires Supabase (persist bookings).
 * - Paystack keys are required in production (or when REQUIRE_PAYSTACK_KEYS=true); optional in development so local testing works without Paystack.
 */
export function validateBookingEnv(): EnvValidationResult {
  const requirePaystack =
    process.env.NODE_ENV === 'production' ||
    process.env.REQUIRE_PAYSTACK_KEYS?.trim().toLowerCase() === 'true';

  const required: Record<string, string | undefined> = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };

  if (requirePaystack) {
    required.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
    required.PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
  }

  const missing = Object.entries(required)
    .filter(([_, value]) => !isNonEmpty(value))
    .map(([key]) => key);

  const errors = missing.map((key) => `Missing required environment variable: ${key}`);

  if (typeof console !== 'undefined' && missing.length === 0) {
    if (!requirePaystack && (!isNonEmpty(process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY) || !isNonEmpty(process.env.PAYSTACK_SECRET_KEY))) {
      console.warn(
        '[env-validation] Paystack keys not set — OK for local dev. Set NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY + PAYSTACK_SECRET_KEY for paid checkout; use REQUIRE_PAYSTACK_KEYS=true to enforce.',
      );
    }
    if (!isNonEmpty(process.env.RESEND_API_KEY)) {
      console.warn('[env-validation] RESEND_API_KEY not set — booking confirmation emails may fail.');
    }
    const zohoGaps = getZohoBooksConfigGaps();
    if (zohoGaps.length > 0) {
      console.warn(
        '[env-validation] Zoho Books env incomplete — paid confirmations will not include a PDF invoice until ZOHO_* matches production (Preview/Development on Vercel or .env.local). Missing:',
        zohoGaps.join('; '),
      );
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    errors,
  };
}

/**
 * Supabase only — for pay-later pending booking creation (Paystack used when user clicks Pay).
 */
export function validatePendingBookingEnv(): EnvValidationResult {
  const required: Record<string, string | undefined> = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };

  const missing = Object.entries(required)
    .filter(([_, value]) => !isNonEmpty(value))
    .map(([key]) => key);

  return {
    valid: missing.length === 0,
    missing,
    errors: missing.map((key) => `Missing required environment variable: ${key}`),
  };
}

/**
 * Validates payment-specific environment variables
 */
export function validatePaymentEnv(): EnvValidationResult {
  const required = {
    NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
    PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY,
  };

  const missing = Object.entries(required)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  const errors = missing.map(
    (key) => `Missing required environment variable: ${key}`
  );

  return { 
    valid: missing.length === 0, 
    missing,
    errors 
  };
}

/**
 * Validates database-specific environment variables
 */
export function validateDatabaseEnv(): EnvValidationResult {
  const required = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };

  const missing = Object.entries(required)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  const errors = missing.map(
    (key) => `Missing required environment variable: ${key}`
  );

  return { 
    valid: missing.length === 0, 
    missing,
    errors 
  };
}

/**
 * Validates email-specific environment variables
 */
export function validateEmailEnv(): EnvValidationResult {
  const required = {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
  };

  const optional = {
    SENDER_EMAIL: process.env.SENDER_EMAIL,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  };

  const missing = Object.entries(required)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  const missingOptional = Object.entries(optional)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  const errors = missing.map(
    (key) => `Missing required environment variable: ${key}`
  );

  if (missingOptional.length > 0) {
    errors.push(`Optional environment variables not set (will use defaults): ${missingOptional.join(', ')}`);
  }

  return { 
    valid: missing.length === 0, 
    missing,
    errors 
  };
}
