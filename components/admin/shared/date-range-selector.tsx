'use client';

import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

export type DateRangePeriod = 'today' | 'week' | 'month' | 'year' | 'custom';

interface DateRangeSelectorProps {
  value: DateRangePeriod;
  onChange: (period: DateRangePeriod) => void;
  className?: string;
}

const periods: Array<{ value: DateRangePeriod; label: string }> = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Last 7 Days' },
  { value: 'month', label: 'Last 30 Days' },
  { value: 'year', label: 'Last Year' },
];

export function DateRangeSelector({ value, onChange, className }: DateRangeSelectorProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Calendar className="h-4 w-4 text-gray-500" />
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
        {periods.map((period) => (
          <Button
            key={period.value}
            variant={value === period.value ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onChange(period.value)}
            className={cn(
              'h-8 px-3 text-xs',
              value === period.value
                ? 'bg-white shadow-sm'
                : 'hover:bg-white/50'
            )}
          >
            {period.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

