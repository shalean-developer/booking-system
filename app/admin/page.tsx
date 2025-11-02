import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/supabase-server';

// Mark as dynamic since we use cookies for auth
export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  // Server-side auth check - no client-side complexity!
  const userIsAdmin = await isAdmin();
  
  if (!userIsAdmin) {
    // Redirect to login if not authenticated or not admin
    redirect('/login?returnTo=/admin');
  }

  // Redirect to dashboard (v3 route-based structure)
  redirect('/admin/dashboard');
}
