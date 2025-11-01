'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface DateRangeFilterProps {
  onDateRangeChange: (days: number) => void;
  selectedDays: number;
}

const PRESET_RANGES = [
  { label: 'Today', days: 1 },
  { label: 'Last 7 Days', days: 7 },
  { label: 'Last 30 Days', days: 30 },
  { label: 'Last 90 Days', days: 90 },
  { label: 'Last 6 Months', days: 180 },
];

export function DateRangeFilter({ onDateRangeChange, selectedDays }: DateRangeFilterProps) {
  const [selectedPreset, setSelectedPreset] = useState<number>(
    PRESET_RANGES.find(p => p.days === selectedDays)?.days || 30
  );

  const handlePresetClick = (days: number) => {
    setSelectedPreset(days);
    onDateRangeChange(days);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs sm:text-sm text-gray-600 font-medium whitespace-nowrap">Period:</span>
      {PRESET_RANGES.map((preset) => (
        <Button
          key={preset.days}
          variant={selectedPreset === preset.days ? 'default' : 'outline'}
          onClick={() => handlePresetClick(preset.days)}
          className={cn(
            'text-xs sm:text-sm px-3 sm:px-4 py-2 font-medium transition-all',
            selectedPreset === preset.days 
              ? 'bg-primary text-primary-foreground shadow-sm' 
              : 'hover:bg-gray-50 hover:border-gray-300'
          )}
        >
          {preset.label}
        </Button>
      ))}
    </div>
  );
}
