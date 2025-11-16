import { redirect } from 'next/navigation';
import { getCleanerSession } from '@/lib/cleaner-auth';
import { ProfileClient } from './profile-client';

// Mark as dynamic since we use cookies for auth
export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const session = await getCleanerSession();
  
  if (!session) {
    redirect('/cleaner/login');
  }

  return <ProfileClient cleaner={session} />;
}

