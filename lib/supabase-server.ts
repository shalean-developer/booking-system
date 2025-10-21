/**
 * Supabase Server Client for API Routes
 * 
 * Use this in API routes to properly detect authenticated users
 * This uses @supabase/ssr to correctly read auth cookies in Next.js App Router
 */

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
 * Create Supabase client with service role key (bypasses RLS)
 * Use this in API routes where you need to bypass Row Level Security
 * and perform operations that require elevated permissions
 */
export function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get() {
          return undefined; // Service role doesn't need cookies
        },
        set() {
          // Service role doesn't need to set cookies
        },
        remove() {
          // Service role doesn't need to remove cookies
        },
      },
    }
  );
}

/**
 * Get authenticated user in API route
 * Returns user object if authenticated, null otherwise
 */
export async function getServerAuthUser() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.log('❌ Auth error:', error.message);
      return null;
    }
    
    if (user) {
      console.log('✅ Server auth detected:', user.email);
    } else {
      console.log('ℹ️ No authenticated user (guest)');
    }
    
    return user;
  } catch (error) {
    console.error('💥 Server auth check failed:', error);
    return null;
  }
}

/**
 * Check if authenticated user is an admin
 * Returns true if user is authenticated and has admin role
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const authUser = await getServerAuthUser();
    
    if (!authUser) {
      return false;
    }
    
    const supabase = await createClient();
    
    // Check if customer has admin role
    const { data: customer, error } = await supabase
      .from('customers')
      .select('role')
      .eq('auth_user_id', authUser.id)
      .maybeSingle();
    
    if (error) {
      console.error('❌ Error checking admin role:', error.message);
      return false;
    }
    
    const isAdminUser = customer?.role === 'admin';
    
    if (isAdminUser) {
      console.log('✅ Admin access granted:', authUser.email);
    } else {
      console.log('❌ Admin access denied:', authUser.email);
    }
    
    return isAdminUser;
  } catch (error) {
    console.error('💥 Admin check failed:', error);
    return false;
  }
}

/**
 * Get authenticated user with customer profile (including role)
 * Returns customer object if found, null otherwise
 */
export async function getAuthUserWithProfile() {
  try {
    const authUser = await getServerAuthUser();
    
    if (!authUser) {
      return null;
    }
    
    const supabase = await createClient();
    
    const { data: customer, error } = await supabase
      .from('customers')
      .select('*')
      .eq('auth_user_id', authUser.id)
      .maybeSingle();
    
    if (error) {
      console.error('❌ Error fetching customer profile:', error.message);
      return null;
    }
    
    return customer;
  } catch (error) {
    console.error('💥 Profile fetch failed:', error);
    return null;
  }
}

