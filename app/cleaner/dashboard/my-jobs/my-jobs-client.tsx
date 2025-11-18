'use client';

import { useState } from 'react';
import { MyBookings } from '@/components/cleaner/my-bookings';
import dynamic from 'next/dynamic';
import { CleanerMobileBottomNav } from '@/components/cleaner/cleaner-mobile-bottom-nav';

// Lazy load recurring bookings view (only loaded when tab is active)
const RecurringBookingsView = dynamic(
  () => import('@/components/cleaner/recurring-bookings-view').then(mod => ({ default: mod.RecurringBookingsView })),
  {
    loading: () => <div className="p-8 text-center text-gray-500">Loading recurring bookings...</div>,
    ssr: false,
  }
);
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Calendar, Repeat } from 'lucide-react';

export function MyJobsClient() {
  const [activeTab, setActiveTab] = useState('bookings');

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
        <div className="max-w-md mx-auto px-4 py-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger 
                value="bookings" 
                className="flex items-center gap-2"
                aria-label="Regular bookings"
              >
                <Calendar className="h-4 w-4" />
                Bookings
              </TabsTrigger>
              <TabsTrigger 
                value="recurring" 
                className="flex items-center gap-2"
                aria-label="Recurring bookings"
              >
                <Repeat className="h-4 w-4" />
                Recurring
              </TabsTrigger>
            </TabsList>
            <TabsContent value="bookings" className="mt-0">
              <MyBookings />
            </TabsContent>
            <TabsContent value="recurring" className="mt-0">
              <RecurringBookingsView />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <CleanerMobileBottomNav />

      {/* Bottom Spacer */}
      <div className="h-20 sm:h-0" />
    </div>
  );
}

