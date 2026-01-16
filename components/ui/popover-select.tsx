'use client';

import * as React from 'react';
import { Check, ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export type PopoverSelectItem = {
  value: string;
  label: string;
  disabled?: boolean;
};

type PopoverSelectProps = {
  value: string; // allow '' for "unset"
  onValueChange: (value: string) => void;
  items: PopoverSelectItem[];
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  contentClassName?: string;
  listClassName?: string;
};

export function PopoverSelect({
  value,
  onValueChange,
  items,
  placeholder = 'Select...',
  disabled,
  id,
  className,
  contentClassName,
  listClassName,
}: PopoverSelectProps) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const [triggerWidth, setTriggerWidth] = React.useState<number | null>(null);

  const selected = items.find((i) => i.value === value);
  const display = value === '' ? placeholder : selected?.label ?? value;

  React.useLayoutEffect(() => {
    const el = triggerRef.current;
    if (!el) return;

    const update = () => setTriggerWidth(el.getBoundingClientRect().width);
    update();

    // Keep width in sync on resize/layout changes.
    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          ref={triggerRef}
          id={id}
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={cn(
            'w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all',
            'flex items-center justify-between gap-3',
            disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
        >
          <span
            className={cn(
              'truncate text-left',
              value === '' ? 'text-gray-400' : 'text-gray-900'
            )}
          >
            {display}
          </span>
          <ChevronDown className={cn('h-4 w-4 text-gray-400 transition-transform', open && 'rotate-180')} />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={6}
        className={cn('p-1', contentClassName)}
        style={
          triggerWidth
            ? ({ width: triggerWidth } as React.CSSProperties)
            : undefined
        }
      >
        <div
          role="listbox"
          className={cn(
            'max-h-72 overflow-auto',
            'rounded-lg bg-white',
            listClassName
          )}
        >
          {items.map((item) => {
            const isSelected = item.value === value;
            return (
              <button
                key={item.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                disabled={item.disabled}
                onClick={() => {
                  onValueChange(item.value);
                  setOpen(false);
                }}
                className={cn(
                  'w-full px-3 py-2 text-sm rounded-md',
                  'flex items-center justify-between gap-3',
                  'text-left transition-colors',
                  'hover:bg-blue-50 hover:text-blue-700',
                  'focus:outline-none focus:bg-blue-50 focus:text-blue-700',
                  item.disabled && 'opacity-50 cursor-not-allowed hover:bg-transparent hover:text-inherit',
                  isSelected && 'bg-blue-50 text-blue-700'
                )}
              >
                <span className="truncate">{item.label}</span>
                {isSelected && <Check className="h-4 w-4" />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

