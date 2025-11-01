import { redirect } from 'next/navigation';
import { isAdmin, getAuthUserWithProfile } from '@/lib/supabase-server';
import { AdminDashboardClient } from './admin-client';

// Mark as dynamic since we use cookies for auth
export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  // Server-side auth check - no client-side complexity!
  const userIsAdmin = await isAdmin();
  
  if (!userIsAdmin) {
    // Redirect to login if not authenticated or not admin
    redirect('/login?returnTo=/admin');
  }

  // Fetch user data for welcome section
  const userProfile = await getAuthUserWithProfile();
  const userName = userProfile?.name || 'Admin';
  const lastLogin = userProfile?.last_login 
    ? new Date(userProfile.last_login).toLocaleDateString('en-US', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : null;

  // If we get here, user is authenticated and is admin
  return <AdminDashboardClient userName={userName} lastLogin={lastLogin} />;
}
