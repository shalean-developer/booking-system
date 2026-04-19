/**
 * Shared Supabase SSR Client
 * Single instance for all client-side components
 *
 * Stays untyped at runtime: `types/database.ts` does not cover every table in the app.
 * Wallet/financial code uses `createServiceClientForSchema()` on the server for typed queries.
 */

import { createBrowserClient } from '@supabase/ssr';
import { processLock } from '@supabase/auth-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

/**
 * In development, Next.js Fast Refresh / HMR can interleave with Supabase's default
 * `navigatorLock` (Web Locks + steal recovery), surfacing AbortError:
 * "Lock broken by another request with the 'steal' option."
 * `processLock` coordinates only within this tab — fine for local dev.
 * Production keeps the default cross-tab lock for coordinated session refresh.
 */
const devAuthLock =
  process.env.NODE_ENV === 'development' ? ({ lock: processLock } as const) : {};

export const supabase = createBrowserClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce', // Use PKCE flow which is more secure and may help with CORS
      ...devAuthLock,
    },
    global: {
      headers: {
        'x-client-info': 'shalean-web',
      },
    },
  }
);
