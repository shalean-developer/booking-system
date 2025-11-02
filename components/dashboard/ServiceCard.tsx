/**
 * ServiceCard with progress bars and TOP badge
 */

import React, { memo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils/formatting';
import { ServiceCardSkeleton } from './Skeleton';
import type { ServicePerformance } from './types';

export interface ServiceCardProps {
  service: ServicePerformance;
  isLoading?: boolean;
  onClick?: () => void;
}

export const ServiceCard = memo(function ServiceCard({
  service,
  isLoading = false,
  onClick,
}: ServiceCardProps) {
  if (isLoading) {
    return <ServiceCardSkeleton />;
  }

  const clickableClass = onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : '';
  const progressWidth = service.percentage || 0;

  return (
    <Card className={`p-4 relative ${service.top ? 'border-2 border-amber-200' : ''} ${clickableClass}`} onClick={onClick}>
      {service.top && (
        <Badge className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 font-bold">
          TOP
        </Badge>
      )}
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{service.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-2xl font-bold">{formatCurrency(service.revenue)}</div>
        <div className="text-xs text-muted-foreground">
          {service.bookings} bookings • Avg {formatCurrency(service.avg)}
        </div>
        {service.percentage !== undefined && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Revenue share</span>
              <span>{service.percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${service.top ? 'bg-yellow-500' : 'bg-primary'}`}
                style={{ width: `${progressWidth}%` }}
                role="progressbar"
                aria-valuenow={progressWidth}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

ServiceCard.displayName = 'ServiceCard';

