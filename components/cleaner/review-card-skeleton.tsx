import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export function ReviewCardSkeleton() {
  return (
    <Card className="border border-gray-200 rounded-lg p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-40" />
        </div>
        <Skeleton className="h-4 w-12" />
      </div>

      {/* Ratings */}
      <div className="grid grid-cols-3 gap-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>

      {/* Review Text */}
      <Skeleton className="h-16 w-full" />

      {/* Response Button */}
      <Skeleton className="h-9 w-full rounded-md" />
    </Card>
  );
}

