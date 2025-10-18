/**
 * Centralized logout utilities to prevent hanging issues
 * Handles timeout, storage cleanup, and error recovery
 */

export interface LogoutOptions {
  timeout?: number; // milliseconds, default 5000
  redirectPath?: string; // default '/'
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Safely sign out from Supabase with timeout protection and storage cleanup
 */
export async function safeLogout(
  supabase: any,
  router: any,
  options: LogoutOptions = {}
): Promise<void> {
  const {
    timeout = 5000,
    redirectPath = '/',
    onSuccess,
    onError
  } = options;

  try {
    console.log('🚪 Starting safe logout process...');
    
    // First, clear storage to prevent refresh token errors
    clearSupabaseStorage();
    console.log('🧹 Cleared storage before signOut to prevent refresh token errors');
    
    // Create a timeout promise to prevent hanging
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Logout timeout after ${timeout}ms`)), timeout);
    });
    
    // Try to sign out (this might fail if refresh token is invalid, but that's okay)
    try {
      await Promise.race([
        supabase.auth.signOut(),
        timeoutPromise
      ]);
      console.log('✅ Supabase signOut completed');
    } catch (signOutError: any) {
      // Check if it's a refresh token error - this is expected and okay
      if (signOutError?.message?.includes('Invalid Refresh Token') || 
          signOutError?.message?.includes('Refresh Token Not Found') ||
          signOutError?.message?.includes('refresh_token_not_found')) {
        console.log('ℹ️ Refresh token error during signOut (expected) - continuing with logout');
      } else {
        // Re-throw if it's not a refresh token error
        throw signOutError;
      }
    }
    
    // Ensure storage is cleared again after signOut attempt
    clearSupabaseStorage();
    
    // Navigate to specified path
    router.push(redirectPath);
    router.refresh();
    
    onSuccess?.();
    
  } catch (error) {
    console.error('❌ Logout error:', error);
    
    // Force logout even if signOut failed - clear everything
    clearSupabaseStorage();
    
    // Still navigate away
    router.push(redirectPath);
    router.refresh();
    
    onError?.(error as Error);
  }
}

/**
 * Clear all Supabase-related storage data
 */
export function clearSupabaseStorage(): void {
  if (typeof window === 'undefined') return;
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const projectRef = supabaseUrl.match(/https:\/\/([^.]+)/)?.[1] || 'default';
    const storageKey = `sb-${projectRef}-auth-token`;
    
    // Clear specific Supabase storage keys
    localStorage.removeItem(storageKey);
    localStorage.removeItem('supabase.auth.token');
    
    // Clear any other Supabase-related keys
    Object.keys(localStorage).forEach(key => {
      if (key.includes('supabase') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
    
    // Also clear sessionStorage
    Object.keys(sessionStorage).forEach(key => {
      if (key.includes('supabase') || key.includes('sb-')) {
        sessionStorage.removeItem(key);
      }
    });
    
    console.log('🧹 Cleared all Supabase storage data');
  } catch (error) {
    console.error('❌ Error clearing storage:', error);
  }
}

/**
 * Check if there's corrupted session data that might cause hanging
 */
export function hasCorruptedSession(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const projectRef = supabaseUrl.match(/https:\/\/([^.]+)/)?.[1] || 'default';
    const storageKey = `sb-${projectRef}-auth-token`;
    
    const sessionData = localStorage.getItem(storageKey);
    if (!sessionData) return false;
    
    // Try to parse the session data
    const parsed = JSON.parse(sessionData);
    
    // Check if essential fields are missing or malformed
    if (!parsed.access_token || !parsed.refresh_token) {
      console.warn('⚠️ Detected corrupted session data');
      return true;
    }
    
    return false;
  } catch (error) {
    console.warn('⚠️ Could not parse session data, likely corrupted:', error);
    return true;
  }
}

/**
 * Preemptive cleanup for corrupted sessions
 */
export function cleanupCorruptedSession(): void {
  if (hasCorruptedSession()) {
    console.log('🧹 Cleaning up corrupted session data...');
    clearSupabaseStorage();
  }
}

/**
 * Handle refresh token errors by clearing storage and resetting auth state
 */
export function handleRefreshTokenError(error: any): boolean {
  const errorMessage = error?.message || '';
  
  if (errorMessage.includes('Invalid Refresh Token') || 
      errorMessage.includes('Refresh Token Not Found') ||
      errorMessage.includes('refresh_token_not_found')) {
    
    console.log('🔄 Handling refresh token error - clearing storage...');
    clearSupabaseStorage();
    return true; // Indicates error was handled
  }
  
  return false; // Error was not a refresh token error
}

/**
 * Safe session check that handles refresh token errors gracefully
 */
export async function safeGetSession(supabase: any): Promise<any> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.log('⚠️ Session check error:', error.message);
      
      // If it's a refresh token error, clear storage and return null
      if (handleRefreshTokenError(error)) {
        return null;
      }
      
      // For other errors, still return null but don't clear storage
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('❌ Unexpected error during session check:', error);
    
    // Handle any refresh token errors
    if (handleRefreshTokenError(error)) {
      return null;
    }
    
    return null;
  }
}
