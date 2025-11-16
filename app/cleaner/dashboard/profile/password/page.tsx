import { redirect } from 'next/navigation';
import { getCleanerSession } from '@/lib/cleaner-auth';
import { PasswordClient } from './password-client';

export const dynamic = 'force-dynamic';

export default async function PasswordPage() {
  const session = await getCleanerSession();
  
  if (!session) {
    redirect('/cleaner/login');
  }

  return <PasswordClient cleaner={session} />;
}

