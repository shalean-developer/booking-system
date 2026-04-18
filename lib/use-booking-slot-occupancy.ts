'use client';

import { useState, useEffect, useMemo } from 'react';

export type SlotOccupancyStatus = 'idle' | 'loading' | 'success' | 'error';

export type SlotOccupancyContext = {
  suburb?: string;
  /** Union with suburb when matching `cleaners.areas` (same idea as GET /api/cleaners/available). */
  city?: string;
  bedrooms?: number;
  bathrooms?: number;
  extras?: string[];
  extrasQuantities?: Record<string, number>;
  /** Override computed duration (minutes). */
  durationMinutes?: number;
};

function buildOccupancyUrl(isoDate: string, context?: SlotOccupancyContext | null): string {
  const params = new URLSearchParams();
  params.set('date', isoDate);
  if (context?.suburb?.trim()) {
    params.set('suburb', context.suburb.trim());
  }
  if (context?.city?.trim()) {
    params.set('city', context.city.trim());
  }
  if (context?.durationMinutes != null && context.durationMinutes >= 30) {
    params.set('duration_minutes', String(context.durationMinutes));
  }
  if (context?.bedrooms != null) params.set('bedrooms', String(context.bedrooms));
  if (context?.bathrooms != null) params.set('bathrooms', String(context.bathrooms));
  if (context?.extras?.length) {
    params.set('extras', JSON.stringify(context.extras));
  }
  if (context?.extrasQuantities && Object.keys(context.extrasQuantities).length > 0) {
    params.set('extras_quantities', JSON.stringify(context.extrasQuantities));
  }
  return `/api/bookings/slot-occupancy?${params.toString()}`;
}

export function useBookingSlotOccupancy(
  isoDate: string | null | undefined,
  context?: SlotOccupancyContext | null
) {
  const [status, setStatus] = useState<SlotOccupancyStatus>('idle');
  const [remaining, setRemaining] = useState<Record<string, number>>({});
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [eligibleCleaners, setEligibleCleaners] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const contextKey = useMemo(
    () =>
      JSON.stringify({
        suburb: context?.suburb ?? '',
        city: context?.city ?? '',
        bedrooms: context?.bedrooms,
        bathrooms: context?.bathrooms,
        extras: context?.extras ?? [],
        extrasQuantities: context?.extrasQuantities ?? {},
        durationMinutes: context?.durationMinutes,
      }),
    [context]
  );

  useEffect(() => {
    if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
      setStatus('idle');
      setRemaining({});
      setCounts({});
      setEligibleCleaners(null);
      setErrorMessage(null);
      return;
    }

    let cancelled = false;
    setStatus('loading');
    setErrorMessage(null);

    const url = buildOccupancyUrl(isoDate, context ?? undefined);

    fetch(url)
      .then(async (res) => {
        const data = (await res.json().catch(() => null)) as {
          ok?: boolean;
          remaining?: Record<string, number>;
          counts?: Record<string, number>;
          eligible_cleaners?: number | null;
          error?: string;
        } | null;
        if (cancelled) return;
        if (!res.ok || !data?.ok) {
          setStatus('error');
          setRemaining({});
          setCounts({});
          setEligibleCleaners(null);
          setErrorMessage(data?.error || 'Could not load availability');
          return;
        }
        setStatus('success');
        setRemaining(data.remaining ?? {});
        setCounts(data.counts ?? {});
        setEligibleCleaners(
          typeof data.eligible_cleaners === 'number' ? data.eligible_cleaners : null
        );
      })
      .catch(() => {
        if (cancelled) return;
        setStatus('error');
        setRemaining({});
        setCounts({});
        setEligibleCleaners(null);
        setErrorMessage('Could not load availability');
      });

    return () => {
      cancelled = true;
    };
  }, [isoDate, contextKey]);

  return { status, remaining, counts, eligibleCleaners, errorMessage };
}
