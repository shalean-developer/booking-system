'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

import type { RecentBooking } from '@/types/admin-dashboard';

interface RecentActivityProps {
  bookings?: RecentBooking[] | null;
  isLoading?: boolean;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  accepted: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'in-progress': 'bg-purple-100 text-purple-800 border-purple-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  declined: 'bg-gray-100 text-gray-800 border-gray-200',
};

export function RecentActivity({ bookings = null, isLoading = false }: RecentActivityProps) {
  // Ensure bookings have required fields and limit to 4
  const validBookings: RecentBooking[] = bookings
    ? bookings
        .filter((b): b is RecentBooking => b.id && b.customer_name && b.service_type)
        .slice(0, 4)
    : [];

  const formatCurrency = (cents: number) => {
    return `R${(cents / 100).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest bookings and updates</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        ) : validBookings.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 mb-2">No recent bookings</p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/bookings">
                View all bookings
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {validBookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm text-gray-900 truncate">
                      {booking.customer_name || 'Unknown Customer'}
                    </p>
                    <Badge
                      variant="outline"
                      className={`text-xs ${statusColors[booking.status] || statusColors.declined}`}
                    >
                      {booking.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{booking.service_type}</span>
                    <span>•</span>
                    <span>{formatDate(booking.booking_date)}</span>
                    <span>•</span>
                    <span>{booking.booking_time}</span>
                    {booking.total_amount > 0 && (
                      <>
                        <span>•</span>
                        <span className="font-medium">{formatCurrency(booking.total_amount)}</span>
                      </>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/admin/bookings/${booking.id}`}>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ))}
            {bookings && bookings.length > 4 && (
              <div className="pt-2 border-t">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/admin/bookings">
                    View all bookings ({bookings.length})
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
