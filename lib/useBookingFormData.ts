'use client';

import { useState, useEffect, useCallback } from 'react';
import type { QuickCleanSettings } from '@/lib/quick-clean-settings';

export interface BookingFormService {
  type: 'Standard' | 'Deep' | 'Move In/Out' | 'Airbnb' | 'Carpet';
  label: string;
  subLabel: string;
  description: string;
  checklist: string[];
  badge?: 'Popular' | 'New';
  icon: string;
  image: string;
  displayOrder: number;
}

export interface BookingFormExtras {
  all: string[];
  standardAndAirbnb: string[];
  deepAndMove: string[];
  quantityExtras: string[];
  meta: Record<string, { blurb: string }>;
  prices: Record<string, number>;
}

export interface BookingFormData {
  services: BookingFormService[];
  pricing: {
    services: Record<string, { base: number; bedroom: number; bathroom: number; extraRoom: number }>;
    extras: Record<string, number>;
    serviceFee: number;
    frequencyDiscounts: Record<string, number>;
    equipmentChargeZar: number;
    minimumBookingFeeZar: number;
  } | null;
  extras: BookingFormExtras;
  equipment?: {
    items: string[];
    charge: number;
  };
  /** Server-driven: pay-later is off in production unless ALLOW_PAY_LATER_BOOKINGS=true */
  allowPayLater?: boolean;
  /** Quick Clean V4 — hourly rate, caps, rounding (from `quick_clean_settings`). */
  quickCleanSettings?: QuickCleanSettings;
}

/** Short-lived cache to avoid full-screen reload flash on route/dev refreshes. */
const CACHE_DURATION = 60_000;
let cachedData: BookingFormData | null = null;
let cacheTimestamp = 0;
let fetchingPromise: Promise<BookingFormData> | null = null;

function isCacheValid(): boolean {
  if (CACHE_DURATION <= 0) return false;
  return cachedData !== null && Date.now() - cacheTimestamp < CACHE_DURATION;
}

export function useBookingFormData(initialData?: BookingFormData | null, forceRefresh = false) {
  const hasInitial = Boolean(initialData && Array.isArray(initialData.services));
  const [data, setData] = useState<BookingFormData | null>(cachedData ?? initialData ?? null);
  const [loading, setLoading] = useState(!cachedData && !hasInitial);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    // Return cached data if valid and not forcing refresh
    if (!forceRefresh && isCacheValid() && cachedData) {
      setData(cachedData);
      setLoading(false);
      return cachedData;
    }

    // If already fetching, wait for existing promise
    if (fetchingPromise) {
      try {
        const result = await fetchingPromise;
        setData(result);
        setLoading(false);
        return result;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
        setLoading(false);
        throw err;
      }
    }

    // Create new fetch promise
    fetchingPromise = (async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/booking/form-data', {
          cache: 'no-store',
        });
        const result = await response.json();

        if (!result.ok) {
          throw new Error(result.error || 'Failed to fetch booking form data');
        }

        const formData: BookingFormData = {
          services: result.services || [],
          pricing: result.pricing,
          extras: result.extras || {
            all: [],
            standardAndAirbnb: [],
            deepAndMove: [],
            quantityExtras: [],
            meta: {},
            prices: {},
          },
          equipment: result.equipment || {
            items: [],
            charge: 500,
          },
          allowPayLater: result.allowPayLater !== false,
          quickCleanSettings: result.quickCleanSettings,
        };

        // Update cache
        cachedData = formData;
        cacheTimestamp = Date.now();

        setData(formData);
        setLoading(false);
        return formData;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch booking form data';
        setError(errorMessage);
        setLoading(false);
        throw err;
      } finally {
        fetchingPromise = null;
      }
    })();

    return fetchingPromise;
  }, [forceRefresh]);

  useEffect(() => {
    if (hasInitial && initialData) {
      cachedData = initialData;
      cacheTimestamp = Date.now();
    }
    if (!hasInitial) {
      fetchData().catch(() => {
        // Error already handled in fetchData
      });
    } else {
      // Stale-while-revalidate: background fetch to refresh cache
      fetch('/api/booking/form-data', { cache: 'no-store' })
        .then((res) => res.json())
        .then((result) => {
          if (result.ok && result.services) {
            const formData: BookingFormData = {
              services: result.services || [],
              pricing: result.pricing,
              extras: result.extras || { all: [], standardAndAirbnb: [], deepAndMove: [], quantityExtras: [], meta: {}, prices: {} },
              equipment: result.equipment || { items: [], charge: 500 },
              allowPayLater: result.allowPayLater !== false,
              quickCleanSettings: result.quickCleanSettings,
            };
            cachedData = formData;
            cacheTimestamp = Date.now();
            setData(formData);
          }
        })
        .catch(() => {});
    }
  }, [fetchData, hasInitial, initialData]);

  return {
    data,
    loading,
    error,
    refetch: () => fetchData(),
  };
}

