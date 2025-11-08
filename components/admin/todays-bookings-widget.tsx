'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, ChevronDown, ChevronUp } from 'lucide-react';

interface TodayBooking {
  id: string;
  customer_name: string;
  booking_date?: string;
  booking_time: string;
  service_type: string;
  status: string;
  cleaner_name?: string | null;
}

interface TodaysBookingsWidgetProps {
  bookings: TodayBooking[];
}

export function TodaysBookingsWidget({ bookings }: TodaysBookingsWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatTime = (time: string) => {
    // If time is already in HH:MM:SS format, just return it
    if (time.includes(':')) {
      return time.split(':').slice(0, 2).join(':');
    }
    return time;
  };

  const getStatusColor = (status: string) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === 'completed') return 'bg-green-100 text-green-800';
    if (lowerStatus === 'pending') return 'bg-orange-100 text-orange-800';
    if (lowerStatus === 'accepted') return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className="relative w-full text-sm sm:text-base">
      <CardHeader 
        className="px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors sm:px-4 sm:py-3"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="flex items-center justify-between text-sm font-semibold sm:text-base">
          <div className="flex flex-col items-center gap-1 sm:flex-row sm:text-left sm:gap-2">
            <Calendar className="h-4 w-4 flex-shrink-0 sm:h-5 sm:w-5" />
            <div className="flex flex-col items-center sm:flex-row sm:items-center">
              <span className="leading-tight">Today's Bookings</span>
              <span className="text-xs font-normal text-gray-500 sm:ml-1 sm:text-sm">({bookings.length})</span>
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-3.5 w-3.5 text-gray-500 sm:h-4 sm:w-4" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-gray-500 sm:h-4 sm:w-4" />
          )}
        </CardTitle>
      </CardHeader>
      {isExpanded && (
        <CardContent className="absolute left-0 right-0 top-full z-50 max-h-[320px] overflow-y-auto rounded-b-lg border-t border-gray-200 bg-white pt-0 shadow-lg">
        <div className="space-y-2.5">
          {bookings.length === 0 ? (
            <div className="py-6 text-center text-xs text-gray-500 sm:py-8 sm:text-sm">
              <Calendar className="mx-auto mb-2 h-7 w-7 text-gray-400 sm:h-8 sm:w-8" />
              <p>No bookings scheduled for today</p>
            </div>
          ) : (
            bookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-start justify-between rounded-lg bg-gray-50 p-2 text-xs transition-colors hover:bg-gray-100 sm:p-3 sm:text-sm"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-1.5">
                    <span className="truncate font-medium text-gray-900">
                      {booking.customer_name}
                    </span>
                    <Badge className={`text-[10px] sm:text-xs ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </Badge>
                  </div>
                  <div className="mb-1 text-[11px] text-gray-600 sm:text-xs">{booking.service_type}</div>
                  <div className="flex items-center gap-1 text-[11px] text-gray-500 sm:text-xs">
                    <Clock className="h-3 w-3" />
                    <span>{formatTime(booking.booking_time)}</span>
                  </div>
                  {booking.cleaner_name && (
                    <div className="mt-1 flex items-center gap-1 text-[11px] text-gray-600 sm:text-xs">
                      <User className="h-3 w-3" />
                      <span>{booking.cleaner_name}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
      )}
    </Card>
  );
}

