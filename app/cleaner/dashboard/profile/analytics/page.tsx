import { redirect } from 'next/navigation';
import { getCleanerSession } from '@/lib/cleaner-auth';
import { AnalyticsClient } from './analytics-client';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const session = await getCleanerSession();
  
  if (!session) {
    redirect('/cleaner/login');
  }

  return <AnalyticsClient cleaner={session} />;
}

