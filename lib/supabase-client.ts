/**
 * Shared Supabase SSR Client
 * Single instance for all client-side components
 *
 * Stays untyped at runtime: `types/database.ts` does not cover every table in the app.
 * Wallet/financial code uses `createServiceClientForSchema()` on the server for typed queries.
 */

import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createBrowserClient(
  supabaseUrl,
  supabaseAnonKey,
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
