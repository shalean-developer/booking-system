/**
 * Cleaner Authentication Library
 * 
 * Handles cleaner session management, authentication, and authorization
 */

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import bcrypt from 'bcryptjs';
import { Database } from '@/types/database';

export interface CleanerSession {
  id: string; // UUID
  name: string;
  phone: string;
  photo_url: string | null;
  areas: string[];
  is_available: boolean;
  rating: number;
  available_monday?: boolean;
  available_tuesday?: boolean;
  available_wednesday?: boolean;
  available_thursday?: boolean;
  available_friday?: boolean;
  available_saturday?: boolean;
  available_sunday?: boolean;
}

const CLEANER_SESSION_COOKIE = 'cleaner_session';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Create a Supabase server client for cleaner operations
 * Note: Cleaners use cookie-based auth, not Supabase Auth
 * Permissions are enforced through API route session checks
 */
export async function createCleanerSupabaseClient() {
  const cookieStore = await cookies();

  // Check if service role key is available for cleaner operations
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  // Use service role key if available (bypasses RLS, but we do auth checks in routes)
  // Otherwise use anon key (requires proper RLS policies)
  const apiKey = serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    apiKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

/**
 * Set cleaner session in cookies
 */
export async function setCleanerSession(cleaner: CleanerSession) {
  const cookieStore = await cookies();
  const sessionData = JSON.stringify(cleaner);
  
  cookieStore.set(CLEANER_SESSION_COOKIE, sessionData, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000, // in seconds
    path: '/',
  });
}

/**
 * Get cleaner session from cookies
 */
export async function getCleanerSession(): Promise<CleanerSession | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(CLEANER_SESSION_COOKIE);
    
    if (!sessionCookie?.value) {
      return null;
    }
    
    const session = JSON.parse(sessionCookie.value) as CleanerSession;
    return session;
  } catch (error) {
    console.error('Error parsing cleaner session:', error);
    return null;
  }
}

/**
 * Clear cleaner session (logout)
 */
export async function clearCleanerSession() {
  const cookieStore = await cookies();
  cookieStore.delete(CLEANER_SESSION_COOKIE);
}

/**
 * Check if cleaner is authenticated
 */
export async function isCleanerAuthenticated(): Promise<boolean> {
  const session = await getCleanerSession();
  return session !== null;
}

/**
 * Verify cleaner credentials (phone + password)
 */
export async function verifyCleanerPassword(phone: string, password: string): Promise<CleanerSession | null> {
  try {
    const supabase = await createCleanerSupabaseClient();
    
    // Normalize phone number for search
    const normalizedPhone = normalizePhoneNumber(phone);
    console.log('🔍 Searching for cleaner with phone:', normalizedPhone);
    
    // Find cleaner by phone
    const { data: cleaner, error } = await supabase
      .from('cleaners')
      .select('id, name, phone, photo_url, areas, is_available, is_active, rating, available_monday, available_tuesday, available_wednesday, available_thursday, available_friday, available_saturday, available_sunday, password_hash, auth_provider')
      .eq('phone', normalizedPhone)
      .eq('is_active', true)
      .maybeSingle();
    
    if (error) {
      console.error('❌ Database error finding cleaner:', error);
      return null;
    }
    
    if (!cleaner) {
      console.error('❌ Cleaner not found with phone:', normalizedPhone);
      return null;
    }
    
    console.log('✅ Cleaner found:', {
      id: cleaner.id,
      name: cleaner.name,
      phone: cleaner.phone,
      auth_provider: cleaner.auth_provider,
      is_active: cleaner.is_active,
      has_password: !!cleaner.password_hash
    });
    
    // Check if password auth is enabled
    if (!cleaner.password_hash || (cleaner.auth_provider !== 'password' && cleaner.auth_provider !== 'both')) {
      console.error('❌ Password auth not enabled for this cleaner. Provider:', cleaner.auth_provider);
      return null;
    }
    
    // Verify password
    console.log('🔐 Verifying password...');
    const isValidPassword = await bcrypt.compare(password, cleaner.password_hash);
    
    if (!isValidPassword) {
      console.error('❌ Invalid password for cleaner:', cleaner.name);
      return null;
    }
    
    console.log('✅ Password verified successfully for:', cleaner.name);
    
    // Create session
    const session: CleanerSession = {
      id: cleaner.id,
      name: cleaner.name,
      phone: cleaner.phone,
      photo_url: cleaner.photo_url,
      areas: cleaner.areas,
      is_available: cleaner.is_available,
      rating: cleaner.rating,
      available_monday: cleaner.available_monday,
      available_tuesday: cleaner.available_tuesday,
      available_wednesday: cleaner.available_wednesday,
      available_thursday: cleaner.available_thursday,
      available_friday: cleaner.available_friday,
      available_saturday: cleaner.available_saturday,
      available_sunday: cleaner.available_sunday,
    };
    
    return session;
  } catch (error) {
    console.error('❌ Error verifying cleaner password:', error);
    return null;
  }
}

/**
 * Generate OTP code (6 digits)
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Store OTP code for cleaner
 */
export async function storeOTP(phone: string, otp: string): Promise<boolean> {
  try {
    const supabase = await createCleanerSupabaseClient();
    
    // Calculate expiry (5 minutes from now)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    
    // Update cleaner with OTP
    const { error } = await supabase
      .from('cleaners')
      .update({
        otp_code: otp,
        otp_expires_at: expiresAt,
        otp_last_sent: new Date().toISOString(),
      })
      .eq('phone', phone)
      .eq('is_active', true);
    
    if (error) {
      console.error('Error storing OTP:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in storeOTP:', error);
    return false;
  }
}

/**
 * Verify OTP code
 */
export async function verifyOTP(phone: string, otp: string): Promise<CleanerSession | null> {
  try {
    const supabase = await createCleanerSupabaseClient();
    
    // Find cleaner by phone
    const { data: cleaner, error } = await supabase
      .from('cleaners')
      .select('id, name, phone, photo_url, areas, is_available, is_active, rating, available_monday, available_tuesday, available_wednesday, available_thursday, available_friday, available_saturday, available_sunday, otp_code, otp_expires_at, otp_attempts, auth_provider')
      .eq('phone', phone)
      .eq('is_active', true)
      .maybeSingle();
    
    if (error || !cleaner) {
      console.error('Cleaner not found:', error);
      return null;
    }
    
    // Check if OTP auth is enabled
    if (cleaner.auth_provider !== 'otp' && cleaner.auth_provider !== 'both') {
      console.error('OTP auth not enabled for this cleaner');
      return null;
    }
    
    // Check if OTP exists
    if (!cleaner.otp_code || !cleaner.otp_expires_at) {
      console.error('No OTP found for this cleaner');
      return null;
    }
    
    // Check if OTP has expired
    if (new Date(cleaner.otp_expires_at) < new Date()) {
      console.error('OTP has expired');
      return null;
    }
    
    // Verify OTP
    if (cleaner.otp_code !== otp) {
      // Increment failed attempts
      await supabase
        .from('cleaners')
        .update({
          otp_attempts: (cleaner.otp_attempts || 0) + 1,
        })
        .eq('id', cleaner.id);
      
      console.error('Invalid OTP');
      return null;
    }
    
    // Clear OTP after successful verification
    await supabase
      .from('cleaners')
      .update({
        otp_code: null,
        otp_expires_at: null,
        otp_attempts: 0,
      })
      .eq('id', cleaner.id);
    
    // Create session
    const session: CleanerSession = {
      id: cleaner.id,
      name: cleaner.name,
      phone: cleaner.phone,
      photo_url: cleaner.photo_url,
      areas: cleaner.areas,
      is_available: cleaner.is_available,
      rating: cleaner.rating,
      available_monday: cleaner.available_monday,
      available_tuesday: cleaner.available_tuesday,
      available_wednesday: cleaner.available_wednesday,
      available_thursday: cleaner.available_thursday,
      available_friday: cleaner.available_friday,
      available_saturday: cleaner.available_saturday,
      available_sunday: cleaner.available_sunday,
    };
    
    return session;
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return null;
  }
}

/**
 * Check rate limiting for OTP requests
 */
export async function checkOTPRateLimit(phone: string): Promise<{ allowed: boolean; message?: string }> {
  try {
    const supabase = await createCleanerSupabaseClient();
    
    const { data: cleaner } = await supabase
      .from('cleaners')
      .select('otp_attempts, otp_last_sent')
      .eq('phone', phone)
      .eq('is_active', true)
      .maybeSingle();
    
    if (!cleaner) {
      return { allowed: false, message: 'Cleaner not found' };
    }
    
    // Check if too many attempts in the last 15 minutes
    if (cleaner.otp_last_sent) {
      const lastSent = new Date(cleaner.otp_last_sent);
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      
      if (lastSent > fifteenMinutesAgo && (cleaner.otp_attempts || 0) >= 3) {
        return {
          allowed: false,
          message: 'Too many OTP requests. Please try again in 15 minutes.',
        };
      }
      
      // Reset attempts if it's been more than 15 minutes
      if (lastSent < fifteenMinutesAgo) {
        await supabase
          .from('cleaners')
          .update({ otp_attempts: 0 })
          .eq('phone', phone);
      }
    }
    
    return { allowed: true };
  } catch (error) {
    console.error('Error checking OTP rate limit:', error);
    return { allowed: false, message: 'Error checking rate limit' };
  }
}

/**
 * Hash password for storage
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Validate phone number format (basic validation)
 */
export function validatePhoneNumber(phone: string): boolean {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Check if it's a valid length (8-15 digits)
  return cleaned.length >= 8 && cleaned.length <= 15;
}

/**
 * Format phone number for storage (normalize)
 */
export function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  let normalized = phone.replace(/[^\d+]/g, '');
  
  // If it starts with 0, replace with country code (assuming South Africa +27)
  if (normalized.startsWith('0')) {
    normalized = '+27' + normalized.substring(1);
  }
  
  // If it doesn't start with +, add +27
  if (!normalized.startsWith('+')) {
    normalized = '+27' + normalized;
  }
  
  return normalized;
}

/**
 * Helper to ensure cleaner ID is properly typed for UUID columns
 * Supabase handles the casting, but this makes it explicit
 */
export function cleanerIdToUuid(cleanerId: string): string {
  return cleanerId; // Already a valid UUID string
}

