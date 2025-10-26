import { redirect } from 'next/navigation';
import { getCleanerSession } from '@/lib/cleaner-auth';
import { CleanerHeader } from '@/components/cleaner/cleaner-header';
import { AvailableBookings } from '@/components/cleaner/available-bookings';
import { Card, CardContent } from '@/components/ui/card';
import { CleanerMobileBottomNav } from '@/components/cleaner/cleaner-mobile-bottom-nav';

// Mark as dynamic since we use cookies for auth
export const dynamic = 'force-dynamic';

export default async function FindJobsPage() {
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
            Find Jobs
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Discover and claim available bookings in your service areas
          </p>
        </div>

        <Card className="border-2">
          <CardContent className="p-4 sm:p-6">
            <AvailableBookings />
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

