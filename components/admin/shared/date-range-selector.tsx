'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type DateRangePeriod = 'today' | 'week' | 'month' | 'year' | 'custom';

export interface CustomDateRange {
  from: string; // ISO date string
  to: string; // ISO date string
}

interface DateRangeSelectorProps {
  value: DateRangePeriod;
  onChange: (period: DateRangePeriod, customRange?: CustomDateRange) => void;
  customRange?: CustomDateRange;
  className?: string;
}

const periods: Array<{ value: DateRangePeriod; label: string }> = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Last 7 Days' },
  { value: 'month', label: 'Last 30 Days' },
  { value: 'year', label: 'Last Year' },
  { value: 'custom', label: 'Custom' },
];

export function DateRangeSelector({ value, onChange, customRange, className }: DateRangeSelectorProps) {
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [tempFrom, setTempFrom] = useState(customRange?.from || '');
  const [tempTo, setTempTo] = useState(customRange?.to || '');

  // Update temp values when customRange changes from outside
  useEffect(() => {
    if (customRange?.from && customRange?.to) {
      setTempFrom(customRange.from);
      setTempTo(customRange.to);
    }
  }, [customRange]);

  const handlePeriodClick = (period: DateRangePeriod) => {
    if (period === 'custom') {
      // Initialize temp values with existing customRange or default to today
      if (customRange?.from && customRange?.to) {
        setTempFrom(customRange.from);
        setTempTo(customRange.to);
      } else {
        const now = new Date();
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(now);
        todayEnd.setHours(23, 59, 59, 999);
        setTempFrom(todayStart.toISOString());
        setTempTo(todayEnd.toISOString());
      }
      setIsCustomOpen(true);
    } else {
      onChange(period);
      setIsCustomOpen(false);
    }
  };

  const handleApplyCustom = () => {
    if (tempFrom && tempTo) {
      const fromDate = new Date(tempFrom);
      const toDate = new Date(tempTo);
      
      // Ensure "to" is at end of day
      toDate.setHours(23, 59, 59, 999);
      
      onChange('custom', {
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
      });
      setIsCustomOpen(false);
    }
  };

  const formatCustomRangeDisplay = () => {
    if (!customRange?.from || !customRange?.to) return 'Custom';
    const from = new Date(customRange.from);
    const to = new Date(customRange.to);
    const fromStr = from.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric', year: 'numeric' });
    const toStr = to.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${fromStr} - ${toStr}`;
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <CalendarIcon className="h-4 w-4 text-gray-500" />
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
        {periods.filter(p => p.value !== 'custom').map((period) => (
          <Button
            key={period.value}
            variant={value === period.value ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handlePeriodClick(period.value)}
            className={cn(
              'h-8 px-3 text-xs',
              value === period.value
                ? 'bg-gray-900 text-white shadow-sm'
                : 'text-gray-700 hover:bg-white/50'
            )}
          >
            {period.label}
          </Button>
        ))}
        <Popover open={isCustomOpen} onOpenChange={setIsCustomOpen}>
          <PopoverTrigger asChild>
            <Button
              variant={value === 'custom' ? 'default' : 'ghost'}
              size="sm"
              className={cn(
                'h-8 px-3 text-xs',
                value === 'custom'
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'text-gray-700 hover:bg-white/50'
              )}
            >
              {value === 'custom' && customRange?.from && customRange?.to
                ? formatCustomRangeDisplay()
                : 'Custom'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4" align="start">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">From Date</label>
                <Input
                  type="date"
                  value={tempFrom ? new Date(tempFrom).toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    if (e.target.value) {
                      const date = new Date(e.target.value);
                      date.setHours(0, 0, 0, 0);
                      setTempFrom(date.toISOString());
                    } else {
                      setTempFrom('');
                    }
                  }}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">To Date</label>
                <Input
                  type="date"
                  value={tempTo ? new Date(tempTo).toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    if (e.target.value) {
                      const date = new Date(e.target.value);
                      date.setHours(23, 59, 59, 999);
                      setTempTo(date.toISOString());
                    } else {
                      setTempTo('');
                    }
                  }}
                  min={tempFrom ? new Date(tempFrom).toISOString().split('T')[0] : undefined}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsCustomOpen(false);
                    // Reset to existing customRange values
                    if (customRange?.from && customRange?.to) {
                      setTempFrom(customRange.from);
                      setTempTo(customRange.to);
                    }
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleApplyCustom}
                  disabled={!tempFrom || !tempTo}
                  className="bg-gray-900 text-white hover:bg-gray-800"
                >
                  Apply
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

