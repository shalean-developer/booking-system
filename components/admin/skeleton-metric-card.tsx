'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function SkeletonMetricCard() {
  return (
    <Card className="bg-white rounded-xl shadow-card border border-gray-200 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="h-5 w-16 bg-gray-200 rounded-full animate-pulse" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

export function SkeletonChart() {
  return (
    <Card className="bg-white rounded-xl shadow-card border border-gray-200 overflow-hidden">
      <CardHeader className="pb-4 px-6 pt-6">
        <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
      </CardHeader>
      <CardContent className="px-6 pb-6 pt-0">
        <div className="h-[360px] bg-gray-100 rounded-lg animate-pulse" />
      </CardContent>
    </Card>
  );
}

export function SkeletonWidget() {
  return (
    <Card className="bg-white rounded-xl shadow-card border border-gray-200 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
