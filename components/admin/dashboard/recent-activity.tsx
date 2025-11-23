'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface RecentActivityProps {
  bookings: Array<{
    id: string;
    customer_name: string;
    service_type: string;
    status: string;
    total_amount: number;
    created_at: string;
  }> | null;
  isLoading?: boolean;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  accepted: 'bg-indigo-100 text-indigo-800',
  'in-progress': 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export function RecentActivity({ bookings, isLoading }: RecentActivityProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!bookings || bookings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No recent bookings</p>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (cents: number) => {
    return `R${(cents / 100).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {bookings.slice(0, 10).map((booking) => (
            <Link
              key={booking.id}
              href={`/admin/bookings?booking=${booking.id}`}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">
                    {booking.customer_name || 'Unknown Customer'}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-xs ${statusColors[booking.status] || 'bg-gray-100 text-gray-800'}`}
                  >
                    {booking.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">{booking.service_type}</span>
                  <span className="text-xs font-semibold">{formatCurrency(booking.total_amount)}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(booking.created_at), { addSuffix: true })}
                </span>
              </div>
            </Link>
          ))}
        </div>
        {bookings.length > 10 && (
          <div className="mt-4 pt-4 border-t">
            <Link
              href="/admin/bookings"
              className="text-sm text-primary hover:underline"
            >
              View all bookings →
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


