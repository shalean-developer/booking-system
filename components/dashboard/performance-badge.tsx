'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { performanceMonitor } from '@/lib/utils/performance-monitor';
import { cn } from '@/lib/utils';

interface PerformanceBadgeProps {
  className?: string;
  showDetails?: boolean;
}

export function PerformanceBadge({ className, showDetails = false }: PerformanceBadgeProps) {
  const [summary, setSummary] = useState<ReturnType<typeof performanceMonitor.getSummary> | null>(null);

  useEffect(() => {
    // Update summary every 5 seconds
    const interval = setInterval(() => {
      setSummary(performanceMonitor.getSummary());
    }, 5000);

    // Initial load
    setSummary(performanceMonitor.getSummary());

    return () => clearInterval(interval);
  }, []);

  // Hide from customers - only show in development mode
  if (!summary || typeof window === 'undefined' || process.env.NODE_ENV === 'production') {
    return null;
  }
  
  // Additional check: only show if explicitly in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const getRatingColor = (rating: string | null) => {
    if (!rating) return 'bg-gray-100 text-gray-600';
    switch (rating) {
      case 'good':
        return 'bg-blue-100 text-blue-700';
      case 'needs-improvement':
        return 'bg-yellow-100 text-yellow-700';
      case 'poor':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getRatingIcon = (rating: string | null) => {
    if (!rating) return Minus;
    switch (rating) {
      case 'good':
        return TrendingUp;
      case 'needs-improvement':
        return Minus;
      case 'poor':
        return TrendingDown;
      default:
        return Activity;
    }
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-2 text-xs', className)}>
      {summary.lcp && (
        <Badge className={getRatingColor(summary.lcp.rating)} variant="outline">
          <Activity className="h-3 w-3 mr-1" />
          LCP: {summary.lcp.value.toFixed(0)}ms
        </Badge>
      )}
      {summary.fid && (
        <Badge className={getRatingColor(summary.fid.rating)} variant="outline">
          <Activity className="h-3 w-3 mr-1" />
          FID: {summary.fid.value.toFixed(0)}ms
        </Badge>
      )}
      {summary.cls && (
        <Badge className={getRatingColor(summary.cls.rating)} variant="outline">
          <Activity className="h-3 w-3 mr-1" />
          CLS: {summary.cls.value.toFixed(3)}
        </Badge>
      )}
      {summary.avgApiTime > 0 && (
        <Badge
          className={summary.avgApiTime > 2000 ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}
          variant="outline"
        >
          <Activity className="h-3 w-3 mr-1" />
          API: {summary.avgApiTime}ms
        </Badge>
      )}
      {showDetails && summary.totalApiCalls > 0 && (
        <Badge variant="outline" className="bg-gray-100 text-gray-600">
          {summary.totalApiCalls} calls
          {summary.slowApiCalls > 0 && ` (${summary.slowApiCalls} slow)`}
        </Badge>
      )}
    </div>
  );
}
