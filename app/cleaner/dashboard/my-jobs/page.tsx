import { redirect } from 'next/navigation';
import { getCleanerSession } from '@/lib/cleaner-auth';
import { MyJobsClient } from './my-jobs-client';

// Mark as dynamic since we use cookies for auth
export const dynamic = 'force-dynamic';

export default async function MyJobsPage() {
  const session = await getCleanerSession();
  
  if (!session) {
    redirect('/cleaner/login');
  }

  return <MyJobsClient />;
}

