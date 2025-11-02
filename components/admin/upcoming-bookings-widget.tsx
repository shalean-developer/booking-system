'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';

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
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      pending: { label: 'Pending', className: 'bg-amber-100 text-amber-800' },
      accepted: { label: 'Accepted', className: 'bg-blue-100 text-blue-800' },
      ongoing: { label: 'Ongoing', className: 'bg-purple-100 text-purple-800' },
      completed: { label: 'Completed', className: 'bg-green-100 text-green-800' },
    };
    const statusInfo = statusMap[status.toLowerCase()] || { label: status, className: 'bg-gray-100 text-gray-800' };
    return <Badge className={statusInfo.className}>{statusInfo.label}</Badge>;
  };

  if (bookings.length === 0) {
    return (
      <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
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

  return (
    <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Today's Bookings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="font-medium text-sm text-gray-900">{booking.customer_name}</div>
                  <div className="text-xs text-gray-600 mt-1">{booking.service_type}</div>
                </div>
                {getStatusBadge(booking.status)}
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
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
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

