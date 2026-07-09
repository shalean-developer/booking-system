'use client';

import { useEffect, useState } from 'react';
import { Bath, BedDouble, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

function formatZar(v: number) {
  return `R ${Math.round(v).toLocaleString('en-ZA')}`;
}

export interface BookingSummarySidebarProps {
  serviceType: string;
  rooms: number;
  bathrooms: number;
  location: string;
  date: string;
  time: string;
  /** Authoritative total from `booking.pricing.total` (server lock); null until locked. */
  totalPrice: number | null;
  onContinue: () => void;
  continueDisabled: boolean;
  continueLabel?: string;
  urgencyMessage?: string;
}

export function BookingSummarySidebar({
  serviceType,
  rooms,
  bathrooms,
  location,
  date,
  time,
  totalPrice,
  onContinue,
  continueDisabled,
  continueLabel = 'Continue →',
  urgencyMessage,
}: BookingSummarySidebarProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const hydratedTotalPrice = hasMounted ? totalPrice : null;

  return (
    <>
      <div className="hidden md:block">
        <div className="sticky top-6 rounded-2xl border bg-white p-4 lg:p-5">
          <p className="text-xs uppercase tracking-wide text-gray-500">Price Summary</p>
          <p className="mt-1 text-sm font-semibold text-gray-900">
            {hydratedTotalPrice == null ? 'Complete Step 1 to lock your price' : formatZar(hydratedTotalPrice)}
          </p>

          <div className="mt-4 space-y-1 text-sm text-gray-600">
            <p>Service: {serviceType || 'Not selected'}</p>
            <p className="flex items-center gap-2">
              <BedDouble className="h-4 w-4" /> {rooms} rooms
            </p>
            <p className="flex items-center gap-2">
              <Bath className="h-4 w-4" /> {bathrooms} bathrooms
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4" /> {location || 'Not selected'}
            </p>
            <p>Date: {date || 'Not selected'}</p>
            <p>Time: {time || 'Not selected'}</p>
          </div>

          {urgencyMessage ? <p className="mt-3 text-xs text-amber-700">{urgencyMessage}</p> : null}

          <button
            type="button"
            disabled={continueDisabled}
            onClick={onContinue}
            className={cn(
              'mt-4 w-full rounded-xl px-4 py-3 text-sm font-semibold text-white',
              continueDisabled ? 'bg-gray-300' : 'bg-violet-600 hover:bg-violet-700'
            )}
          >
            {continueLabel}
          </button>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-white p-4 shadow-[0_-6px_18px_rgba(15,23,42,0.08)] md:hidden">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Total</p>
            <p className="text-lg font-bold text-gray-900">
              {hydratedTotalPrice == null ? '—' : formatZar(hydratedTotalPrice)}
            </p>
            <p className="text-xs text-gray-600">
              {serviceType} • {date || 'No date'} • {time || '--:--'}
            </p>
          </div>
          <button
            type="button"
            disabled={continueDisabled}
            onClick={onContinue}
            className={cn(
              'rounded-xl px-5 py-3 text-sm font-semibold text-white',
              continueDisabled ? 'bg-gray-300' : 'bg-violet-600 hover:bg-violet-700'
            )}
          >
            {continueLabel.replace(' →', '')}
          </button>
        </div>
      </div>
    </>
  );
}
