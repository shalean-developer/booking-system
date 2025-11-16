import { redirect } from 'next/navigation';
import { getCleanerSession } from '@/lib/cleaner-auth';
import { CleanerProfileClient } from './cleaner-profile-client';

export const dynamic = 'force-dynamic';

export default async function CleanerProfilePage() {
  const session = await getCleanerSession();
  
  if (!session) {
    redirect('/cleaner/login');
  }

  return <CleanerProfileClient cleaner={session} />;
}

