import { redirect } from 'next/navigation';
import { getCleanerSession } from '@/lib/cleaner-auth';
import { AvailabilityClient } from './availability-client';

export default async function AvailabilityPage() {
  const session = await getCleanerSession();
  
  if (!session) {
    redirect('/cleaner/login');
  }

  return <AvailabilityClient cleaner={session} />;
}

