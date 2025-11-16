import { redirect } from 'next/navigation';
import { getCleanerSession } from '@/lib/cleaner-auth';
import { MoreClient } from './more-client';

// Mark as dynamic since we use cookies for auth
export const dynamic = 'force-dynamic';

export default async function MorePage() {
  const session = await getCleanerSession();
  
  if (!session) {
    redirect('/cleaner/login');
  }

  return <MoreClient cleaner={session} />;
}

