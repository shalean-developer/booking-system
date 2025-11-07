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
    <Card className="w-full relative">
      <CardHeader 
        className="pb-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="text-base font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <span>Today's Bookings</span>
            <span className="text-sm font-normal text-gray-500">({bookings.length})</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </CardTitle>
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-0 absolute top-full left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg rounded-b-lg max-h-[400px] overflow-y-auto">
        <div className="space-y-3">
          {bookings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No bookings scheduled for today</p>
            </div>
          ) : (
            bookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-start justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm text-gray-900 truncate">
                      {booking.customer_name}
                    </span>
                    <Badge className={`text-xs ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-600 mb-1">{booking.service_type}</div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>{formatTime(booking.booking_time)}</span>
                  </div>
                  {booking.cleaner_name && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-600">
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

