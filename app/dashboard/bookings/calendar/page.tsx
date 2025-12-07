'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { safeGetSession } from '@/lib/logout-utils';
import { NewHeader } from '@/components/dashboard/new-header';
import { MobileBottomNav } from '@/components/dashboard/mobile-bottom-nav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar as CalendarIcon, ArrowLeft, List, Clock, MapPin } from 'lucide-react';
import Link from 'next/link';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isPast } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { devLog } from '@/lib/dev-logger';
import type { Booking, Customer, AuthUser } from '@/types/dashboard';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  accepted: 'bg-green-100 text-green-800 border-green-200',
  completed: 'bg-gray-100 text-gray-800 border-gray-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  canceled: 'bg-red-100 text-red-800 border-red-200',
};

export default function BookingsCalendarPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const session = await safeGetSession(supabase);
        if (!session || !session.user) {
          router.push('/login?redirect=/dashboard/bookings/calendar');
          return;
        }

        setUser(session.user);

        const { data: { session: apiSession } } = await supabase.auth.getSession();
        if (!apiSession) {
          setError('Session expired');
          setIsLoading(false);
          return;
        }

        const response = await fetch('/api/dashboard/bookings?limit=100', {
          headers: {
            'Authorization': `Bearer ${apiSession.access_token}`,
          },
        });

        const data = await response.json();

        if (response.ok && data.ok) {
          setBookings(data.bookings || []);
          setCustomer(data.customer);
        } else {
          setError(data.error || 'Failed to load bookings');
        }
      } catch (err) {
        devLog.error('Error fetching bookings:', err);
        setError('Failed to load bookings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, [router]);

  // Group bookings by date
  const bookingsByDate = useMemo(() => {
    const grouped: Record<string, Booking[]> = {};
    bookings.forEach(booking => {
      const dateKey = booking.booking_date;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(booking);
    });
    return grouped;
  }, [bookings]);

  // Get bookings for selected date
  const selectedDateBookings = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    return bookingsByDate[dateKey] || [];
  }, [selectedDate, bookingsByDate]);

  // Get dates with bookings in current month
  const datesWithBookings = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    return daysInMonth.filter(day => {
      const dateKey = format(day, 'yyyy-MM-dd');
      return bookingsByDate[dateKey] && bookingsByDate[dateKey].length > 0;
    });
  }, [currentMonth, bookingsByDate]);

  // Custom day renderer to show booking indicators
  const renderDay = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const dayBookings = bookingsByDate[dateKey] || [];
    const hasBookings = dayBookings.length > 0;
    const isSelected = selectedDate && isSameDay(date, selectedDate);
    const isCurrentDay = isToday(date);
    const isPastDate = isPast(date) && !isCurrentDay;

    return (
      <div
        className={cn(
          'relative h-9 w-9 flex items-center justify-center rounded-md',
          isSelected && 'bg-teal-600 text-white',
          isCurrentDay && !isSelected && 'bg-teal-100 text-teal-900',
          isPastDate && 'text-gray-400'
        )}
      >
        <span className="text-sm font-medium">{format(date, 'd')}</span>
        {hasBookings && (
          <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 flex gap-0.5">
            {dayBookings.slice(0, 3).map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  'h-1 w-1 rounded-full',
                  isSelected ? 'bg-white' : 'bg-teal-500'
                )}
              />
            ))}
            {dayBookings.length > 3 && (
              <span className={cn(
                'text-[8px] leading-none',
                isSelected ? 'text-white' : 'text-teal-600'
              )}>
                +{dayBookings.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50/30 via-white to-white">
        <NewHeader user={user} customer={customer} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        </div>
        <MobileBottomNav activeTab="bookings" onTabChange={() => {}} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50/30 via-white to-white">
        <NewHeader user={user} customer={customer} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md mx-4">
            <CardContent className="p-8 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
            </CardContent>
          </Card>
        </div>
        <MobileBottomNav activeTab="bookings" onTabChange={() => {}} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/30 via-white to-white pb-32 lg:pb-0">
      <NewHeader user={user} customer={customer} />
      
      <main className="py-6 sm:py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/bookings')} className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to List
                </Button>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Booking Calendar</h1>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/bookings" className="gap-2">
                  <List className="h-4 w-4" />
                  List View
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Calendar View</CardTitle>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    month={currentMonth}
                    onMonthChange={setCurrentMonth}
                    className="rounded-md border"
                    modifiers={{
                      hasBookings: datesWithBookings,
                    }}
                    modifiersClassNames={{
                      hasBookings: 'font-semibold',
                    }}
                  />
                  <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-teal-500" />
                      <span>Has bookings</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-teal-100" />
                      <span>Today</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Selected Date Bookings */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {selectedDate ? format(selectedDate, 'EEEE, MMMM d') : 'Select a date'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedDateBookings.length === 0 ? (
                    <div className="text-center py-8">
                      <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-sm">
                        {selectedDate ? 'No bookings on this date' : 'Select a date to view bookings'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedDateBookings.map((booking, index) => (
                        <motion.div
                          key={booking.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Link href={`/dashboard/bookings/${booking.id}`}>
                            <Card className="hover:shadow-md transition-shadow cursor-pointer">
                              <CardContent className="p-4">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <Badge className={statusColors[booking.status] || statusColors.pending}>
                                      {booking.status}
                                    </Badge>
                                    <span className="text-sm font-medium text-gray-900">
                                      R{((booking.total_amount || 0) / 100).toFixed(2)}
                                    </span>
                                  </div>
                                  <h3 className="font-semibold text-gray-900">{booking.service_type}</h3>
                                  <div className="space-y-1 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                      <Clock className="h-3 w-3" />
                                      <span>{booking.booking_time}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <MapPin className="h-3 w-3" />
                                      <span className="truncate">
                                        {booking.address_suburb}, {booking.address_city}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <MobileBottomNav activeTab="bookings" onTabChange={() => {}} />
    </div>
  );
}
