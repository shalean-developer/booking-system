import { redirect } from 'next/navigation';
import { getCleanerSession } from '@/lib/cleaner-auth';
import { NotificationsClient } from './notifications-client';

export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  const session = await getCleanerSession();
  if (!session) {
    redirect('/cleaner/login');
  }
  return <NotificationsClient cleaner={session} />;
}


