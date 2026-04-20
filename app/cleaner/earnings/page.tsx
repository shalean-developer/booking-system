import { redirect } from 'next/navigation';
import { getCleanerSession } from '@/lib/cleaner-auth';
import { CleanerEarningsClient } from './earnings-client';

export const dynamic = 'force-dynamic';

export default async function CleanerEarningsPage() {
  const session = await getCleanerSession();
  if (!session) {
    redirect('/cleaner/login');
  }
  return <CleanerEarningsClient />;
}
