'use client';

import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, ArrowUpCircle, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface PlanCardProps {
  id: string;
  serviceType: string;
  frequency: 'weekly' | 'bi-weekly' | 'monthly';
  preferredTime: string;
  address: string;
  startDate: string;
  endDate?: string | null;
  isActive: boolean;
  onUpgrade?: () => void;
  onModify?: () => void;
}

export function PlanCard({
  id,
  serviceType,
  frequency,
  preferredTime,
  address,
  startDate,
  endDate,
  isActive,
  onUpgrade,
  onModify,
}: PlanCardProps) {
  const frequencyLabels = {
    weekly: 'Weekly',
    'bi-weekly': 'Bi-weekly',
    monthly: 'Monthly',
  };

  const frequencyColors = {
    weekly: 'bg-teal-100 text-teal-700',
    'bi-weekly': 'bg-blue-100 text-blue-700',
    monthly: 'bg-blue-100 text-blue-700',
  };

  return (
    <Card className="bg-white border border-gray-100 hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg text-gray-900">{serviceType}</h3>
                <Badge className={cn("text-xs", frequencyColors[frequency])}>
                  {frequencyLabels[frequency]}
                </Badge>
                {!isActive && (
                  <Badge variant="secondary" className="text-xs">
                    Inactive
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-teal-600" />
                  <span>{preferredTime}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-teal-600" />
                  <span>Started {format(new Date(startDate), 'MMM d, yyyy')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="flex items-start gap-1.5 text-sm text-gray-600">
            <MapPin className="h-4 w-4 text-teal-600 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2">{address}</span>
          </div>

          {/* End Date */}
          {endDate && (
            <div className="text-sm text-gray-500">
              Ends: {format(new Date(endDate), 'MMM d, yyyy')}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-0 pb-4 sm:pb-5 px-4 sm:px-5 flex gap-2">
        {onUpgrade && (
          <Button
            variant="outline"
            size="sm"
            onClick={onUpgrade}
            className="flex-1 text-xs sm:text-sm h-9 sm:h-10 touch-manipulation"
          >
            <ArrowUpCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 flex-shrink-0" />
            Upgrade
          </Button>
        )}
        {onModify && (
          <Button
            variant="outline"
            size="sm"
            onClick={onModify}
            className="flex-1 text-xs sm:text-sm h-9 sm:h-10 touch-manipulation"
          >
            <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 flex-shrink-0" />
            Modify
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
