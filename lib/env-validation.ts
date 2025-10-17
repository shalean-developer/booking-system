/**
 * Environment variable validation utilities
 * Validates that all required environment variables are configured
 */

export interface EnvValidationResult {
  valid: boolean;
  missing: string[];
  errors: string[];
}

/**
 * Validates that all required environment variables for booking flow are present
 */
export function validateBookingEnv(): EnvValidationResult {
  const required = {
    NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
    PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
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

