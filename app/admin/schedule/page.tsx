'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/admin/shared/page-header';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronLeft, ChevronRight, Repeat } from 'lucide-react';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval, isSameDay, startOfMonth, endOfMonth, getDay, isSameMonth, addMonths, subMonths } from 'date-fns';

interface Booking {
  id: string;
  customer_name: string;
  service_type: string;
  booking_date: string;
  booking_time: string;
  status: string;
  cleaner_name?: string;
  recurring_schedule_id?: string | null;
}

const statusColors: Record<
  string,
  { bg: string; border: string; text: string; subText: string; label: string }
> = {
  pending:      { bg: 'bg-amber-200',   border: 'border-amber-400',   text: 'text-amber-950',   subText: 'text-amber-900',   label: 'Pending' },
  confirmed:    { bg: 'bg-sky-200',     border: 'border-sky-400',     text: 'text-sky-950',     subText: 'text-sky-900',     label: 'Confirmed' },
  accepted:     { bg: 'bg-blue-200',    border: 'border-blue-400',    text: 'text-blue-950',    subText: 'text-blue-900',    label: 'Accepted' },
  'in-progress':{ bg: 'bg-indigo-200',  border: 'border-indigo-400',  text: 'text-indigo-950',  subText: 'text-indigo-900',  label: 'In Progress' },
  completed:    { bg: 'bg-emerald-200', border: 'border-emerald-400', text: 'text-emerald-950', subText: 'text-emerald-900', label: 'Completed' },
  cancelled:    { bg: 'bg-rose-200',    border: 'border-rose-400',    text: 'text-rose-950',    subText: 'text-rose-900',    label: 'Cancelled' },
  declined:     { bg: 'bg-red-200',     border: 'border-red-400',     text: 'text-red-950',     subText: 'text-red-900',     label: 'Declined' },
};

const defaultColors = { bg: 'bg-slate-200', border: 'border-slate-400', text: 'text-slate-950', subText: 'text-slate-900', label: 'Other' };

function getBookingColors(status: string) {
  return statusColors[status] || defaultColors;
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
        : startOfMonth(currentDate);
      const end = view === 'week'
        ? endOfWeek(currentDate)
        : endOfMonth(currentDate);

      // Format dates as YYYY-MM-DD for API
      const startDateStr = format(start, 'yyyy-MM-dd');
      const endDateStr = format(end, 'yyyy-MM-dd');

      const params = new URLSearchParams({
        start: startDateStr,
        end: endDateStr,
        // For month view, we need all bookings, so set a high limit
        limit: view === 'month' ? '1000' : '100',
      });

      const url = `/api/admin/bookings?${params.toString()}`;
      const response = await fetch(url, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

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
        description="View and manage all bookings calendar (recurring and one-time)"
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
              onClick={() => setCurrentDate(view === 'week' ? subWeeks(currentDate, 1) : subMonths(currentDate, 1))}
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
              onClick={() => setCurrentDate(view === 'week' ? addWeeks(currentDate, 1) : addMonths(currentDate, 1))}
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

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 mb-4 text-xs text-gray-700">
          {Object.entries(statusColors).map(([key, val]) => (
            <div key={key} className="flex items-center gap-1">
              <span className={`h-3 w-3 rounded ${val.bg} ${val.border}`} />
              <span>{val.label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1">
            <span className={`h-3 w-3 rounded ${defaultColors.bg} ${defaultColors.border}`} />
            <span>{defaultColors.label}</span>
          </div>
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
                    {dayBookings.map((booking) => {
                      const isRecurring = !!booking.recurring_schedule_id;
                      const colors = getBookingColors(booking.status);
                      return (
                        <div
                          key={booking.id}
                          className={`text-xs p-1 rounded border cursor-pointer hover:opacity-80 ${colors.bg} ${colors.border}`}
                          title={`${booking.customer_name} - ${booking.service_type} at ${formatTime(booking.booking_time)}${isRecurring ? ' (Recurring)' : ''}`}
                        >
                          <div className={`font-medium flex items-center gap-1 ${colors.text}`}>
                            {formatTime(booking.booking_time)}
                            {isRecurring && <Repeat className="h-2.5 w-2.5" />}
                          </div>
                          <div className={colors.subText}>{booking.customer_name}</div>
                          <div className={`text-xs truncate ${colors.subText}`}>
                            {booking.service_type}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {view === 'month' && (() => {
          const monthStart = startOfMonth(currentDate);
          const monthEnd = endOfMonth(currentDate);
          const firstDayOfWeek = getDay(monthStart); // 0 = Sunday, 1 = Monday, etc.
          const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          
          // Create array of all days in month
          const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
          
          // Create calendar grid with empty cells for days before month starts
          const calendarDays: (Date | null)[] = [];
          
          // Add empty cells for days before month starts
          for (let i = 0; i < firstDayOfWeek; i++) {
            calendarDays.push(null);
          }
          
          // Add all days in the month
          daysInMonth.forEach(day => calendarDays.push(day));
          
          // Fill remaining cells to complete the grid (6 rows x 7 columns = 42 cells)
          while (calendarDays.length < 42) {
            calendarDays.push(null);
          }

          return (
            <div>
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
                    return <div key={`empty-${index}`} className="aspect-square min-h-[100px] bg-gray-50 rounded border border-gray-100" />;
                  }

                  const dayBookings = getBookingsForDay(day);
                  const isToday = isSameDay(day, new Date());
                  const isCurrentMonth = isSameMonth(day, currentDate);

                  return (
                    <div
                      key={day.toISOString()}
                      className={`aspect-square min-h-[100px] border rounded-lg p-1.5 overflow-hidden ${
                        isToday
                          ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200'
                          : isCurrentMonth
                          ? 'bg-white border-gray-200'
                          : 'bg-gray-50 border-gray-100'
                      }`}
                    >
                      <div className={`text-xs font-semibold mb-1 ${
                        isToday
                          ? 'text-blue-700'
                          : isCurrentMonth
                          ? 'text-gray-900'
                          : 'text-gray-400'
                      }`}>
                        {format(day, 'd')}
                      </div>
                      <div className="space-y-0.5 overflow-y-auto max-h-[calc(100%-20px)]">
                        {dayBookings.slice(0, 3).map((booking) => {
                          const isRecurring = !!booking.recurring_schedule_id;
                          const colors = getBookingColors(booking.status);
                          return (
                            <div
                              key={booking.id}
                              className={`text-[10px] p-0.5 rounded border cursor-pointer hover:opacity-80 ${colors.bg} ${colors.border}`}
                              title={`${booking.customer_name} - ${booking.service_type} at ${formatTime(booking.booking_time)}${isRecurring ? ' (Recurring)' : ''}`}
                            >
                              <div className={`font-medium flex items-center gap-0.5 truncate ${colors.text}`}>
                                <span className="truncate">{formatTime(booking.booking_time)}</span>
                                {isRecurring && <Repeat className="h-2 w-2 flex-shrink-0" />}
                              </div>
                              <div className={`truncate text-[9px] ${colors.subText}`}>
                                {booking.customer_name}
                              </div>
                            </div>
                          );
                        })}
                        {dayBookings.length > 3 && (
                          <div className="text-[9px] text-gray-500 font-medium pt-0.5">
                            +{dayBookings.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

