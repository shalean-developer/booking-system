/**
 * Skeleton loading components for the dashboard
 */

import { Card } from '@/components/ui/card';

export function StatCardSkeleton() {
  return (
    <Card className="p-4">
      <div className="space-y-2">
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
        <div className="flex items-center justify-between">
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    </Card>
  );
}

export function SnapshotCardSkeleton() {
  return (
    <Card className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1">
          <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-3" />
          <div className="h-16 w-48 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="flex gap-4">
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    </Card>
  );
}

export function ScheduleListSkeleton() {
  return (
    <Card>
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 bg-gray-200 rounded animate-pulse" />
          <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
                <div>
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-3 w-48 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
              <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

export function ChartSkeleton() {
  return (
    <Card>
      <div className="p-6 space-y-4">
        <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
        <div className="h-64 bg-gray-100 rounded animate-pulse" />
      </div>
    </Card>
  );
}

export function ServiceCardSkeleton() {
  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-3 w-full bg-gray-200 rounded animate-pulse" />
      </div>
    </Card>
  );
}

export function MetricAlertSkeleton() {
  return (
    <div className="rounded-lg p-3 border bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div className="h-5 w-5 bg-gray-200 rounded animate-pulse mt-1" />
          <div className="flex-1">
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-3 w-48 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  );
}

