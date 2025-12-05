/**
 * Shared Supabase SSR Client
 * Single instance for all client-side components
 */

import { createBrowserClient } from '@supabase/ssr';

// Create a single SSR client instance at module level
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce', // Use PKCE flow which is more secure and may help with CORS
    },
    global: {
      headers: {
        'x-client-info': 'shalean-web',
      },
    },
  }
);

