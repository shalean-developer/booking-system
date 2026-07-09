'use client';

import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type StepperInputProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
  helperText?: string;
  disabled?: boolean;
};

export function StepperInput({ label, value, min, max, onChange, helperText, disabled }: StepperInputProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-gray-900">{label}</span>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-xl border-gray-200"
            disabled={disabled || value <= min}
            onClick={() => onChange(Math.max(min, value - 1))}
            aria-label={`Decrease ${label}`}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="min-w-[2.25rem] text-center text-lg font-bold tabular-nums text-gray-900">{value}</span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-xl border-gray-200"
            disabled={disabled || value >= max}
            onClick={() => onChange(Math.min(max, value + 1))}
            aria-label={`Increase ${label}`}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {helperText ? <p className={cn('text-xs text-gray-500')}>{helperText}</p> : null}
    </div>
  );
}
