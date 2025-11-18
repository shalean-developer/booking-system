'use client';

import { useState, useEffect } from 'react';
import { BookingCard } from './booking-card';
import { BookingDetailsModal } from './booking-details-modal';
import { RateCustomerModal } from './rate-customer-modal';
import { BookingCardSkeleton } from './booking-card-skeleton';
import { Loader2, Clock, AlertCircle } from 'lucide-react';
import type { CleanerBooking } from '@/types/booking';
import { createClient as createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

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
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'current' | 'past'>('current');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [ratingBooking, setRatingBooking] = useState<Booking | null>(null);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [declineBookingId, setDeclineBookingId] = useState<string | null>(null);
  const [reschedOpen, setReschedOpen] = useState(false);
  const [reschedDate, setReschedDate] = useState('');
  const [reschedTime, setReschedTime] = useState('');
  const [reschedNotes, setReschedNotes] = useState('');
  const [reschedBookingId, setReschedBookingId] = useState<string | null>(null);

  const fetchBookings = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Use retry + no-store to avoid dev/HMR caching issues
      const response = await requestWithRetry('/api/cleaner/bookings', { method: 'GET', cache: 'no-store' }, 2);
      const data = await response.json().catch(() => ({ ok: false, error: 'Invalid response' }));

      if (!data.ok) {
        throw new Error(data.error || 'Failed to fetch bookings');
      }

      setBookings(data.bookings);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load bookings';
      
      // Check if it's a network error
      if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('Failed to fetch')) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Track current cleaner id from fetched bookings (first non-null we see)
  const [listenerCleanerId, setListenerCleanerId] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings().then(() => {
      const firstWithCleaner = bookings.find((b) => !!b.cleaner_id);
      if (firstWithCleaner?.cleaner_id && firstWithCleaner.cleaner_id !== listenerCleanerId) {
        setListenerCleanerId(firstWithCleaner.cleaner_id);
      }
    });
    const onFocus = () => fetchBookings();
    document.addEventListener('visibilitychange', onFocus);
    return () => document.removeEventListener('visibilitychange', onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Realtime subscription, scoped to cleaner_id when known
  useEffect(() => {
    let channel: any;
    try {
      const supabase = createSupabaseBrowserClient();
      const opts: any = {
        event: '*',
        schema: 'public',
        table: 'bookings',
      };
      if (listenerCleanerId) {
        opts.filter = `cleaner_id=eq.${listenerCleanerId}`;
      }
      channel = supabase
        .channel('cleaner-bookings-my-jobs')
        .on('postgres_changes', opts, (_payload: any) => {
          fetchBookings();
        })
        .subscribe();
    } catch (e) {
      console.warn('Realtime unavailable:', e);
    }

    return () => {
      try {
        if (channel) {
          const supabase = createSupabaseBrowserClient();
          supabase.removeChannel(channel);
        }
      } catch {}
    };
    // re-subscribe when cleanerId known/changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listenerCleanerId]);

  // Basic retry helper
  const requestWithRetry = async (url: string, init: RequestInit, retries = 2): Promise<Response> => {
    let lastError: any = null;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetch(url, init);
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(`${res.status} ${res.statusText} ${text}`.trim());
        }
        return res;
      } catch (err) {
        lastError = err;
        await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
      }
    }
    throw lastError || new Error('Request failed');
  };

  const handleStart = async (bookingId: string) => {
    try {
      const response = await requestWithRetry(`/api/cleaner/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'in-progress' }),
      }, 2);

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || 'Failed to start booking');
      }

      // Refresh bookings
      await fetchBookings();
    } catch (err) {
      console.error('Error starting booking:', err);
      alert(err instanceof Error ? err.message : 'Failed to start booking');
    }
  };

  const handleAccept = async (bookingId: string) => {
    try {
      const response = await requestWithRetry(`/api/cleaner/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'accepted' }),
      }, 2);

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || 'Failed to accept booking');
      }

      // Refresh bookings
      await fetchBookings();
    } catch (err) {
      console.error('Error accepting booking:', err);
      alert(err instanceof Error ? err.message : 'Failed to accept booking');
    }
  };

  const handleOnMyWay = async (bookingId: string) => {
    try {
      const response = await requestWithRetry(`/api/cleaner/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'on_my_way' }),
      }, 2);

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || 'Failed to update status');
      }

      // Refresh bookings
      await fetchBookings();
    } catch (err) {
      console.error('Error updating status:', err);
      alert(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const handleComplete = async (bookingId: string) => {
    try {
      const response = await requestWithRetry(`/api/cleaner/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      }, 2);

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || 'Failed to complete booking');
      }

      // Find booking and open rating modal
      const booking = bookings.find((b) => b.id === bookingId);
      if (booking) {
        setRatingBooking(booking);
      }

      // Refresh bookings
      await fetchBookings();
    } catch (err) {
      console.error('Error completing booking:', err);
      alert(err instanceof Error ? err.message : 'Failed to complete booking');
    }
  };

  const submitDecline = async () => {
    if (!declineBookingId) return;
    try {
      const response = await requestWithRetry(`/api/cleaner/bookings/${declineBookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'declined', reason: declineReason }),
      }, 2);
      const data = await response.json();
      if (!data.ok) throw new Error(data.error || 'Failed to decline booking');
      await fetchBookings();
      setDeclineOpen(false);
      setDeclineReason('');
      setDeclineBookingId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to decline booking');
    }
  };

  const submitReschedule = async () => {
    if (!reschedBookingId || (!reschedDate && !reschedTime)) {
      alert('Please provide a date or time to propose');
      return;
    }
    try {
      const response = await requestWithRetry(`/api/cleaner/bookings/${reschedBookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'reschedule_requested',
          proposed_date: reschedDate || undefined,
          proposed_time: reschedTime || undefined,
          notes: reschedNotes || undefined,
        }),
      }, 2);
      const data = await response.json();
      if (!data.ok) throw new Error(data.error || 'Failed to request reschedule');
      await fetchBookings();
      setReschedOpen(false);
      setReschedDate('');
      setReschedTime('');
      setReschedNotes('');
      setReschedBookingId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to request reschedule');
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
      await fetchBookings();
    } catch (err) {
      console.error('Error rating customer:', err);
      throw err;
    }
  };

  const currentBookings = bookings.filter(
    (b) => ['pending', 'accepted', 'on_my_way', 'in-progress'].includes(b.status)
  );

  const pastBookings = bookings.filter((b) => 
    ['completed', 'cancelled', 'declined', 'missed'].includes(b.status)
  );

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
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <BookingCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 px-4">
        <div className="flex flex-col items-center gap-3 mb-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <div className="space-y-1">
            <p className="text-red-600 font-medium">Failed to load bookings</p>
            <p className="text-sm text-gray-500">{error}</p>
          </div>
        </div>
        <Button 
          onClick={() => fetchBookings()} 
          className="bg-[#3b82f6] hover:bg-[#2563eb] text-white"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Booking Navigation Tabs */}
      <div className="border-b border-gray-200 px-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex gap-8">
          <button
            onClick={() => setActiveTab('current')}
            className={`py-3 text-sm font-medium relative transition-all duration-200 ${
              activeTab === 'current'
                ? 'text-[#3b82f6]'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            aria-label="View current bookings"
            aria-current={activeTab === 'current' ? 'page' : undefined}
          >
            CURRENT
            {activeTab === 'current' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3b82f6]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`py-3 text-sm font-medium relative transition-all duration-200 ${
              activeTab === 'past'
                ? 'text-[#3b82f6]'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            aria-label="View past bookings"
            aria-current={activeTab === 'past' ? 'page' : undefined}
          >
            PAST
            {activeTab === 'past' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3b82f6]" />
            )}
          </button>
          </div>
          <button
            onClick={fetchBookings}
            className="rounded-md border border-gray-300 text-gray-700 text-xs px-2 py-1 hover:bg-gray-50"
            aria-label="Refresh"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="px-4 py-6">
        {activeTab === 'current' ? (
          currentBookings.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-4">
              {sortBookings(currentBookings).map((booking) => (
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
                  onDecline={(id) => {
                    setDeclineBookingId(id);
                    setDeclineOpen(true);
                  }}
                  onReschedule={(id) => {
                    setReschedBookingId(id);
                    setReschedOpen(true);
                  }}
                />
              ))}
            </div>
          )
        ) : (
          pastBookings.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-4">
              {sortBookings(pastBookings)
                .reverse()
                .map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    variant="assigned"
                    onRate={(b) => setRatingBooking(b)}
                    onViewDetails={(b) => setSelectedBooking(b)}
                  />
                ))}
            </div>
          )
        )}
      </div>

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

      {/* Decline Modal */}
      <Dialog open={declineOpen} onOpenChange={setDeclineOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Decline booking</DialogTitle>
            <DialogDescription>Optionally add a reason for declining. This will be visible to admin.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Textarea
              placeholder="Reason (optional)"
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
            />
          </div>
          <DialogFooter className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setDeclineOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitDecline} disabled={!declineBookingId}>
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule Modal */}
      <Dialog open={reschedOpen} onOpenChange={setReschedOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request reschedule</DialogTitle>
            <DialogDescription>Propose a new date and/or time. Admin will review your request.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-xs text-gray-600 mb-1">Date</div>
                <Input
                  type="date"
                  value={reschedDate}
                  onChange={(e) => setReschedDate(e.target.value)}
                />
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1">Time</div>
                <Input
                  type="time"
                  value={reschedTime}
                  onChange={(e) => setReschedTime(e.target.value)}
                />
              </div>
            </div>
            <Textarea
              placeholder="Additional note (optional)"
              value={reschedNotes}
              onChange={(e) => setReschedNotes(e.target.value)}
            />
          </div>
          <DialogFooter className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setReschedOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitReschedule} disabled={!reschedBookingId}>
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12">
      {/* Empty State Illustration - Raised Hands with Watches (4 arms) */}
      <div className="mb-6 flex items-center justify-center">
        <div className="relative">
          {/* Representing 4 raised hands/arms with watches */}
          <div className="flex gap-2 items-end">
            {/* Arm 1 */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center mb-1">
                <Clock className="h-5 w-5 text-gray-400" />
              </div>
              <div className="w-8 h-16 bg-gray-100 rounded-t-md"></div>
            </div>
            {/* Arm 2 */}
            <div className="flex flex-col items-center pt-2">
              <div className="w-12 h-12 rounded-full bg-[#dbeafe] border border-[#3b82f6] flex items-center justify-center mb-1">
                <Clock className="h-5 w-5 text-[#3b82f6]" />
              </div>
              <div className="w-8 h-16 bg-[#dbeafe] rounded-t-md"></div>
            </div>
            {/* Arm 3 */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center mb-1">
                <Clock className="h-5 w-5 text-gray-400" />
              </div>
              <div className="w-8 h-16 bg-gray-100 rounded-t-md"></div>
            </div>
            {/* Arm 4 */}
            <div className="flex flex-col items-center pt-3">
              <div className="w-12 h-12 rounded-full bg-[#dbeafe] border border-[#3b82f6] flex items-center justify-center mb-1">
                <Clock className="h-5 w-5 text-[#3b82f6]" />
              </div>
              <div className="w-8 h-16 bg-[#dbeafe] rounded-t-md"></div>
            </div>
          </div>
        </div>
      </div>

      <p className="text-gray-700 font-medium mb-2">You have no bookings.</p>
      <p className="text-sm text-gray-500 max-w-xs mx-auto">
        Make sure your Availability is up to date so Clients can hire you.
      </p>
    </div>
  );
}

