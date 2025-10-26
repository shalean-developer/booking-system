import { redirect } from 'next/navigation';
import { getCleanerSession } from '@/lib/cleaner-auth';
import { CleanerHeader } from '@/components/cleaner/cleaner-header';
import { MoreClient } from './more-client';
import { CleanerMobileBottomNav } from '@/components/cleaner/cleaner-mobile-bottom-nav';

// Mark as dynamic since we use cookies for auth
export const dynamic = 'force-dynamic';

export default async function MorePage() {
  const session = await getCleanerSession();
  
  if (!session) {
    redirect('/cleaner/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CleanerHeader cleaner={session} />
      <MoreClient cleaner={session} />

      {/* Mobile Bottom Navigation */}
      <CleanerMobileBottomNav />
    </div>
  );
}

