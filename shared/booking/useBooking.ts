'use client';

import { useEffect, useMemo, useState } from 'react';
import type { BookingFormData as ApiBookingFormData } from '@/lib/useBookingFormData';
import type { BookingFormData, ServiceType } from '@/components/booking-system-types';
import { computeLinePricingFromWizard } from './calculate';
import { createInitialWizardState } from './wizard-state';
import type { BookingPriceResult } from './calculate';

/**
 * Public multi-step booking wizard — owns full `BookingFormData`, session persistence,
 * and pre-surge line pricing (same engine as dashboard + server).
 */
export function useBooking(options: {
  apiFormData: ApiBookingFormData | null;
  storageKey: string;
  initialService?: ServiceType;
  /** URL service slug wins over stale persisted service */
  serviceFromPath?: ServiceType;
}) {
  const { apiFormData, storageKey, initialService, serviceFromPath } = options;

  const [data, setData] = useState<BookingFormData>(() =>
    createInitialWizardState({ storageKey, initialService, serviceFromPath })
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.sessionStorage.setItem(storageKey, JSON.stringify(data));
    } catch {
      // ignore storage write errors
    }
  }, [data, storageKey]);

  const lineCalc: BookingPriceResult | null = useMemo(
    () => computeLinePricingFromWizard(data, apiFormData),
    [data, apiFormData]
  );

  return { data, setData, lineCalc };
}
