'use client';

import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface FrequencySelectorProps {
  value: 'one-time' | 'weekly' | 'bi-weekly' | 'monthly';
  onChange: (value: 'one-time' | 'weekly' | 'bi-weekly' | 'monthly') => void;
  discounts?: {
    weekly?: number;
    'bi-weekly'?: number;
    monthly?: number;
  };
  className?: string;
  pricingByFrequency?: Partial<Record<'one-time' | 'weekly' | 'bi-weekly' | 'monthly', {
    total: number;
    subtotal: number;
    frequencyDiscountPercent: number;
  }>>;
}

const FREQUENCY_OPTIONS = [
  {
    value: 'one-time' as const,
    label: 'One-Time',
    description: 'Single cleaning session',
    icon: '🏠',
  },
  {
    value: 'weekly' as const,
    label: 'Weekly',
    description: 'Every week',
    icon: '📅',
    discountKey: 'weekly' as const,
  },
  {
    value: 'bi-weekly' as const,
    label: 'Bi-Weekly',
    description: 'Every 2 weeks',
    icon: '📆',
    discountKey: 'bi-weekly' as const,
  },
  {
    value: 'monthly' as const,
    label: 'Monthly',
    description: 'Once a month',
    icon: '🗓️',
    discountKey: 'monthly' as const,
  },
];

const currencyFormatter = new Intl.NumberFormat('en-ZA', {
  style: 'currency',
  currency: 'ZAR',
  maximumFractionDigits: 0,
});

export function FrequencySelector({ 
  value, 
  onChange, 
  discounts = {},
  className,
  pricingByFrequency,
}: FrequencySelectorProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <div>
        <Label className="text-sm font-semibold text-gray-900">
          How often do you need cleaning?
        </Label>
        <p className="text-sm text-gray-600 mt-1">
          Choose a frequency now—you can always tweak it before confirming.
        </p>
      </div>

      <RadioGroup
        value={value}
        onValueChange={(val) => onChange(val as any)}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4"
      >
        {FREQUENCY_OPTIONS.map((option) => {
          const discount = option.discountKey ? discounts[option.discountKey] : undefined;
          const isSelected = value === option.value;
          const pricing = pricingByFrequency?.[option.value];
          const helperText = (() => {
            if (discount && discount > 0) {
              return `Save ${discount}% per visit versus one-time pricing`;
            }
            if (option.value === 'one-time') {
              return 'Perfect for deep cleans or move-outs';
            }
            if (option.value === 'monthly') {
              return 'Keeps things fresh between big cleans';
            }
            return 'Keeps the same cleaner on rotation';
          })();

          return (
            <div key={option.value} className="relative">
              {/* Discount Badge - Positioned at top halfway across border */}
              {discount && discount > 0 && (
                <Badge 
                  variant={isSelected ? "default" : "secondary"}
                  className={cn(
                    "absolute left-1/2 -translate-x-1/2 -top-3 z-10 text-xs font-semibold px-2 py-0.5",
                    isSelected && "bg-primary text-white"
                  )}
                >
                  Save {discount}%
                </Badge>
              )}
              
              <RadioGroupItem
                value={option.value}
                id={`frequency-${option.value}`}
                className="peer sr-only"
              />
              <Label
                htmlFor={`frequency-${option.value}`}
                className={cn(
                  'flex flex-col items-center justify-center rounded-xl border-2 p-4 cursor-pointer transition-all',
                  'hover:border-primary/50 hover:shadow-md',
                  'peer-focus-visible:ring-2 peer-focus-visible:ring-primary/30',
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-gray-200 bg-white'
                )}
              >
                {/* Icon */}
                <span className="text-3xl mb-2">{option.icon}</span>

                {/* Label */}
                <span className={cn(
                  'text-sm font-semibold text-center',
                  isSelected ? 'text-primary' : 'text-gray-900'
                )}>
                  {option.label}
                </span>

                {/* Description */}
                <span className="text-xs text-gray-600 text-center mt-1">
                  {option.description}
                </span>
                <span className="text-sm text-gray-900 font-semibold text-center mt-2">
                  {pricing ? `${currencyFormatter.format(pricing.total)} per visit` : 'Pricing shown on next step'}
                </span>
                <span className="text-xs text-primary/80 text-center mt-2 font-semibold">
                  {helperText}
                </span>
              </Label>
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );
}

