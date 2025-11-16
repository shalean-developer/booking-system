'use client';

import { useState, useEffect } from 'react';
import { BookingCard } from './booking-card';
import { BookingDetailsModal } from './booking-details-modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Briefcase, RefreshCw, Calendar, Search } from 'lucide-react';
import type { CleanerBooking } from '@/types/booking';

interface Booking extends CleanerBooking {
  cleaner_claimed_at?: string | null;
  cleaner_accepted_at?: string | null;
  cleaner_on_my_way_at?: string | null;
  cleaner_started_at?: string | null;
  cleaner_completed_at?: string | null;
  customer_rating_id?: string | null;
  distance?: number | null;
}

export function AvailableBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [dateFilter, setDateFilter] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  const fetchAvailableBookings = async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setError(null);

    try {
      const params = new URLSearchParams();
      if (dateFilter) {
        params.set('date', dateFilter);
      }
      if (location) {
        params.set('lat', location.lat.toString());
        params.set('lng', location.lng.toString());
      }

      const response = await fetch(`/api/cleaner/bookings/available?${params}`);
      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || 'Failed to fetch available bookings');
      }

      setBookings(data.bookings);
    } catch (err) {
      console.error('Error fetching available bookings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load available bookings');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  useEffect(() => {
    fetchLocation();
  }, []);

  useEffect(() => {
    fetchAvailableBookings();
  }, [dateFilter, location]);

  const handleClaim = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/cleaner/bookings/${bookingId}/claim`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || 'Failed to claim booking');
      }

      // Show success message
      alert('✅ Booking claimed successfully! Check "My Bookings" tab.');

      // Refresh available bookings
      await fetchAvailableBookings(false);
    } catch (err) {
      console.error('Error claiming booking:', err);
      alert(err instanceof Error ? err.message : 'Failed to claim booking');
    }
  };

  const handleRefresh = () => {
    fetchLocation();
    fetchAvailableBookings(false);
  };

  // Sort by date and time
  const sortedBookings = [...bookings].sort((a, b) => {
    const dateA = new Date(`${a.booking_date}T${a.booking_time}`);
    const dateB = new Date(`${b.booking_date}T${b.booking_time}`);
    return dateA.getTime() - dateB.getTime();
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#3b82f6]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 px-4">
        <div className="text-red-600 mb-4">{error}</div>
        <button 
          onClick={() => fetchAvailableBookings()} 
          className="px-4 py-2 bg-[#3b82f6] text-white rounded-md hover:bg-[#2563eb] transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Available Bookings</h2>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50"
        >
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 animate-spin text-[#3b82f6]" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="pl-10"
            placeholder="Filter by date"
          />
        </div>
        {dateFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDateFilter('')}
          >
            Clear
          </Button>
        )}
      </div>

      {/* Location Status */}
      {location && (
        <div className="text-xs text-gray-500 flex items-center gap-1">
          <Search className="h-3 w-3" />
          Showing bookings in your service areas
        </div>
      )}

      {/* Bookings List */}
      {sortedBookings.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Briefcase className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium">No available bookings right now</p>
          <p className="text-sm mt-1">
            Check back later or adjust your filters
          </p>
          <button
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-[#3b82f6] text-white rounded-md hover:bg-[#2563eb] transition-colors flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedBookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              variant="available"
              onClaim={handleClaim}
              onViewDetails={(b) => setSelectedBooking(b)}
            />
          ))}
        </div>
      )}

      {/* Details Modal */}
      <BookingDetailsModal
        booking={selectedBooking}
        isOpen={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
      />
    </div>
  );
}

