import { redirect } from 'next/navigation';
import { getCleanerSession } from '@/lib/cleaner-auth';
import { PaymentsClient } from './payments-client';

export const dynamic = 'force-dynamic';

export default async function PaymentsPage() {
  const session = await getCleanerSession();
  
  if (!session) {
    redirect('/cleaner/login');
  }

  return <PaymentsClient cleaner={session} />;
}

