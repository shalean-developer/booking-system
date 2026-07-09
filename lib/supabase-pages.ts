/**
 * Supabase client for the Pages Router only (`pages/*`, `pages/api/*`).
 * Uses the public anon key — no cookies, no `next/headers`.
 * Do not use in App Router Server Components or `app/api/*` when you need SSR cookies.
 */

import { createClient } from '@supabase/supabase-js';

export function createSupabasePagesClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set for Pages Router Supabase client.',
    );
  }
  return createClient(url, anonKey);
}
