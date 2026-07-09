'use client';

import { useInstantPricing, type InstantPricingInput } from '@/hooks/useInstantPricing';
import { cn } from '@/lib/utils';

type InstantPriceProps = {
  input: InstantPricingInput | null | undefined;
  className?: string;
};

export function InstantPrice({ input, className }: InstantPriceProps) {
  const { result, loading, error } = useInstantPricing(input);

  if (!input?.service || !input.date?.trim()) {
    return (
      <div className={cn('flex flex-col gap-1', className)}>
        <div className="text-xs text-green-600">⚡ Instant estimate based on typical home</div>
        <div className="text-sm text-gray-500">Get instant quote</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={cn('flex flex-col gap-1', className)}>
        <div className="text-xs text-green-600">⚡ Instant estimate based on typical home</div>
        <div className="text-sm text-gray-400">Calculating price...</div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className={cn('flex flex-col gap-1', className)}>
        <div className="text-xs text-green-600">⚡ Instant estimate based on typical home</div>
        <div className="text-sm text-gray-500">Pricing unavailable — continue to get quote</div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="text-xs text-green-600">⚡ Instant estimate based on typical home</div>
      <div className="flex flex-col gap-0.5">
        <div className="text-lg font-semibold text-purple-600">
          R {result.finalPriceZar.toLocaleString('en-ZA')}
        </div>
        <div className="text-xs text-gray-400">Indicative total when you complete booking</div>
        <div className="text-xs text-gray-500 mt-1">Based on a typical home — adjust details</div>
      </div>
    </div>
  );
}
