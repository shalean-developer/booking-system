'use client';

import { useCallback, useEffect, useState } from 'react';
import type { BookingAbVariant } from '@/lib/booking-slot-availability-styles';

const STORAGE_KEY = 'booking_variant';

/**
 * Simple 50/50 A/B assignment persisted in localStorage for the booking funnel.
 */
export function useBookingAbVariant(): {
  variant: BookingAbVariant | null;
  track: (event: string) => void;
} {
  const [variant, setVariant] = useState<BookingAbVariant | null>(null);

  useEffect(() => {
    try {
      const existing = localStorage.getItem(STORAGE_KEY);
      if (existing === 'A' || existing === 'B') {
        setVariant(existing);
        return;
      }
      const v: BookingAbVariant = Math.random() > 0.5 ? 'A' : 'B';
      localStorage.setItem(STORAGE_KEY, v);
      setVariant(v);
    } catch {
      setVariant('A');
    }
  }, []);

  const track = useCallback(
    (event: string) => {
      const v = (() => {
        try {
          const x = localStorage.getItem(STORAGE_KEY);
          return x === 'A' || x === 'B' ? x : variant;
        } catch {
          return variant;
        }
      })();
      if (v) console.log('[AB]', v, event);
    },
    [variant]
  );

  return { variant, track };
}
