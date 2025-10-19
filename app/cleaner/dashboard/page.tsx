import { redirect } from 'next/navigation';
import { getCleanerSession } from '@/lib/cleaner-auth';
import { CleanerDashboardClient } from './dashboard-client';

// Mark as dynamic since we use cookies for auth
export const dynamic = 'force-dynamic';

export default async function CleanerDashboardPage() {
  // Server-side auth check
  const session = await getCleanerSession();
  
  if (!session) {
    // Redirect to login if not authenticated
    redirect('/cleaner/login');
  }

  // If we get here, cleaner is authenticated
  return <CleanerDashboardClient cleaner={session} />;
}

