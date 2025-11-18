'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay } from 'date-fns';

interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  service_type: string;
  customer_name?: string;
  address_suburb?: string;
  cleaner_earnings?: number;
  [key: string]: any; // Allow additional properties
}

interface CalendarViewProps {
  bookings: Booking[];
  onDateClick?: (date: Date) => void;
  onBookingClick?: (booking: Booking) => void;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  accepted: 'bg-purple-100 text-purple-800 border-purple-200',
  'on_my_way': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  declined: 'bg-gray-100 text-gray-800 border-gray-200',
};

export function CalendarView({ bookings, onDateClick, onBookingClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Group bookings by date
  const bookingsByDate = useMemo(() => {
    const grouped: Record<string, Booking[]> = {};
    bookings.forEach((booking) => {
      const dateKey = booking.booking_date;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(booking);
    });
    return grouped;
  }, [bookings]);

  // Get bookings for a specific date
  const getBookingsForDate = (date: Date): Booking[] => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return bookingsByDate[dateKey] || [];
  };

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get first day of month (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfWeek = getDay(monthStart);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Create calendar grid with empty cells for days before month start
  const calendarDays = useMemo(() => {
    const days: (Date | null)[] = [];
    
    // Add empty cells for days before month start
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days in the month
    daysInMonth.forEach((day) => {
      days.push(day);
    });
    
    return days;
  }, [daysInMonth, firstDayOfWeek]);

  const formatCurrency = (cents: number | null | undefined) => {
    if (!cents || cents === 0) return 'R0.00';
    return `R${(cents / 100).toFixed(2)}`;
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    try {
      const parts = timeStr.split(':');
      if (parts.length < 2) return timeStr;
      const hours = parseInt(parts[0], 10);
      const minutes = parts[1];
      if (isNaN(hours)) return timeStr;
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHour = hours % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch {
      return timeStr.slice(0, 5);
    }
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousMonth}
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-lg font-semibold">
                {format(currentDate, 'MMMM yyyy')}
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextMonth}
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
              >
                Today
              </Button>
              <div className="flex gap-1 border border-gray-200 rounded-md p-1">
                <Button
                  variant={viewMode === 'month' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('month')}
                  className="h-7 px-3 text-xs"
                >
                  Month
                </Button>
                <Button
                  variant={viewMode === 'week' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('week')}
                  className="h-7 px-3 text-xs"
                >
                  Week
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-semibold text-gray-600 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const dayBookings = getBookingsForDate(day);
              const isToday = isSameDay(day, new Date());
              const isCurrentMonth = isSameMonth(day, currentDate);

              return (
                <div
                  key={day.toISOString()}
                  className={`
                    aspect-square border border-gray-200 rounded-md p-1
                    ${isToday ? 'bg-blue-50 border-blue-300' : ''}
                    ${!isCurrentMonth ? 'opacity-40' : ''}
                    ${onDateClick ? 'cursor-pointer hover:bg-gray-50' : ''}
                    transition-colors
                  `}
                  onClick={() => onDateClick?.(day)}
                >
                  <div className="flex flex-col h-full">
                    <div
                      className={`
                        text-xs font-medium mb-1
                        ${isToday ? 'text-blue-600' : 'text-gray-700'}
                      `}
                    >
                      {format(day, 'd')}
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-0.5">
                      {dayBookings.slice(0, 3).map((booking) => (
                        <div
                          key={booking.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onBookingClick?.(booking);
                          }}
                          className={`
                            text-[10px] px-1 py-0.5 rounded truncate
                            ${STATUS_COLORS[booking.status] || 'bg-gray-100 text-gray-800'}
                            ${onBookingClick ? 'cursor-pointer hover:opacity-80' : ''}
                            transition-opacity
                          `}
                          title={`${formatTime(booking.booking_time)} - ${booking.service_type}`}
                        >
                          {formatTime(booking.booking_time)}
                        </div>
                      ))}
                      {dayBookings.length > 3 && (
                        <div className="text-[10px] text-gray-500 px-1">
                          +{dayBookings.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="font-medium text-gray-700">Status:</span>
        {Object.entries(STATUS_COLORS).map(([status, className]) => (
          <Badge key={status} className={className} variant="outline">
            {status.replace('_', ' ')}
          </Badge>
        ))}
      </div>
    </div>
  );
}

