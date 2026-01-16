'use client';

import * as React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format, isValid, parseISO } from 'date-fns';

import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

type PopoverDatePickerProps = {
  value: string; // '' or yyyy-MM-dd
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
  className?: string;
  contentClassName?: string;
};

function parseValue(value: string): Date | undefined {
  if (!value) return undefined;
  const d = parseISO(value);
  return isValid(d) ? d : undefined;
}

export function PopoverDatePicker({
  value,
  onValueChange,
  placeholder = 'yyyy/mm/dd',
  disabled,
  minDate,
  className,
  contentClassName,
}: PopoverDatePickerProps) {
  const selected = React.useMemo(() => parseValue(value), [value]);

  const display = selected ? format(selected, 'yyyy/MM/dd') : placeholder;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'booking-native-datetime w-full bg-gray-50 border border-gray-200 rounded-xl px-10 py-3 text-sm',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all',
            'text-left',
            disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
        >
          <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <span className={cn(!selected && 'text-gray-400')}>{display}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        className={cn('p-0 w-auto', contentClassName)}
      >
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(d) => onValueChange(d ? format(d, 'yyyy-MM-dd') : '')}
          disabled={minDate ? { before: minDate } : undefined}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

