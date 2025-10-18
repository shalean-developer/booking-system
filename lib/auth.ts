/**
 * Supabase Auth Helper Functions
 * Purpose: Detect authenticated users in API routes
 * Note: Auth is OPTIONAL - guest checkout continues to work
 */

import { cookies } from 'next/headers';

/**
 * Get the currently authenticated user from Supabase Auth
 * Works in API routes by reading auth token from cookies
 * Returns null if no user is authenticated (guest checkout)
 * 
 * This enables:
 * - Automatic profile linking for auth users
 * - Guest checkout for non-auth users
 */
export async function getAuthUser() {
  try {
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.log('⚠️ Supabase not configured');
      return null;
    }
    
    const cookieStore = await cookies();
    
    // Try all possible Supabase cookie names
    // @supabase/ssr uses different naming patterns
    const allCookies = cookieStore.getAll();
    const cookieNames = allCookies.map(c => c.name);
    
    console.log('🔍 Auth check - Available cookies:', cookieNames);
    
    // Find Supabase auth token - try multiple naming patterns
    const authToken = 
      cookieStore.get('sb-access-token')?.value ||
      cookieStore.get('supabase-auth-token')?.value ||
      cookieStore.get('sb-auth-token')?.value ||
      // @supabase/ssr stores with project ref prefix
      allCookies.find(c => c.name.includes('-auth-token'))?.value;
    
    if (!authToken) {
      console.log('ℹ️ No auth token found - guest user');
      return null;
    }
    
    console.log('🔑 Auth token found, verifying with Supabase...');
    
    // Verify token with Supabase Auth API
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
    });
    
    if (!response.ok) {
      console.log(`❌ Auth verification failed: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const user = await response.json();
    console.log(`✅ Auth user found: ${user.email} (${user.id})`);
    return user;
    
  } catch (error) {
    // Any error - assume guest user
    console.error('💥 Auth check exception:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

/**
 * Check if a user is authenticated
 * Returns true if user is logged in, false otherwise
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getAuthUser();
  return user !== null;
}

/**
 * Get auth user email
 * Returns email if authenticated, null otherwise
 */
export async function getAuthUserEmail(): Promise<string | null> {
  const user = await getAuthUser();
  return user?.email || null;
}

