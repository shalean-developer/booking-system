'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DateRangeFilterProps {
  onDateRangeChange: (days: number) => void;
  selectedDays: number;
}

export function DateRangeFilter({ onDateRangeChange, selectedDays }: DateRangeFilterProps) {
  // Calculate days from start of current month to today
  const getCurrentMonthDays = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const daysDifference = Math.ceil((now.getTime() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24));
    return daysDifference + 1; // +1 to include today
  };

  const currentMonthDays = getCurrentMonthDays();

  const PRESET_RANGES = [
    { label: 'Current Month', days: currentMonthDays },
    { label: 'Today', days: 1 },
    { label: 'Last 7 Days', days: 7 },
    { label: 'Last 30 Days', days: 30 },
    { label: 'Last 90 Days', days: 90 },
    { label: 'Last 6 Months', days: 180 },
  ];

  const [selectedPreset, setSelectedPreset] = useState<number>(
    PRESET_RANGES.find(p => p.days === selectedDays)?.days || currentMonthDays
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
          key={preset.label}
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
