'use client';

import { useState, useEffect } from 'react';
import { CleanerMobileBottomNav } from '@/components/cleaner/cleaner-mobile-bottom-nav';
import dynamic from 'next/dynamic';
import { BookingDetailsModal } from '@/components/cleaner/booking-details-modal';

// Lazy load calendar view (heavy component with date-fns)
const CalendarView = dynamic(
  () => import('@/components/cleaner/calendar-view').then(mod => ({ default: mod.CalendarView })),
  {
    loading: () => <div className="p-8 text-center text-gray-500">Loading calendar...</div>,
    ssr: false,
  }
);
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { CleanerSession } from '@/lib/cleaner-auth';
import type { CleanerBooking } from '@/types/booking';

interface CleanerSessionProps {
  cleaner: CleanerSession;
}

interface Booking extends CleanerBooking {
  cleaner_claimed_at?: string | null;
  cleaner_accepted_at?: string | null;
  cleaner_on_my_way_at?: string | null;
  cleaner_started_at?: string | null;
  cleaner_completed_at?: string | null;
  customer_rating_id?: string | null;
  recurring_schedule_id?: string | null;
}

export function CalendarClient({ cleaner }: CleanerSessionProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/cleaner/bookings', {
        method: 'GET',
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.ok) {
        setBookings(data.bookings || []);
      } else {
        throw new Error(data.error || 'Failed to fetch bookings');
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load bookings';
      
      if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateClick = (date: Date) => {
    // Could open a modal to view/create bookings for that date
    console.log('Date clicked:', date);
  };

  const handleBookingClick = (booking: any) => {
    // Find the full booking object from our bookings array
    const fullBooking = bookings.find((b) => b.id === booking.id);
    if (fullBooking) {
      setSelectedBooking(fullBooking);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <header className="bg-[#3b82f6] text-white py-4 px-4">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <Link href="/cleaner/dashboard" className="p-1">
              <ArrowLeft className="h-6 w-6" strokeWidth={2} />
            </Link>
            <h1 className="text-lg font-semibold">Calendar</h1>
            <div className="w-6" />
          </div>
        </header>
        <main className="bg-white pb-24">
          <div className="max-w-md mx-auto px-4 py-12">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#3b82f6]" />
            </div>
          </div>
        </main>
        <CleanerMobileBottomNav />
        <div className="h-20 sm:h-0" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <header className="bg-[#3b82f6] text-white py-4 px-4">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <Link href="/cleaner/dashboard" className="p-1">
              <ArrowLeft className="h-6 w-6" strokeWidth={2} />
            </Link>
            <h1 className="text-lg font-semibold">Calendar</h1>
            <div className="w-6" />
          </div>
        </header>
        <main className="bg-white pb-24">
          <div className="max-w-md mx-auto px-4 py-12">
            <div className="text-center">
              <div className="flex flex-col items-center gap-3 mb-4">
                <AlertCircle className="h-12 w-12 text-red-500" />
                <div className="space-y-1">
                  <p className="text-red-600 font-medium">Failed to load calendar</p>
                  <p className="text-sm text-gray-500">{error}</p>
                </div>
              </div>
              <Button onClick={fetchBookings} className="bg-[#3b82f6] hover:bg-[#2563eb] text-white">
                Try Again
              </Button>
            </div>
          </div>
        </main>
        <CleanerMobileBottomNav />
        <div className="h-20 sm:h-0" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-[#3b82f6] text-white py-4 px-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <Link href="/cleaner/dashboard" className="p-1">
            <ArrowLeft className="h-6 w-6" strokeWidth={2} />
          </Link>
          <h1 className="text-lg font-semibold">Calendar</h1>
          <div className="w-6" />
        </div>
      </header>

      {/* Main Content */}
      <main className="bg-white pb-24">
        <div className="max-w-md mx-auto px-4 py-6">
          <CalendarView
            bookings={bookings}
            onDateClick={handleDateClick}
            onBookingClick={handleBookingClick}
          />
        </div>
      </main>

      {/* Booking Details Modal */}
      <BookingDetailsModal
        booking={selectedBooking}
        isOpen={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
      />

      {/* Mobile Bottom Navigation */}
      <CleanerMobileBottomNav />

      {/* Bottom Spacer */}
      <div className="h-20 sm:h-0" />
    </div>
  );
}

