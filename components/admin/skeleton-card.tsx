'use client';

import { Card, CardContent } from '@/components/ui/card';

export function SkeletonCard() {
  return (
    <Card className="bg-white rounded-2xl p-4 shadow-sm">
      <CardContent className="p-0">
        <div className="animate-pulse">
          <div className="flex items-start justify-between mb-3">
            <div className="h-4 w-24 bg-slate-200 rounded"></div>
          </div>
          <div className="h-8 w-32 bg-slate-200 rounded mb-4"></div>
          <div className="h-10 bg-slate-100 rounded mb-2"></div>
          <div className="h-4 w-20 bg-slate-200 rounded"></div>
        </div>
      </CardContent>
    </Card>
  );
}

