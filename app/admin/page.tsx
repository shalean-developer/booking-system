import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/supabase-server';
import { AdminDashboardClient } from './admin-client';

export default async function AdminPage() {
  // Server-side auth check - no client-side complexity!
  const userIsAdmin = await isAdmin();
  
  if (!userIsAdmin) {
    // Redirect to login if not authenticated or not admin
    redirect('/login?returnTo=/admin');
  }

  // If we get here, user is authenticated and is admin
  return <AdminDashboardClient />;
}
