/**
 * Service-role Supabase client (bypasses RLS). No `next/headers` — safe to import from
 * any server context (App Router API routes, Pages `pages/api`, scripts, etc.).
 */

import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

function requirePublicSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) {
    throw new Error(
      'Supabase URL and anon key are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (copy from .env.example), then restart the dev server. Values are in Project Settings → API: https://supabase.com/dashboard/project/_/settings/api',
    );
  }
  return { url, anonKey };
}

/**
 * Create Supabase client with service role key (bypasses RLS).
 * Use in API routes and server code that must bypass Row Level Security.
 */
export function createServiceClient() {
  const { url } = requirePublicSupabaseEnv();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is missing. Add it to .env.local (server-only; never NEXT_PUBLIC_). Project Settings → API → service_role: https://supabase.com/dashboard/project/_/settings/api',
    );
  }

  return createClient(url, serviceKey);
}

/**
 * Service-role client typed with `Database` for modules that only touch tables in `types/database.ts`.
 */
export function createServiceClientForSchema(): SupabaseClient<Database> {
  return createServiceClient() as unknown as SupabaseClient<Database>;
}
