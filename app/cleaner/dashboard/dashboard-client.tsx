'use client';

import { useState, useEffect } from 'react';
import { CleanerMobileBottomNav } from '@/components/cleaner/cleaner-mobile-bottom-nav';
import { PWAInstallPrompt } from '@/components/pwa/pwa-install-prompt';
import { OfflineIndicator } from '@/components/cleaner/offline-indicator';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, MapPin, User, Phone, Home, Navigation, PlayCircle, CheckCircle, Loader2, X } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { createClient as createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { isOnline } from '@/lib/fetch-utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

interface CleanerSession {
  id: string;
  name: string;
  phone: string;
  photo_url: string | null;
  areas: string[];
  is_available: boolean;
  rating: number;
  available_monday?: boolean;
  available_tuesday?: boolean;
  available_wednesday?: boolean;
  available_thursday?: boolean;
  available_friday?: boolean;
  available_saturday?: boolean;
  available_sunday?: boolean;
}

interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  cleaner_accepted_at?: string | null;
  cleaner_on_my_way_at?: string | null;
  cleaner_started_at?: string | null;
  cleaner_completed_at?: string | null;
  customer_name?: string;
  customer_phone?: string;
  address_line1?: string;
  address_suburb?: string;
  address_city?: string;
  total_amount?: number;
  cleaner_earnings?: number;
  tip_amount?: number | null; // Tip amount in cents (goes 100% to cleaner)
}

interface CleanerDashboardClientProps {
  cleaner: CleanerSession;
}

export function CleanerDashboardClient({ cleaner }: CleanerDashboardClientProps) {
  const [todayBookings, setTodayBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actingBookingId, setActingBookingId] = useState<string | null>(null);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [declineBookingId, setDeclineBookingId] = useState<string | null>(null);
  const [reschedOpen, setReschedOpen] = useState(false);
  const [reschedDate, setReschedDate] = useState('');
  const [reschedTime, setReschedTime] = useState('');
  const [reschedNotes, setReschedNotes] = useState('');
  const [reschedBookingId, setReschedBookingId] = useState<string | null>(null);
  const [isOnlineStatus, setIsOnlineStatus] = useState(true);

  const formatTime = (time: string) => {
    if (!time) return '';
    try {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch {
      return time;
    }
  };

  const formatCurrency = (cents: number) => {
    if (!cents || cents === 0) return 'R0.00';
    return `R${(cents / 100).toFixed(2)}`;
  };

  // Basic retry helper for fetch calls with browser compatibility
  const requestWithRetry = async (url: string, init: RequestInit, retries = 2): Promise<Response> => {
    // Check if fetch is available
    if (typeof fetch === 'undefined') {
      throw new Error('Fetch API is not supported in this browser');
    }

    let lastError: any = null;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetch(url, init);
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(`${res.status} ${res.statusText} ${text}`.trim());
        }
        return res;
      } catch (err: any) {
        lastError = err;
        
        // Don't retry on certain errors (4xx client errors, except 408, 429)
        if (err?.message?.includes('40') && !err?.message?.includes('408') && !err?.message?.includes('429')) {
          throw err;
        }
        
        // Don't retry on network errors in last attempt
        if (attempt < retries) {
          // brief backoff with exponential delay
          await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
        }
      }
    }
    throw lastError || new Error('Request failed after retries');
  };

  const formatShortDateTime = (iso?: string | null) => {
    if (!iso) return null;
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return null;
      
      // Safe locale formatting with fallback
      let date: string;
      let time: string;
      
      try {
        date = d.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' });
        if (!date || date.trim().length === 0) {
          date = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) || 
                 d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
      } catch {
        date = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) || 
               d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) ||
               `${d.getDate()} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()]}`;
      }
      
      try {
        time = d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
        if (!time || time.trim().length === 0) {
          time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) || 
                 d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        }
      } catch {
        time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) || 
               d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) ||
               `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
      }
      
      return `${date} ${time}`;
    } catch {
      return null;
    }
  };

  const computeDuration = (start?: string | null, end?: string | null) => {
    if (!start) return null;
    const startMs = new Date(start).getTime();
    const endMs = end ? new Date(end).getTime() : Date.now();
    if (isNaN(startMs) || isNaN(endMs) || endMs <= startMs) return null;
    const minutes = Math.round((endMs - startMs) / (1000 * 60));
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const fetchTodayBookings = async () => {
      try {
        // Check if fetch is available
        if (typeof fetch === 'undefined') {
          console.error('Fetch API is not supported in this browser');
          setIsLoading(false);
          setTodayBookings([]);
          return;
        }

        // Check network status (especially important for mobile)
        if (!isOnline()) {
          console.warn('Device appears to be offline');
          setIsOnlineStatus(false);
          // Don't clear bookings, keep cached data visible
          setIsLoading(false);
          return;
        }
        setIsOnlineStatus(true);

        const today = new Date().toISOString().split('T')[0];
        const response = await fetch(`/api/cleaner/bookings?startDate=${today}&endDate=${today}`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          // Add timeout for mobile networks (30 seconds)
          signal: typeof AbortController !== 'undefined' ? (() => {
            const controller = new AbortController();
            setTimeout(() => controller.abort(), 30000);
            return controller.signal;
          })() : undefined,
        });
      
      if (!response.ok) {
        console.error('API response not OK:', response.status, response.statusText);
        setIsLoading(false);
        // Keep existing bookings if available
        if (todayBookings.length === 0) {
          setTodayBookings([]);
        }
        return;
      }
      
      const data = await response.json().catch((err) => {
        console.error('Error parsing JSON response:', err);
        return { ok: false, bookings: [] };
      });

      if (data.ok && data.bookings) {
        // Filter to show only today's active bookings (pending, accepted, on_my_way, in-progress)
        const activeBookings = data.bookings.filter(
          (b: Booking) => 
            ['pending', 'accepted', 'on_my_way', 'in-progress'].includes(b.status)
        );
        setTodayBookings(activeBookings);
      } else {
        console.warn('API returned data but not ok or no bookings:', data);
        // Keep existing bookings if available
        if (todayBookings.length === 0) {
          setTodayBookings([]);
        }
      }
    } catch (error: any) {
      console.error('Error fetching today bookings:', error);
      // Provide user-friendly error message
      if (error?.message?.includes('Failed to fetch') || error?.message?.includes('NetworkError') || error?.name === 'AbortError') {
        console.error('Network error - check internet connection');
        setIsOnlineStatus(false);
        // Keep existing bookings visible on mobile network errors
        if (todayBookings.length === 0) {
          setTodayBookings([]);
        }
      } else {
        setTodayBookings([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

        // Fetch today's bookings
  useEffect(() => {
    fetchTodayBookings();
    // Refresh every 5 minutes
    const interval = setInterval(fetchTodayBookings, 5 * 60 * 1000);
        // Refetch on tab focus (with feature detection)
    const onFocus = () => {
      // Only refetch if online (important for mobile)
      if (isOnline()) {
        fetchTodayBookings();
      }
    };
    if (typeof document !== 'undefined' && 'addEventListener' in document) {
      document.addEventListener('visibilitychange', onFocus);
    }

    // Listen for online/offline events (especially important for mobile)
    const handleOnline = () => {
      setIsOnlineStatus(true);
      fetchTodayBookings();
    };
    const handleOffline = () => {
      setIsOnlineStatus(false);
    };
    
    if (typeof window !== 'undefined' && 'addEventListener' in window) {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    // Realtime subscription to bookings changes
    let channel: any;
    try {
      const supabase = createSupabaseBrowserClient();
      channel = supabase
        .channel('cleaner-bookings-dashboard')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bookings',
            filter: `cleaner_id=eq.${cleaner.id}`,
          },
          (_payload: any) => {
            // Debounced lightweight refetch
            fetchTodayBookings();
          }
        )
        .subscribe();
    } catch (e) {
      console.warn('Realtime unavailable:', e);
    }

    return () => {
      clearInterval(interval);
      if (typeof document !== 'undefined' && 'removeEventListener' in document) {
        document.removeEventListener('visibilitychange', onFocus);
      }
      if (typeof window !== 'undefined' && 'removeEventListener' in window) {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
      try {
        if (channel) {
          const supabase = createSupabaseBrowserClient();
          supabase.removeChannel(channel);
        }
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAccept = async (bookingId: string) => {
    setActingBookingId(bookingId);
    try {
      // Check online status before making request (important for mobile)
      if (!isOnline()) {
        alert('You are currently offline. Please check your connection and try again.');
        setActingBookingId(null);
        return;
      }

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
      await fetchTodayBookings();
    } catch (err) {
      console.error('Error accepting booking:', err);
      alert(err instanceof Error ? err.message : 'Failed to accept booking');
    } finally {
      setActingBookingId(null);
    }
  };

  const handleOnMyWay = async (bookingId: string) => {
    setActingBookingId(bookingId);
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
      await fetchTodayBookings();
    } catch (err) {
      console.error('Error updating status:', err);
      alert(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setActingBookingId(null);
    }
  };

  const handleStart = async (bookingId: string) => {
    setActingBookingId(bookingId);
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
      await fetchTodayBookings();
    } catch (err) {
      console.error('Error starting booking:', err);
      alert(err instanceof Error ? err.message : 'Failed to start booking');
    } finally {
      setActingBookingId(null);
    }
  };

  const handleComplete = async (bookingId: string) => {
    setActingBookingId(bookingId);
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

      // Refresh bookings
      await fetchTodayBookings();
    } catch (err) {
      console.error('Error completing booking:', err);
      alert(err instanceof Error ? err.message : 'Failed to complete booking');
    } finally {
      setActingBookingId(null);
    }
  };

  const submitDecline = async () => {
    if (!declineBookingId) return;
    setActingBookingId(declineBookingId);
    try {
      const response = await requestWithRetry(`/api/cleaner/bookings/${declineBookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'declined', reason: declineReason }),
      }, 2);
      const data = await response.json();
      if (!data.ok) throw new Error(data.error || 'Failed to decline booking');
      await fetchTodayBookings();
    } catch (err) {
      console.error('Error declining booking:', err);
      alert(err instanceof Error ? err.message : 'Failed to decline booking');
    } finally {
      setActingBookingId(null);
      setDeclineOpen(false);
      setDeclineBookingId(null);
      setDeclineReason('');
    }
  };

  const submitReschedule = async () => {
    if (!reschedBookingId || (!reschedDate && !reschedTime)) {
      alert('Please provide a date or time to propose');
      return;
    }
    setActingBookingId(reschedBookingId);
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
      await fetchTodayBookings();
    } catch (err) {
      console.error('Error requesting reschedule:', err);
      alert(err instanceof Error ? err.message : 'Failed to request reschedule');
    } finally {
      setActingBookingId(null);
      setReschedOpen(false);
      setReschedBookingId(null);
      setReschedDate('');
      setReschedTime('');
      setReschedNotes('');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Offline Indicator */}
      <OfflineIndicator />
      
      {/* Blue Header */}
      <header className="bg-[#3b82f6] text-white py-4 px-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <Home className="h-6 w-6" strokeWidth={2} />
          <h1 className="text-lg font-semibold">Home</h1>
          <button
            onClick={fetchTodayBookings}
            className="rounded-md border border-white/30 text-white text-xs px-2 py-1 hover:bg-white/10"
            aria-label="Refresh"
          >
            Refresh
          </button>
        </div>
      </header>

      {/* Blue Banner */}
      <div className="bg-[#3b82f6] text-white py-6 px-4">
        <p className="text-base max-w-md mx-auto">
          Hi{cleaner?.name ? `, ${cleaner.name}` : ''}. Here's what's going on today.
          </p>
        </div>

      {/* Main Content */}
      <main className="bg-white pb-24">
        <div className="max-w-md mx-auto px-4 py-6">
          {/* Today's Scheduled Bookings Heading */}
          <h2 className="text-lg font-semibold text-gray-800 mb-6">
            TODAY'S SCHEDULED BOOKINGS
          </h2>

          {/* Bookings List or Empty State */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-400">Loading...</div>
            </div>
          ) : todayBookings.length > 0 ? (
            <div className="space-y-4">
              {todayBookings.map((booking) => (
                <Card key={booking.id} className="border border-gray-200 shadow-sm">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-[#3b82f6]" />
                          <span className="font-semibold text-gray-900">
                            {formatTime(booking.booking_time)}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500 capitalize">
                          {booking.status.replace('-', ' ')}
                        </span>
        </div>

                      {(booking.address_line1 || booking.address_suburb || booking.address_city) && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            [booking.address_line1, booking.address_suburb, booking.address_city]
                              .filter(Boolean)
                              .join(', ')
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-start gap-2 group"
                        >
                          <MapPin className="h-4 w-4 text-[#3b82f6] mt-0.5 group-hover:text-[#2563eb]" />
                          <span className="text-sm text-[#1f2933] flex-1 group-hover:underline">
                            {[booking.address_line1, booking.address_suburb, booking.address_city]
                              .filter(Boolean)
                              .join(', ')}
                          </span>
                        </a>
                      )}

                      {booking.customer_name && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-700">
                            {booking.customer_name}
                          </span>
              </div>
                      )}

                      {booking.customer_phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <a
                            href={`tel:${booking.customer_phone}`}
                            className="text-sm text-[#3b82f6] hover:underline"
                          >
                            {booking.customer_phone}
                          </a>
              </div>
                      )}

                      {/* Time tracking */}
                      {(booking.cleaner_started_at || booking.cleaner_completed_at) && (
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                          {booking.cleaner_started_at && (
                            <div className="rounded-md bg-gray-50 border border-gray-100 px-2 py-1">
                              <div className="uppercase tracking-wide text-[10px] text-gray-500">Started</div>
                              <div className="font-medium">
                                {formatShortDateTime(booking.cleaner_started_at)}
            </div>
                    </div>
                          )}
                          {booking.cleaner_completed_at && (
                            <div className="rounded-md bg-gray-50 border border-gray-100 px-2 py-1">
                              <div className="uppercase tracking-wide text-[10px] text-gray-500">Completed</div>
                              <div className="font-medium">
                                {formatShortDateTime(booking.cleaner_completed_at)}
                    </div>
                  </div>
                          )}
                          {booking.cleaner_started_at && (
                            <div className="rounded-md bg-blue-50 border border-blue-100 px-2 py-1 col-span-2">
                              <div className="uppercase tracking-wide text-[10px] text-blue-700">Duration</div>
                              <div className="font-semibold text-blue-700">
                                {computeDuration(booking.cleaner_started_at, booking.cleaner_completed_at) || '—'}
                    </div>
                  </div>
                          )}
                        </div>
                      )}

                      {booking.cleaner_earnings && (
                        <div className="pt-2 border-t border-gray-100">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">Your Earnings</span>
                            <span className="text-sm font-semibold text-[#3b82f6]">
                              {formatCurrency(booking.cleaner_earnings)}
                            </span>
                    </div>
                          {/* Show tip only if customer gave a tip */}
                          {booking.tip_amount && booking.tip_amount > 0 && (
                            <div className="flex items-center justify-between mt-1.5">
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <span className="text-yellow-500">💰</span>
                                Customer Tip
                              </span>
                              <span className="text-xs font-semibold text-yellow-600">
                                +{formatCurrency(booking.tip_amount)}
                              </span>
                  </div>
                          )}
            </div>
                      )}

                      {/* Action Buttons - Always show for today's current bookings */}
                      <div className="pt-3 border-t border-gray-100 mt-3 flex flex-wrap gap-2">
                        {/* Accept Button - for pending bookings */}
                        {booking.status === 'pending' && (
                          <Button
                            onClick={() => handleAccept(booking.id)}
                            disabled={actingBookingId === booking.id}
                            className="flex-1 bg-[#3b82f6] hover:bg-[#2563eb] text-white"
                            size="sm"
                          >
                            {actingBookingId === booking.id ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Accepting...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Accept
                              </>
                            )}
                          </Button>
                        )}

                        {/* On My Way Button - for accepted bookings */}
                        {booking.status === 'accepted' && (
                          <Button
                            onClick={() => handleOnMyWay(booking.id)}
                            disabled={actingBookingId === booking.id}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                            size="sm"
                          >
                            {actingBookingId === booking.id ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Updating...
                              </>
                            ) : (
                              <>
                                <Navigation className="h-4 w-4 mr-2" />
                                On My Way
                              </>
                            )}
                          </Button>
                        )}

                        {/* Start Job Button - for on_my_way status */}
                        {booking.status === 'on_my_way' && (
                          <Button
                            onClick={() => handleStart(booking.id)}
                            disabled={actingBookingId === booking.id}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                            size="sm"
                          >
                            {actingBookingId === booking.id ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Starting...
                              </>
                            ) : (
                              <>
                                <PlayCircle className="h-4 w-4 mr-2" />
                                Start Job
                              </>
                            )}
                          </Button>
                        )}

                        {/* Complete Button - for in-progress status */}
                        {booking.status === 'in-progress' && (
                          <Button
                            onClick={() => handleComplete(booking.id)}
                            disabled={actingBookingId === booking.id}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                            size="sm"
                          >
                            {actingBookingId === booking.id ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Completing...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Complete
                              </>
                            )}
                          </Button>
                        )}

                        {/* Decline / Reschedule - for pending or accepted */}
                        {(booking.status === 'pending' || booking.status === 'accepted') && (
                          <Button
                            onClick={() => {
                              setDeclineBookingId(booking.id);
                              setDeclineOpen(true);
                            }}
                            disabled={actingBookingId === booking.id}
                            className="px-3 py-2 text-sm border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                            size="sm"
                            variant="outline"
                          >
                            Decline
                          </Button>
                        )}
                        {(booking.status === 'pending' || booking.status === 'accepted') && (
                          <Button
                            onClick={() => {
                              setReschedBookingId(booking.id);
                              setReschedOpen(true);
                            }}
                            disabled={actingBookingId === booking.id}
                            className="px-3 py-2 text-sm border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                            size="sm"
                            variant="outline"
                          >
                            Reschedule
                          </Button>
                        )}

                        {/* View Details Link - show for all statuses */}
                        <Link
                          href={`/cleaner/dashboard/my-jobs`}
                          className="flex items-center justify-center px-3 py-2 text-sm text-[#3b82f6] font-medium hover:underline border border-[#3b82f6] rounded-md"
                        >
                          Details
                        </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
              ))}
            </div>
          ) : (
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
          )}
        </div>
      </main>

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />

      {/* Mobile Bottom Navigation */}
      <CleanerMobileBottomNav />

      {/* Bottom Spacer */}
      <div className="h-20 sm:h-0" />

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
            <Button onClick={submitDecline} disabled={!declineBookingId || actingBookingId === declineBookingId}>
              {actingBookingId === declineBookingId ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit'
              )}
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
            <Button onClick={submitReschedule} disabled={!reschedBookingId || actingBookingId === reschedBookingId}>
              {actingBookingId === reschedBookingId ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

