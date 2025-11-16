'use client';

import { MyBookings } from '@/components/cleaner/my-bookings';
import { CleanerMobileBottomNav } from '@/components/cleaner/cleaner-mobile-bottom-nav';
import { Calendar } from 'lucide-react';

export function MyJobsClient() {
  return (
    <div className="min-h-screen bg-white">
      {/* Blue Header */}
      <header className="bg-[#3b82f6] text-white py-4 px-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <Calendar className="h-6 w-6" strokeWidth={2} />
          <h1 className="text-lg font-semibold">Bookings</h1>
          <Calendar className="h-6 w-6" strokeWidth={2} />
        </div>
      </header>

      {/* Main Content */}
      <main className="bg-white pb-24">
        <div className="max-w-md mx-auto">
          <MyBookings />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <CleanerMobileBottomNav />

      {/* Bottom Spacer */}
      <div className="h-20 sm:h-0" />
    </div>
  );
}

