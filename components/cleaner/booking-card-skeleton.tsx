import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export function BookingCardSkeleton() {
  return (
    <Card className="border border-gray-200 shadow-sm p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>

      {/* Date and Time */}
      <div className="flex gap-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>

      {/* Location */}
      <Skeleton className="h-4 w-40" />

      {/* Amount */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>
    </Card>
  );
}

