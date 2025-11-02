'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User, Users, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface Booking {
  id: string;
  customer_name: string;
  booking_time: string;
  service_type: string;
  status: string;
  cleaner_name?: string | null;
  booking_date?: string;
}

interface OperationsCommandProps {
  stats?: {
    bookings?: {
      today?: number;
      todayBookings?: Booking[];
      tomorrowBookings?: Booking[];
      unassigned?: number;
      unassignedList?: any[];
    };
    cleaners?: {
      availableToday?: number;
      availableTomorrow?: number;
      total?: number;
      active?: number;
    };
  };
}

export function OperationsCommand({ stats }: OperationsCommandProps) {
  const todayBookings = stats?.bookings?.todayBookings || [];
  const tomorrowBookings = stats?.bookings?.tomorrowBookings || [];
  const unassignedList = stats?.bookings?.unassignedList || [];
  const availableToday = stats?.cleaners?.availableToday || 0;
  const availableTomorrow = stats?.cleaners?.availableTomorrow || 0;
  const totalActive = stats?.cleaners?.active || 0;

  // Calculate today's capacity utilization
  const todayCapacity = totalActive > 0 ? (todayBookings.length / totalActive) * 100 : 0;
  const tomorrowCapacity = totalActive > 0 ? (tomorrowBookings.length / totalActive) * 100 : 0;

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'accepted':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <motion.div 
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center gap-2">
        <Calendar className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Operations Command Center</h3>
      </div>

      {/* Today & Tomorrow Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Today's Schedule */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Today's Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{todayBookings.length}</div>
                <div className="text-sm text-gray-600">Bookings Today</div>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-semibold ${todayCapacity > 80 ? 'text-red-600' : todayCapacity > 60 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {todayCapacity.toFixed(0)}%
                </div>
                <div className="text-sm text-gray-600">Capacity</div>
              </div>
            </div>
            
            {todayBookings.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {todayBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                    <div className="flex-1">
                      <div className="font-medium">{booking.customer_name}</div>
                      <div className="text-xs text-gray-600">{booking.service_type}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-gray-500">{booking.booking_time}</div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No bookings scheduled for today</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tomorrow's Schedule */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Tomorrow's Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{tomorrowBookings.length}</div>
                <div className="text-sm text-gray-600">Bookings Tomorrow</div>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-semibold ${tomorrowCapacity > 80 ? 'text-red-600' : tomorrowCapacity > 60 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {tomorrowCapacity.toFixed(0)}%
                </div>
                <div className="text-sm text-gray-600">Capacity</div>
              </div>
            </div>
            
            {tomorrowBookings.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {tomorrowBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                    <div className="flex-1">
                      <div className="font-medium">{booking.customer_name}</div>
                      <div className="text-xs text-gray-600">{booking.service_type}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-gray-500">{booking.booking_time}</div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No bookings scheduled for tomorrow</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cleaner Availability & Unassigned */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Cleaner Availability */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Cleaner Availability
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div className="text-sm font-medium">Today</div>
                </div>
                <div className={`text-2xl font-bold ${availableToday < 3 ? 'text-red-600' : availableToday < 5 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {availableToday}
                </div>
                <div className="text-xs text-gray-600">available</div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <div className="text-sm font-medium">Tomorrow</div>
                </div>
                <div className={`text-2xl font-bold ${availableTomorrow < 3 ? 'text-red-600' : availableTomorrow < 5 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {availableTomorrow}
                </div>
                <div className="text-xs text-gray-600">available</div>
              </div>
            </div>
            
            {totalActive > 0 && (
              <div className="pt-3 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Total Active Cleaners</span>
                  <span className="font-semibold">{totalActive}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Unassigned Bookings */}
        <Card className={unassignedList.length > 0 ? 'border-red-200 bg-red-50/30' : ''}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              Unassigned Bookings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold text-red-600 mb-2">
              {unassignedList.length}
            </div>
            
            {unassignedList.length > 0 ? (
              <div>
                <p className="text-sm text-gray-700 mb-3">
                  These bookings need cleaner assignment immediately
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.dispatchEvent(new CustomEvent('admin-tab-change', { detail: 'bookings' }))}
                  className="w-full"
                >
                  Assign Cleaners
                </Button>
                
                <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                  {unassignedList.slice(0, 5).map((booking: any) => (
                    <div key={booking.id} className="flex items-center justify-between p-2 bg-white rounded-lg text-sm border border-red-200">
                      <div className="flex-1">
                        <div className="font-medium">{booking.customer_name}</div>
                        <div className="text-xs text-gray-600">{booking.service_type}</div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {booking.booking_date || ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm font-medium">All bookings assigned</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

