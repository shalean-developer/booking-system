/**
 * Prominent SnapshotCard with large KPI, sparkline, and modal integration
 */

import React, { memo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { SnapshotCardSkeleton } from './Skeleton';
import type { Metrics, Booking, SparklineData } from './types';
import { formatCurrency } from '@/lib/utils/formatting';

// Lazy load the sparkline chart
const SparklineChart = dynamic(
  () => import('recharts').then((mod) => {
    const { LineChart, Line, ResponsiveContainer, Area, AreaChart } = mod;
    return function Sparkline({ data }: { data: SparklineData }) {
      return (
        <ResponsiveContainer width="100%" height={48}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#gradient)"
              isAnimationActive={true}
              animationDuration={750}
            />
          </AreaChart>
        </ResponsiveContainer>
      );
    };
  }),
  { ssr: false, loading: () => <div className="h-12" /> }
);

export interface SnapshotCardProps {
  metrics: Metrics;
  sparklineData?: SparklineData;
  recentBookings?: Booking[];
  isLoading?: boolean;
  onViewBookings?: () => void;
  onAssignCleaners?: () => void;
  delta7d?: number; // 7-day trend percentage
  delta30d?: number; // 30-day trend percentage
}

export const SnapshotCard = memo(function SnapshotCard({
  metrics,
  sparklineData,
  recentBookings = [],
  isLoading = false,
  onViewBookings,
  onAssignCleaners,
  delta7d,
  delta30d,
}: SnapshotCardProps) {
  if (isLoading) {
    return <SnapshotCardSkeleton />;
  }

  const hasSparkline = sparklineData && sparklineData.length > 0;
  const primaryTrend = delta7d !== undefined ? delta7d : delta30d;
  const isPositive = primaryTrend !== undefined && primaryTrend >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  const handleViewBookings = () => {
    if (onViewBookings) {
      onViewBookings();
    } else {
      window.dispatchEvent(new CustomEvent('admin-tab-change', { detail: 'bookings' }));
    }
  };

  const handleAssignCleaners = () => {
    if (onAssignCleaners) {
      onAssignCleaners();
    } else {
      // Open unassigned bookings or cleaner assignment view
      window.dispatchEvent(new CustomEvent('admin-tab-change', { detail: 'bookings' }));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="p-6 border-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex-1">
            <div className="text-sm text-muted-foreground font-medium mb-2">Today's Snapshot</div>
            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-4xl sm:text-5xl font-bold tracking-tight">
                {formatCurrency(metrics.todayRevenue)}
              </span>
              {primaryTrend !== undefined && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}
                >
                  <TrendIcon className="h-4 w-4" />
                  <span>{Math.abs(primaryTrend).toFixed(0)}%</span>
                  <span className="text-xs text-muted-foreground ml-1">vs {delta7d !== undefined ? '7d' : '30d'}</span>
                </motion.div>
              )}
            </div>
            
            {hasSparkline && (
              <div className="h-12 mt-4 -mx-2">
                <SparklineChart data={sparklineData} />
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-foreground">{metrics.bookingsToday}</span>
                <span>Bookings Today</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-foreground">{metrics.cleanersAvailable}</span>
                <span>Cleaners Available</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  onClick={handleViewBookings}
                  className="w-full sm:w-auto"
                  aria-label="View bookings and see details"
                >
                  View Bookings
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Recent Bookings (Last 7 Days)</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  {recentBookings.length > 0 ? (
                    recentBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div>
                          <div className="font-medium">{booking.customerName}</div>
                          <div className="text-sm text-muted-foreground">
                            {booking.serviceType} • {booking.date} {booking.time}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{formatCurrency(booking.price)}</div>
                          <div className={`text-xs ${booking.status === 'completed' ? 'text-emerald-600' : booking.status === 'confirmed' ? 'text-sky-600' : 'text-muted-foreground'}`}>
                            {booking.status}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No recent bookings to display
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
            
            <Button
              variant="outline"
              onClick={handleAssignCleaners}
              className="w-full sm:w-auto"
              aria-label="Assign cleaners to unassigned bookings"
            >
              Assign Cleaners
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
});

SnapshotCard.displayName = 'SnapshotCard';

