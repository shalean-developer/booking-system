import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCleanerSession } from '@/lib/cleaner-auth';
import { FindJobsClient } from './find-jobs-client';

// Mark as dynamic since we use cookies for auth
export const dynamic = 'force-dynamic';

export default async function FindJobsPage() {
  const session = await getCleanerSession();
  
  if (!session) {
    redirect('/cleaner/login');
  }

  return (
    <Suspense fallback={<div className="min-h-dvh bg-white p-6 text-sm text-slate-500">Loading…</div>}>
      <FindJobsClient />
    </Suspense>
  );
}

