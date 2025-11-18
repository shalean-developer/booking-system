'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  AlertCircle, 
  CheckCircle, 
  X, 
  Pause, 
  Play, 
  Calendar, 
  Clock,
  Repeat,
  DollarSign
} from 'lucide-react';
import { format } from 'date-fns';

interface RecurringSchedule {
  id: string;
  frequency: string;
  day_of_week: number | null;
  day_of_month: number | null;
  preferred_time: string | null;
  is_active: boolean;
  start_date: string;
  end_date: string | null;
}

interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  service_type: string;
  total_amount: number;
  cleaner_earnings: number;
}

interface RecurringBookingGroup {
  schedule: RecurringSchedule;
  bookings: Booking[];
}

export function RecurringBookingsView() {
  const [recurringBookings, setRecurringBookings] = useState<RecurringBookingGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingScheduleId, setActingScheduleId] = useState<string | null>(null);

  // Define fetchRecurringBookings with useCallback to ensure stable reference and consistent hook order
  const fetchRecurringBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/cleaner/bookings/recurring');
      const data = await response.json();
      if (data.ok) {
        setRecurringBookings(data.recurringBookings || []);
      } else {
        setError(data.error || 'Failed to load recurring bookings');
      }
    } catch (err) {
      console.error('Error fetching recurring bookings:', err);
      setError('An error occurred while loading recurring bookings');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecurringBookings();
  }, [fetchRecurringBookings]);

  const handleAction = async (scheduleId: string, action: string) => {
    setActingScheduleId(scheduleId);
    try {
      const response = await fetch(`/api/cleaner/bookings/recurring/${scheduleId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();
      if (data.ok) {
        await fetchRecurringBookings(); // Refresh
      } else {
        alert(data.error || 'Failed to perform action');
      }
    } catch (err) {
      console.error('Error performing action:', err);
      alert('An error occurred');
    } finally {
      setActingScheduleId(null);
    }
  };

  const getFrequencyLabel = (frequency: string, dayOfWeek: number | null, dayOfMonth: number | null) => {
    switch (frequency) {
      case 'weekly':
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return dayOfWeek !== null ? `Every ${days[dayOfWeek]}` : 'Weekly';
      case 'bi-weekly':
        const biDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return dayOfWeek !== null ? `Every other ${biDays[dayOfWeek]}` : 'Bi-weekly';
      case 'monthly':
        return dayOfMonth ? `Monthly on day ${dayOfMonth}` : 'Monthly';
      default:
        return frequency;
    }
  };

  const formatCurrency = (cents: number) => {
    if (!cents || cents === 0) return 'R0.00';
    return `R${(cents / 100).toFixed(2)}`;
  };

  const formatTime = (timeStr: string | null) => {
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
      return timeStr;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'accepted':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'declined':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-[#3b82f6]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="flex flex-col items-center gap-3 mb-4">
          <AlertCircle className="h-10 w-10 text-red-500" />
          <div className="space-y-1">
            <p className="text-red-600 font-medium">Failed to load recurring bookings</p>
            <p className="text-sm text-gray-500">{error}</p>
          </div>
        </div>
        <Button onClick={fetchRecurringBookings} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (recurringBookings.length === 0) {
    return (
      <div className="text-center py-12">
        <Repeat className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <p className="text-gray-600 font-medium mb-1">No recurring bookings</p>
        <p className="text-sm text-gray-500">
          Recurring bookings will appear here once assigned to you
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {recurringBookings.map((group) => {
        const { schedule, bookings } = group;
        const pendingBookings = bookings.filter((b) => b.status === 'pending');
        const upcomingBookings = bookings.filter(
          (b) => b.status !== 'completed' && b.status !== 'declined' && new Date(b.booking_date) >= new Date()
        );

        return (
          <Card key={schedule.id} className="border border-gray-200 shadow-sm">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Repeat className="h-4 w-4 text-[#3b82f6]" />
                    {getFrequencyLabel(schedule.frequency, schedule.day_of_week, schedule.day_of_month)}
                  </CardTitle>
                  <div className="text-sm text-gray-500 mt-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      {formatTime(schedule.preferred_time)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      Started: {format(new Date(schedule.start_date), 'MMM d, yyyy')}
                      {schedule.end_date && ` - ${format(new Date(schedule.end_date), 'MMM d, yyyy')}`}
                    </div>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={schedule.is_active ? 'bg-green-50 text-green-800 border-green-200' : 'bg-gray-50 text-gray-800 border-gray-200'}
                >
                  {schedule.is_active ? 'Active' : 'Paused'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="font-semibold text-gray-900">{bookings.length}</div>
                  <div className="text-xs text-gray-500">Total</div>
                </div>
                <div className="text-center p-2 bg-yellow-50 rounded">
                  <div className="font-semibold text-yellow-900">{pendingBookings.length}</div>
                  <div className="text-xs text-yellow-600">Pending</div>
                </div>
                <div className="text-center p-2 bg-blue-50 rounded">
                  <div className="font-semibold text-blue-900">{upcomingBookings.length}</div>
                  <div className="text-xs text-blue-600">Upcoming</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                {pendingBookings.length > 0 && (
                  <>
                    <Button
                      onClick={() => handleAction(schedule.id, 'accept-all')}
                      disabled={actingScheduleId === schedule.id}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white flex-1 min-w-[120px]"
                    >
                      {actingScheduleId === schedule.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Accept All ({pendingBookings.length})
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => handleAction(schedule.id, 'decline-all')}
                      disabled={actingScheduleId === schedule.id}
                      size="sm"
                      variant="outline"
                      className="border-red-300 text-red-700 hover:bg-red-50 flex-1 min-w-[120px]"
                    >
                      {actingScheduleId === schedule.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <X className="h-4 w-4 mr-2" />
                          Decline All
                        </>
                      )}
                    </Button>
                  </>
                )}
                {schedule.is_active ? (
                  <Button
                    onClick={() => handleAction(schedule.id, 'pause')}
                    disabled={actingScheduleId === schedule.id}
                    size="sm"
                    variant="outline"
                    className="flex-1 min-w-[100px]"
                  >
                    {actingScheduleId === schedule.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleAction(schedule.id, 'resume')}
                    disabled={actingScheduleId === schedule.id}
                    size="sm"
                    className="bg-[#3b82f6] hover:bg-[#2563eb] text-white flex-1 min-w-[100px]"
                  >
                    {actingScheduleId === schedule.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Resume
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Upcoming Bookings List */}
              {upcomingBookings.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-gray-700 mb-2">Upcoming Bookings</div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {upcomingBookings.slice(0, 5).map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {format(new Date(booking.booking_date), 'MMM d, yyyy')} at {formatTime(booking.booking_time)}
                          </div>
                          <div className="text-xs text-gray-500">{booking.service_type}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(booking.status)} variant="outline">
                            {booking.status}
                          </Badge>
                          <div className="text-xs font-semibold text-gray-900">
                            {formatCurrency(booking.cleaner_earnings)}
                          </div>
                        </div>
                      </div>
                    ))}
                    {upcomingBookings.length > 5 && (
                      <div className="text-xs text-gray-500 text-center py-1">
                        +{upcomingBookings.length - 5} more bookings
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

