'use client';

import { motion } from 'framer-motion';
import { Loader2, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshIndicatorProps {
  isPulling: boolean;
  pullDistance: number;
  pullProgress: number;
  shouldShowIndicator: boolean;
  isRefreshing: boolean;
}

export function PullToRefreshIndicator({
  isPulling,
  pullDistance,
  pullProgress,
  shouldShowIndicator,
  isRefreshing,
}: PullToRefreshIndicatorProps) {
  if (!isPulling && !isRefreshing && pullDistance === 0) {
    return null;
  }

  const opacity = Math.min(pullProgress, 1);
  const rotation = pullProgress * 180; // Rotate arrow as user pulls

  return (
    <motion.div
      className={cn(
        'fixed top-0 left-0 right-0 z-50 flex items-center justify-center',
        'bg-teal-500 text-white py-3 px-4',
        'transition-all duration-200',
        isRefreshing ? 'h-12' : 'h-auto'
      )}
      initial={{ y: -100, opacity: 0 }}
      animate={{
        y: isPulling || isRefreshing ? 0 : -100,
        opacity: isRefreshing ? 1 : opacity,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{
        transform: `translateY(${isPulling && !isRefreshing ? Math.min(pullDistance, 80) : 0}px)`,
      }}
    >
      <div className="flex items-center gap-2">
        {isRefreshing ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm font-medium">Refreshing...</span>
          </>
        ) : (
          <>
            <motion.div
              animate={{ rotate: rotation }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              <ArrowDown
                className={cn(
                  'h-5 w-5 transition-colors',
                  shouldShowIndicator ? 'text-white' : 'text-white/70'
                )}
              />
            </motion.div>
            <span className={cn(
              'text-sm font-medium transition-colors',
              shouldShowIndicator ? 'text-white' : 'text-white/70'
            )}>
              {shouldShowIndicator ? 'Release to refresh' : 'Pull to refresh'}
            </span>
          </>
        )}
      </div>
    </motion.div>
  );
}
