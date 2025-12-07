'use client';

import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase-client';
import type { Cleaner } from '@/types/dashboard';

interface CleanerCache {
  [cleanerId: string]: {
    cleaner: Cleaner;
    timestamp: number;
  };
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const inFlightRequests = new Map<string, Promise<Cleaner | null>>();

/**
 * Shared hook for fetching and caching cleaner data
 * Prevents duplicate API calls for the same cleaner
 */
export function useCleanerCache() {
  const [cache, setCache] = useState<CleanerCache>({});
  const cacheRef = useRef<CleanerCache>({});

  const fetchCleaner = useCallback(async (cleanerId: string): Promise<Cleaner | null> => {
    // Check cache first
    const cached = cacheRef.current[cleanerId];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.cleaner;
    }

    // Check if request is already in flight
    if (inFlightRequests.has(cleanerId)) {
      return inFlightRequests.get(cleanerId)!;
    }

    // Create new request
    const request = (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          return null;
        }

        const response = await fetch(`/api/dashboard/cleaners/${cleanerId}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        const data = await response.json();
        if (data.ok && data.cleaner) {
          const cleaner: Cleaner = {
            id: data.cleaner.id,
            name: data.cleaner.name,
            photoUrl: data.cleaner.photo_url || data.cleaner.photoUrl,
            photo_url: data.cleaner.photo_url || data.cleaner.photoUrl,
            rating: data.cleaner.rating,
            email: data.cleaner.email,
            phone: data.cleaner.phone,
          };

          // Update cache
          cacheRef.current[cleanerId] = {
            cleaner,
            timestamp: Date.now(),
          };
          setCache({ ...cacheRef.current });

          return cleaner;
        }
        return null;
      } catch (error) {
        console.error(`Error fetching cleaner ${cleanerId}:`, error);
        return null;
      } finally {
        // Remove from in-flight requests
        inFlightRequests.delete(cleanerId);
      }
    })();

    inFlightRequests.set(cleanerId, request);
    return request;
  }, []);

  const fetchMultipleCleaners = useCallback(async (cleanerIds: string[]): Promise<Record<string, Cleaner>> => {
    const uniqueIds = Array.from(new Set(cleanerIds.filter(id => !!id)));
    if (uniqueIds.length === 0) return {};

    const promises = uniqueIds.map(id => fetchCleaner(id));
    const results = await Promise.all(promises);

    const cleanerMap: Record<string, Cleaner> = {};
    results.forEach((cleaner, index) => {
      if (cleaner) {
        cleanerMap[uniqueIds[index]] = cleaner;
      }
    });

    return cleanerMap;
  }, [fetchCleaner]);

  const getCleaner = useCallback((cleanerId: string): Cleaner | null => {
    const cached = cacheRef.current[cleanerId];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.cleaner;
    }
    return null;
  }, []);

  const clearCache = useCallback(() => {
    cacheRef.current = {};
    setCache({});
  }, []);

  return {
    fetchCleaner,
    fetchMultipleCleaners,
    getCleaner,
    clearCache,
    cache,
  };
}
