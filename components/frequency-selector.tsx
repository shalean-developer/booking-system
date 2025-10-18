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

export function FrequencySelector({ 
  value, 
  onChange, 
  discounts = {},
  className 
}: FrequencySelectorProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <div>
        <Label className="text-sm font-semibold text-gray-900">
          How often do you need cleaning?
        </Label>
        <p className="text-sm text-gray-600 mt-1">
          Save money with recurring services
        </p>
      </div>

      <RadioGroup
        value={value}
        onValueChange={(val) => onChange(val as any)}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {FREQUENCY_OPTIONS.map((option) => {
          const discount = option.discountKey ? discounts[option.discountKey] : undefined;
          const isSelected = value === option.value;

          return (
            <div key={option.value} className="relative">
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

                {/* Discount Badge */}
                {discount && discount > 0 && (
                  <Badge 
                    variant={isSelected ? "default" : "secondary"}
                    className={cn(
                      "mt-2 text-xs font-semibold",
                      isSelected && "bg-primary text-white"
                    )}
                  >
                    Save {discount}%
                  </Badge>
                )}
              </Label>
            </div>
          );
        })}
      </RadioGroup>

      {/* Selected frequency info */}
      {value !== 'one-time' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
          <p className="text-sm text-blue-900">
            <span className="font-semibold">Great choice!</span> You'll save{' '}
            {discounts[value as keyof typeof discounts] || 0}% on recurring {value} service.
          </p>
        </div>
      )}
    </div>
  );
}

