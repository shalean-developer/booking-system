'use client';

import { useState, useEffect, useCallback } from 'react';

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
    services: Record<string, { base: number; bedroom: number; bathroom: number }>;
    extras: Record<string, number>;
    serviceFee: number;
    frequencyDiscounts: Record<string, number>;
  } | null;
  extras: BookingFormExtras;
  equipment?: {
    items: string[];
    charge: number;
  };
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let cachedData: BookingFormData | null = null;
let cacheTimestamp = 0;
let fetchingPromise: Promise<BookingFormData> | null = null;

function isCacheValid(): boolean {
  return cachedData !== null && Date.now() - cacheTimestamp < CACHE_DURATION;
}

export function useBookingFormData(forceRefresh = false) {
  const [data, setData] = useState<BookingFormData | null>(cachedData);
  const [loading, setLoading] = useState(!cachedData);
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

        const response = await fetch('/api/booking/form-data');
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
    fetchData().catch(() => {
      // Error already handled in fetchData
    });
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: () => fetchData(),
  };
}

