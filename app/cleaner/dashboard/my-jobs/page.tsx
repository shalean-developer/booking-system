import { redirect } from 'next/navigation';
import { getCleanerSession } from '@/lib/cleaner-auth';
import { CleanerHeader } from '@/components/cleaner/cleaner-header';
import { MyBookings } from '@/components/cleaner/my-bookings';
import { Card, CardContent } from '@/components/ui/card';
import { CleanerMobileBottomNav } from '@/components/cleaner/cleaner-mobile-bottom-nav';

// Mark as dynamic since we use cookies for auth
export const dynamic = 'force-dynamic';

export default async function MyJobsPage() {
  const session = await getCleanerSession();
  
  if (!session) {
    redirect('/cleaner/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CleanerHeader cleaner={session} />

      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            My Jobs
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            View and manage your assigned bookings
          </p>
        </div>

        <Card className="border-2">
          <CardContent className="p-4 sm:p-6">
            <MyBookings />
          </CardContent>
        </Card>
      </main>

      {/* Mobile Bottom Navigation */}
      <CleanerMobileBottomNav />

      {/* Mobile Bottom Navigation Spacer */}
      <div className="h-20 sm:h-0" />
    </div>
  );
}

