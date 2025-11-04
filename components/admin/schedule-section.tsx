'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  Search, 
  Calendar,
  Clock,
  User,
  MapPin,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { fetcher } from '@/lib/fetcher';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { format } from 'date-fns';

interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  service_type: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  address_line1: string;
  address_suburb: string;
  address_city: string;
  status: string;
  cleaner_id: string | null;
  cleaner_name?: string | null;
}

export function ScheduleSection() {
  const [searchInput, setSearchInput] = useState('');
  const [dateFilter, setDateFilter] = useState('upcoming'); // upcoming, today, tomorrow, week

  // Debounce search input
  const search = useDebouncedValue(searchInput, 500);

  // Build API URL with params
  const params = new URLSearchParams({
    page: '1',
    limit: '200', // Get more bookings for schedule view
    ...(search && { search }),
  });

  // Use SWR for data fetching
  const { data, error, isLoading, mutate } = useSWR<{
    bookings: Booking[];
    pagination: { totalPages: number };
  }>(
    `/api/admin/bookings?${params}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  const bookings = data?.bookings || [];

  // Filter bookings based on date filter and search
  const upcomingBookings = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let filtered = bookings.filter(b => {
      const bookingDate = new Date(b.booking_date);
      bookingDate.setHours(0, 0, 0, 0);
      
      // Only show upcoming bookings with active statuses
      if (bookingDate < today || !['pending', 'accepted', 'confirmed', 'ongoing'].includes(b.status)) {
        return false;
      }
      
      // Apply date filter
      const dateStr = bookingDate.toISOString().split('T')[0];
      const todayStr = today.toISOString().split('T')[0];
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      const weekEnd = new Date(today);
      weekEnd.setDate(weekEnd.getDate() + 7);
      const weekEndStr = weekEnd.toISOString().split('T')[0];
      
      switch (dateFilter) {
        case 'today':
          return dateStr === todayStr;
        case 'tomorrow':
          return dateStr === tomorrowStr;
        case 'week':
          return dateStr >= todayStr && dateStr <= weekEndStr;
        default: // upcoming
          return true;
      }
    });
    
    return filtered.sort((a, b) => {
      const dateCompare = new Date(a.booking_date).getTime() - new Date(b.booking_date).getTime();
      if (dateCompare !== 0) return dateCompare;
      return a.booking_time.localeCompare(b.booking_time);
    });
  }, [bookings, dateFilter]);

  // Group bookings by date
  const bookingsByDate = useMemo(() => {
    const grouped: Record<string, Booking[]> = {};
    
    upcomingBookings.forEach(booking => {
      const dateKey = booking.booking_date;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(booking);
    });
    
    return grouped;
  }, [upcomingBookings]);

  const sortedDates = Object.keys(bookingsByDate).sort();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'accepted':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'ongoing':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-12 text-red-500">
            Error loading schedule. Please try again.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Schedule</h2>
          <p className="text-gray-600">View upcoming bookings organized by date</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search by customer name, service type..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={dateFilter === 'today' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDateFilter('today')}
              >
                Today
              </Button>
              <Button
                variant={dateFilter === 'tomorrow' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDateFilter('tomorrow')}
              >
                Tomorrow
              </Button>
              <Button
                variant={dateFilter === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDateFilter('week')}
              >
                Next 7 Days
              </Button>
              <Button
                variant={dateFilter === 'upcoming' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDateFilter('upcoming')}
              >
                All Upcoming
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule */}
      {sortedDates.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-12 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No upcoming bookings found</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {sortedDates.map(date => {
            const dateBookings = bookingsByDate[date];
            const dateObj = new Date(date);
            const isToday = format(dateObj, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
            const isTomorrow = format(dateObj, 'yyyy-MM-dd') === format(new Date(Date.now() + 86400000), 'yyyy-MM-dd');
            
            return (
              <Card key={date}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <span>
                      {isToday ? 'Today' : isTomorrow ? 'Tomorrow' : format(dateObj, 'EEEE, MMMM d, yyyy')}
                    </span>
                    <Badge variant="secondary" className="ml-2">
                      {dateBookings.length} {dateBookings.length === 1 ? 'booking' : 'bookings'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dateBookings.map(booking => (
                      <div
                        key={booking.id}
                        className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge className={getStatusColor(booking.status)}>
                              {booking.status}
                            </Badge>
                            <span className="text-sm font-semibold text-gray-900">
                              {booking.service_type}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{booking.booking_time}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              <span>{booking.customer_name}</span>
                            </div>
                            {booking.cleaner_name && (
                              <div className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                <span>Cleaner: {booking.cleaner_name}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              <span>{booking.address_suburb}, {booking.address_city}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

