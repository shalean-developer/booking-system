/**
 * Client-side Supabase client for authentication
 * Uses a proper singleton pattern with cleanup
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Global singleton instance
let supabaseClient: any = null;

export function createClient() {
  // Return existing client if available
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  // Extract project ref from URL
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)/)?.[1] || 'default';
  const storageKey = `sb-${projectRef}-auth-token`;
  
  // Create singleton client
  supabaseClient = createSupabaseClient(
    supabaseUrl,
    supabaseKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: storageKey,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        flowType: 'implicit',
      }
    }
  );

  return supabaseClient;
}

// Function to clear both singleton and localStorage (for logout)
export function clearClientAndStorage() {
  if (supabaseClient) {
    // Clear the singleton
    supabaseClient = null;
  }
  
  // Also clear localStorage
  if (typeof window !== 'undefined') {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const projectRef = supabaseUrl.match(/https:\/\/([^.]+)/)?.[1] || 'default';
    const storageKey = `sb-${projectRef}-auth-token`;
    localStorage.removeItem(storageKey);
  }
}