/**
 * Enhanced ScheduleList with avatars, icons, status badges, and empty states
 */

import React, { memo } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Calendar, UserCircle, Home, Sparkles, Building2, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatting';
import { ScheduleListSkeleton } from './Skeleton';
import type { Booking } from './types';

export interface ScheduleListProps {
  bookings: Booking[];
  title: string;
  subtitle?: string;
  emptyMessage?: string;
  emptyAction?: {
    label: string;
    onClick: () => void;
  };
  isLoading?: boolean;
  showCapacity?: boolean;
  capacity?: number;
  capacityLabel?: string;
}

const serviceIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'Standard': Home,
  'Deep': Sparkles,
  'Airbnb': Building2,
  'MoveIn': AlertTriangle,
  'MoveOut': AlertTriangle,
  default: Calendar,
};

const statusColors: Record<string, string> = {
  'completed': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'confirmed': 'bg-sky-100 text-sky-800 border-sky-200',
  'assigned': 'bg-blue-100 text-blue-800 border-blue-200',
  'pending': 'bg-amber-100 text-amber-800 border-amber-200',
  'unassigned': 'bg-rose-100 text-rose-800 border-rose-200',
  default: 'bg-gray-100 text-gray-800 border-gray-200',
};

const getInitials = (booking: Booking): string => {
  if (booking.cleanerInitials && booking.cleanerInitials !== '?') {
    return booking.cleanerInitials;
  }
  if (booking.customerName) {
    const parts = booking.customerName.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  }
  return 'NA';
};

export const ScheduleList = memo(function ScheduleList({
  bookings,
  title,
  subtitle,
  emptyMessage = 'No bookings scheduled.',
  emptyAction,
  isLoading = false,
  showCapacity = false,
  capacity,
  capacityLabel = 'Capacity',
}: ScheduleListProps) {
  if (isLoading) {
    return <ScheduleListSkeleton />;
  }

  if (bookings.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center text-center py-8">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Calendar className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-sm text-muted-foreground mb-3">{emptyMessage}</p>
          {emptyAction && (
            <button
              onClick={emptyAction.onClick}
              className="text-sm text-primary hover:underline font-medium"
              aria-label={emptyAction.label}
            >
              {emptyAction.label}
            </button>
          )}
        </div>
      </Card>
    );
  }

  const capacityPercentage = showCapacity && capacity !== undefined
    ? (bookings.length / capacity) * 100
    : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
            {subtitle && (
              <div className="text-sm text-muted-foreground mt-1">{subtitle}</div>
            )}
          </div>
          {capacity !== undefined && (
            <div className="text-right">
              <div className={`text-2xl font-bold ${capacityPercentage && capacityPercentage > 80 ? 'text-red-600' : capacityPercentage && capacityPercentage > 60 ? 'text-yellow-600' : 'text-blue-600'}`}>
                {capacityPercentage?.toFixed(0) || 0}%
              </div>
              <div className="text-xs text-muted-foreground">{capacityLabel}</div>
            </div>
          )}
        </div>
      </CardHeader>
      <div className="px-6 pb-6 space-y-3 max-h-[400px] overflow-y-auto">
        {bookings.map((booking, index) => {
          const ServiceIcon = serviceIcons[booking.serviceType] || serviceIcons.default;
          const statusColor = statusColors[booking.status] || statusColors.default;

          return (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.02 }}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium text-gray-700 flex-shrink-0">
                  {getInitials(booking)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <ServiceIcon className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <span className="font-medium text-sm truncate">{booking.customerName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="truncate">{booking.serviceType}</span>
                    <span>•</span>
                    <span className="flex-shrink-0">{booking.time}</span>
                    {booking.cleanerName && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <UserCircle className="h-3 w-3" />
                          {booking.cleanerName}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                <Badge variant="outline" className={`${statusColor} text-xs`}>
                  {booking.status}
                </Badge>
                <div className="text-xs font-semibold text-right hidden sm:block">
                  {formatCurrency(booking.price, false)}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
});

ScheduleList.displayName = 'ScheduleList';

