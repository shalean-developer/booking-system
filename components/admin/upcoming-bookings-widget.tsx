'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AvatarWithInitials } from '@/components/admin/avatar-with-initials';
import { StatusBadge } from '@/components/admin/status-badge';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation';

interface UpcomingBooking {
  id: string;
  customer_name: string;
  service_type: string;
  booking_date: string;
  booking_time: string;
  cleaner_name?: string | null;
  status: string;
}

interface UpcomingBookingsWidgetProps {
  bookings: UpcomingBooking[];
}

export function UpcomingBookingsWidget({ bookings }: UpcomingBookingsWidgetProps) {
  const router = useRouter();

  if (bookings.length === 0) {
    return (
      <Card className="bg-white rounded-xl shadow-card border border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Today's Bookings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500 text-sm">
            No bookings scheduled for today.
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleBookingClick = (bookingId: string) => {
    router.push(`/admin/bookings?id=${bookingId}`);
  };

  return (
    <Card className="bg-white rounded-xl shadow-card border border-gray-200 hover:shadow-card-hover transition-shadow duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Today's Bookings
          </CardTitle>
          {bookings.length > 0 && (
            <button
              onClick={() => router.push('/admin/bookings')}
              className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1 flex-shrink-0"
            >
              View all <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              onClick={() => handleBookingClick(booking.id)}
              className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 hover:border-gray-300 hover:shadow-sm transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleBookingClick(booking.id);
                }
              }}
            >
              <div className="flex items-start gap-3">
                <AvatarWithInitials 
                  name={booking.customer_name} 
                  size="sm"
                  variant="blue"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900 truncate">{booking.customer_name}</div>
                      <div className="text-xs text-gray-600 mt-0.5 truncate">{booking.service_type}</div>
                    </div>
                    <StatusBadge status={booking.status as any} />
                  </div>
                  <div className="flex items-center gap-3 flex-wrap text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        {format(parseISO(booking.booking_date), 'MMM d')} at {booking.booking_time}
                        {!booking.booking_time.includes(':') && ':00'}
                      </span>
                    </div>
                    {booking.cleaner_name && (
                      <span className="text-blue-600 font-medium">Assigned: {booking.cleaner_name}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

