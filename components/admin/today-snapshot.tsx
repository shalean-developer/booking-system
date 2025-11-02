'use client';

import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatting';
import { motion } from 'framer-motion';

interface TodaySnapshotProps {
  stats?: {
    revenue?: {
      today?: number;
    };
    bookings?: {
      today?: number;
      unassigned?: number;
    };
    cleaners?: {
      availableToday?: number;
      total?: number;
      active?: number;
    };
  };
}

export function TodaySnapshot({ stats }: TodaySnapshotProps) {
  const todayRevenue = stats?.revenue?.today || 0;
  const todayBookings = stats?.bookings?.today || 0;
  const unassigned = stats?.bookings?.unassigned || 0;
  const availableCleaners = stats?.cleaners?.availableToday || 0;
  const totalActive = stats?.cleaners?.active || 0;

  // Calculate capacity health
  const hasUrgentUnassigned = unassigned > 0;
  const hasLowAvailability = availableCleaners < 3 && totalActive > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Today's Snapshot</h3>
              <p className="text-sm text-gray-600">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Today's Revenue */}
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {formatCurrency(todayRevenue)}
            </div>
            <div className="text-sm text-gray-600">Revenue Today</div>
          </div>

          {/* Today's Bookings */}
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {todayBookings}
            </div>
            <div className="text-sm text-gray-600">Bookings Today</div>
          </div>

          {/* Available Cleaners */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              {hasLowAvailability ? (
                <AlertCircle className="h-5 w-5 text-red-500" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
              <div className={`text-3xl font-bold ${hasLowAvailability ? 'text-red-600' : 'text-gray-900'}`}>
                {availableCleaners}
              </div>
            </div>
            <div className="text-sm text-gray-600">Cleaners Available</div>
          </div>

          {/* Unassigned Bookings */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              {hasUrgentUnassigned && <AlertCircle className="h-5 w-5 text-red-500" />}
              <div className={`text-3xl font-bold ${hasUrgentUnassigned ? 'text-red-600' : 'text-gray-900'}`}>
                {unassigned}
              </div>
            </div>
            <div className="text-sm text-gray-600">Unassigned</div>
          </div>
        </div>

        {/* Status Indicators */}
        {(hasUrgentUnassigned || hasLowAvailability) && (
          <div className="mt-4 pt-4 border-t border-blue-200">
            <div className="flex items-center gap-4 text-sm">
              {hasUrgentUnassigned && (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">Action required: {unassigned} booking{unassigned !== 1 ? 's' : ''} need cleaner assignment</span>
                </div>
              )}
              {hasLowAvailability && (
                <div className="flex items-center gap-2 text-orange-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">Low cleaner availability today</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Success State */}
        {!hasUrgentUnassigned && !hasLowAvailability && todayBookings > 0 && (
          <div className="mt-4 pt-4 border-t border-green-200">
            <div className="flex items-center gap-2 text-green-700 text-sm">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">All systems operational - {todayBookings} booking{todayBookings !== 1 ? 's' : ''} scheduled for today</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
    </motion.div>
  );
}

