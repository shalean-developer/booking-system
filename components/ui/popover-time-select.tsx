'use client';

import * as React from 'react';
import { Clock } from 'lucide-react';

import { cn } from '@/lib/utils';
import { PopoverSelect, type PopoverSelectItem } from '@/components/ui/popover-select';

type PopoverTimeSelectProps = {
  value: string; // '' or HH:mm
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  stepMinutes?: 15 | 30 | 60;
  startHour?: number; // 0-23
  endHour?: number; // 0-23 (inclusive)
  className?: string;
};

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function buildTimes(stepMinutes: number, startHour: number, endHour: number): PopoverSelectItem[] {
  const items: PopoverSelectItem[] = [{ value: '', label: 'Select time' }];
  const start = Math.max(0, Math.min(23, startHour));
  const end = Math.max(0, Math.min(23, endHour));
  const [minH, maxH] = start <= end ? [start, end] : [end, start];

  for (let h = minH; h <= maxH; h += 1) {
    for (let m = 0; m < 60; m += stepMinutes) {
      const v = `${pad2(h)}:${pad2(m)}`;
      items.push({ value: v, label: v });
    }
  }
  return items;
}

export function PopoverTimeSelect({
  value,
  onValueChange,
  placeholder = 'Select time',
  disabled,
  stepMinutes = 30,
  startHour = 7,
  endHour = 18,
  className,
}: PopoverTimeSelectProps) {
  const items = React.useMemo(
    () =>
      buildTimes(stepMinutes, startHour, endHour).map((i) =>
        i.value === '' ? { ...i, label: placeholder } : i
      ),
    [stepMinutes, startHour, endHour, placeholder]
  );

  return (
    <div className="relative">
      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      <PopoverSelect
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        items={items}
        className={cn('pl-10', className)}
      />
    </div>
  );
}

