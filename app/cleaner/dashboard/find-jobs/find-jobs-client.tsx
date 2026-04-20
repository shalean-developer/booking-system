'use client';

import { useSearchParams } from 'next/navigation';
import { AvailableBookings } from '@/components/cleaner/available-bookings';
import { CleanerMobileBottomNav } from '@/components/cleaner/cleaner-mobile-bottom-nav';
import { Briefcase, Zap } from 'lucide-react';

export function FindJobsClient() {
  const searchParams = useSearchParams();
  const fromSupply = searchParams.get('from') === 'supply';

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-[#2563eb] text-white py-4 px-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <Briefcase className="h-6 w-6" strokeWidth={2} />
          <h1 className="text-lg font-semibold">Available jobs</h1>
          <Briefcase className="h-6 w-6" strokeWidth={2} />
        </div>
      </header>

      <div className="bg-[#2563eb] text-white py-5 px-4">
        <p className="text-sm max-w-md mx-auto opacity-95">
          Nearby paid jobs in your service areas — claim or join a crew in seconds.
        </p>
      </div>

      {fromSupply && (
        <div className="max-w-md mx-auto px-4 -mt-2 pb-2">
          <div className="rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 px-4 py-3 flex gap-3 items-start shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-200/80 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-amber-900" />
            </div>
            <div>
              <p className="text-sm font-bold">High demand in your area</p>
              <p className="text-xs text-amber-900/80 mt-0.5 leading-snug">
                Stay online and grab jobs below — surge pricing may apply on the customer side so
                you earn more when it&apos;s busy.
              </p>
            </div>
          </div>
        </div>
      )}

      <main className="bg-white pb-24">
        <div className="max-w-md mx-auto px-4 py-6">
          <AvailableBookings />
        </div>
      </main>

      <CleanerMobileBottomNav />

      <div className="h-20 sm:h-0" />
    </div>
  );
}
