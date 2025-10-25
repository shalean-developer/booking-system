'use client';

import { useState, useEffect } from 'react';
import { BookingCard } from './booking-card';
import { BookingDetailsModal } from './booking-details-modal';
import { RateCustomerModal } from './rate-customer-modal';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2, Calendar, CheckCircle2, Clock, RefreshCw } from 'lucide-react';
import type { CleanerBooking } from '@/types/booking';

interface Booking extends CleanerBooking {
  cleaner_claimed_at?: string | null;
  cleaner_accepted_at?: string | null;
  cleaner_on_my_way_at?: string | null;
  cleaner_started_at?: string | null;
  cleaner_completed_at?: string | null;
  customer_rating_id?: string | null;
  recurring_schedule_id?: string | null;
}

export function MyBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [ratingBooking, setRatingBooking] = useState<Booking | null>(null);

  const fetchBookings = async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setError(null);

    try {
      const response = await fetch('/api/cleaner/bookings');
      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || 'Failed to fetch bookings');
      }

      setBookings(data.bookings);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load bookings');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleStart = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/cleaner/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'in-progress' }),
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || 'Failed to start job');
      }

      // Refresh bookings
      await fetchBookings(false);
    } catch (err) {
      console.error('Error starting job:', err);
      alert(err instanceof Error ? err.message : 'Failed to start job');
    }
  };

  const handleAccept = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/cleaner/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'accepted' }),
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || 'Failed to accept booking');
      }

      // Refresh bookings
      await fetchBookings(false);
    } catch (err) {
      console.error('Error accepting booking:', err);
      alert(err instanceof Error ? err.message : 'Failed to accept booking');
    }
  };

  const handleOnMyWay = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/cleaner/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'on_my_way' }),
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || 'Failed to update status');
      }

      // Refresh bookings
      await fetchBookings(false);
    } catch (err) {
      console.error('Error updating status:', err);
      alert(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const handleComplete = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/cleaner/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || 'Failed to complete job');
      }

      // Find booking and open rating modal
      const booking = bookings.find((b) => b.id === bookingId);
      if (booking) {
        setRatingBooking(booking);
      }

      // Refresh bookings
      await fetchBookings(false);
    } catch (err) {
      console.error('Error completing job:', err);
      alert(err instanceof Error ? err.message : 'Failed to complete job');
    }
  };

  const handleRate = async (bookingId: string, rating: number, comment: string) => {
    try {
      const response = await fetch(`/api/cleaner/bookings/${bookingId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment }),
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || 'Failed to submit rating');
      }

      // Refresh bookings
      await fetchBookings(false);
    } catch (err) {
      console.error('Error rating customer:', err);
      throw err;
    }
  };

  const upcomingBookings = bookings.filter(
    (b) => ['pending', 'accepted', 'on_my_way', 'in-progress'].includes(b.status)
  );

  const completedBookings = bookings.filter((b) => b.status === 'completed');

  // Sort by date and time
  const sortBookings = (bookingsList: Booking[]) => {
    return [...bookingsList].sort((a, b) => {
      const dateA = new Date(`${a.booking_date}T${a.booking_time}`);
      const dateB = new Date(`${b.booking_date}T${b.booking_time}`);
      return dateA.getTime() - dateB.getTime();
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <Button onClick={() => fetchBookings()} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">My Bookings</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchBookings(false)}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upcoming" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Upcoming ({upcomingBookings.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Completed ({completedBookings.length})
          </TabsTrigger>
        </TabsList>

        {/* Upcoming */}
        <TabsContent value="upcoming" className="space-y-3 mt-4">
          {upcomingBookings.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No upcoming bookings</p>
              <p className="text-sm mt-1">
                Check the Available Jobs tab to claim new bookings
              </p>
            </div>
          ) : (
            sortBookings(upcomingBookings).map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                variant="assigned"
                onAccept={handleAccept}
                onOnMyWay={handleOnMyWay}
                onStart={handleStart}
                onComplete={handleComplete}
                onRate={(b) => setRatingBooking(b)}
                onViewDetails={(b) => setSelectedBooking(b)}
              />
            ))
          )}
        </TabsContent>

        {/* Completed */}
        <TabsContent value="completed" className="space-y-3 mt-4">
          {completedBookings.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No completed bookings yet</p>
            </div>
          ) : (
            sortBookings(completedBookings)
              .reverse()
              .map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  variant="assigned"
                  onRate={(b) => setRatingBooking(b)}
                  onViewDetails={(b) => setSelectedBooking(b)}
                />
              ))
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <BookingDetailsModal
        booking={selectedBooking}
        isOpen={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
      />

      <RateCustomerModal
        booking={ratingBooking}
        isOpen={!!ratingBooking}
        onClose={() => setRatingBooking(null)}
        onSubmit={handleRate}
      />
    </div>
  );
}

