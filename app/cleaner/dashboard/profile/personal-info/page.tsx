import { redirect } from 'next/navigation';
import { getCleanerSession } from '@/lib/cleaner-auth';
import { PersonalInfoClient } from './personal-info-client';

export const dynamic = 'force-dynamic';

export default async function PersonalInfoPage() {
  const session = await getCleanerSession();
  
  if (!session) {
    redirect('/cleaner/login');
  }

  return <PersonalInfoClient cleaner={session} />;
}

