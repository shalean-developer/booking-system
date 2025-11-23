'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

interface BookingPipelineProps {
  pipeline: Record<string, number> | null;
  isLoading?: boolean;
}

export function BookingPipeline({ pipeline, isLoading = false }: BookingPipelineProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Booking Pipeline</CardTitle>
          <CardDescription>Status distribution of all bookings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!pipeline) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Booking Pipeline</CardTitle>
          <CardDescription>Status distribution of all bookings</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">No data available</p>
        </CardContent>
      </Card>
    );
  }

  const total = Object.values(pipeline).reduce((sum, count) => sum + count, 0);

  const statusLabels: Record<string, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    accepted: 'Accepted',
    'in-progress': 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500',
    confirmed: 'bg-blue-500',
    accepted: 'bg-indigo-500',
    'in-progress': 'bg-purple-500',
    completed: 'bg-green-500',
    cancelled: 'bg-red-500',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking Pipeline</CardTitle>
        <CardDescription>Status distribution of all bookings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(pipeline).map(([status, count]) => {
          const percentage = total > 0 ? (count / total) * 100 : 0;
          return (
            <div key={status} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{statusLabels[status] || status}</span>
                <span className="font-semibold text-gray-900">{count}</span>
              </div>
              <Progress value={percentage} className="h-2" />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
