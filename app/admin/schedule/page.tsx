'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/admin/shared/page-header';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval, isSameDay } from 'date-fns';

interface Booking {
  id: string;
  customer_name: string;
  service_type: string;
  booking_date: string;
  booking_time: string;
  status: string;
  cleaner_name?: string;
}

export default function AdminSchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'week' | 'month'>('week');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, [currentDate, view]);

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const start = view === 'week' 
        ? startOfWeek(currentDate)
        : new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const end = view === 'week'
        ? endOfWeek(currentDate)
        : new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const params = new URLSearchParams({
        start: start.toISOString(),
        end: end.toISOString(),
      });

      const url = `/api/admin/bookings?${params.toString()}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.ok) {
        setBookings(data.bookings || []);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const weekStart = startOfWeek(currentDate);
  const weekDays = eachDayOfInterval({
    start: weekStart,
    end: endOfWeek(currentDate),
  });

  const getBookingsForDay = (day: Date) => {
    return bookings.filter((booking) => {
      const bookingDate = new Date(booking.booking_date);
      return isSameDay(bookingDate, day);
    });
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Schedule"
        description="View and manage bookings calendar"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Schedule' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant={view === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('week')}
            >
              Week
            </Button>
            <Button
              variant={view === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('month')}
            >
              Month
            </Button>
          </div>
        }
      />

      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(view === 'week' ? subWeeks(currentDate, 1) : new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold text-gray-900">
              {view === 'week'
                ? `Week of ${format(weekStart, 'MMM d, yyyy')}`
                : format(currentDate, 'MMMM yyyy')}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(view === 'week' ? addWeeks(currentDate, 1) : new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </Button>
        </div>

        {view === 'week' && (
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day, index) => {
              const dayBookings = getBookingsForDay(day);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={index}
                  className={`border rounded-lg p-2 min-h-[200px] ${
                    isToday ? 'bg-blue-50 border-blue-200' : 'bg-white'
                  }`}
                >
                  <div className="text-sm font-semibold text-gray-900 mb-2">
                    {format(day, 'EEE d')}
                  </div>
                  <div className="space-y-1">
                    {dayBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="text-xs p-1 bg-blue-100 rounded border border-blue-200 cursor-pointer hover:bg-blue-200"
                        title={`${booking.customer_name} - ${booking.service_type} at ${formatTime(booking.booking_time)}`}
                      >
                        <div className="font-medium text-blue-900">{formatTime(booking.booking_time)}</div>
                        <div className="text-blue-700 truncate">{booking.customer_name}</div>
                        <div className="text-blue-600 text-xs truncate">{booking.service_type}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {view === 'month' && (
          <div className="text-center text-gray-500 py-8">
            Month view coming soon. Please use week view for now.
          </div>
        )}
      </div>
    </div>
  );
}

