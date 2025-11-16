'use client';

import { AvailableBookings } from '@/components/cleaner/available-bookings';
import { CleanerMobileBottomNav } from '@/components/cleaner/cleaner-mobile-bottom-nav';
import { Briefcase } from 'lucide-react';

export function FindJobsClient() {
  return (
    <div className="min-h-screen bg-white">
      {/* Blue Header */}
      <header className="bg-[#3b82f6] text-white py-4 px-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <Briefcase className="h-6 w-6" strokeWidth={2} />
          <h1 className="text-lg font-semibold">My Business</h1>
          <Briefcase className="h-6 w-6" strokeWidth={2} />
        </div>
      </header>

      {/* Blue Banner */}
      <div className="bg-[#3b82f6] text-white py-6 px-4">
        <p className="text-base max-w-md mx-auto">My Business</p>
      </div>

      {/* Main Content */}
      <main className="bg-white pb-24">
        <div className="max-w-md mx-auto px-4 py-6">
          <AvailableBookings />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <CleanerMobileBottomNav />

      {/* Bottom Spacer */}
      <div className="h-20 sm:h-0" />
    </div>
  );
}

