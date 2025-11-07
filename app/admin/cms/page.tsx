import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/supabase-server';
import { AdminDashboardClient } from '../admin-client';

export const dynamic = 'force-dynamic';

export default async function CMSPage() {
  // Server-side auth check
  const userIsAdmin = await isAdmin();
  
  if (!userIsAdmin) {
    redirect('/login?returnTo=/admin/cms');
  }

  // Get user info for the client component
  const { createClient } = await import('@/lib/supabase-server');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const userName = user?.email?.split('@')[0] || 'Admin';

  return <AdminDashboardClient userName={userName} />;
}

