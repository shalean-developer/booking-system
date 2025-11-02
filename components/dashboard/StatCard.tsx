/**
 * Enhanced StatCard component with sparklines and interactive features
 */

import React, { memo } from 'react';
import { Card } from '@/components/ui/card';
import { ArrowUp, ArrowDown, TrendingUp, LucideIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
import { StatCardSkeleton } from './Skeleton';
import type { SparklineData } from './types';

// Lazy load the sparkline chart
const SparklineChart = dynamic(
  () => import('recharts').then((mod) => {
    const { LineChart, Line, ResponsiveContainer } = mod;
    return function Sparkline({ data }: { data: SparklineData }) {
      return (
        <ResponsiveContainer width="100%" height={32}>
          <LineChart data={data}>
            <Line
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    };
  }),
  { ssr: false, loading: () => <div className="h-8" /> }
);

export interface StatCardProps {
  // Admin dashboard API
  title?: string;
  value: string | number;
  delta?: number | null; // percentage change
  hint?: string;
  sparklineData?: SparklineData;
  onClick?: () => void;
  isLoading?: boolean;
  trend?: 'up' | 'down' | 'neutral';
  // Customer dashboard API (backward compatibility)
  icon?: LucideIcon;
  label?: string;
}

export const StatCard = memo(function StatCard({
  title,
  value,
  delta,
  hint,
  sparklineData,
  onClick,
  isLoading = false,
  trend,
  icon,
  label,
}: StatCardProps) {
  if (isLoading) {
    return <StatCardSkeleton />;
  }

  // Support both APIs: customer dashboard (icon/label) or admin dashboard (title)
  const displayTitle = label || title || '';
  const hasSparkline = sparklineData && sparklineData.length > 0;
  const clickableClass = onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : '';
  const trendIcon = trend === 'up' ? <ArrowUp className="h-4 w-4" /> : trend === 'down' ? <ArrowDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />;
  const trendColor = trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-rose-600' : 'text-gray-400';
  
  // Customer dashboard style (icon + label)
  if (icon && label) {
    const Icon = icon;
    return (
      <Card className={`p-4 ${clickableClass}`} onClick={onClick} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="text-xl font-semibold truncate">{value}</div>
          </div>
        </div>
      </Card>
    );
  }

  // Admin dashboard style (title)
  return (
    <Card className={`p-4 ${clickableClass}`} onClick={onClick} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined}>
      <div className="space-y-2">
        <div className="text-xs text-gray-600 font-medium">{displayTitle}</div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-xl font-semibold truncate">{value}</div>
            {hint && typeof delta === 'number' && (
              <div className="text-xs text-muted-foreground">{hint}</div>
            )}
          </div>
          {delta !== null && delta !== undefined && (
            <div className={`flex items-center gap-1 text-sm flex-shrink-0 ${delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {delta >= 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
              <span>{Math.abs(delta).toFixed(0)}%</span>
            </div>
          )}
          {!delta && delta === null && trend && (
            <div className={`flex items-center gap-1 flex-shrink-0 ${trendColor}`}>
              {trendIcon}
            </div>
          )}
        </div>
        {hasSparkline && (
          <div className="h-8 -mx-4 -mb-4 opacity-50">
            <SparklineChart data={sparklineData} />
          </div>
        )}
      </div>
    </Card>
  );
});

StatCard.displayName = 'StatCard';

