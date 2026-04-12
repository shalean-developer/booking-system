'use client';

import { useCallback, useEffect, useState } from 'react';

type CleanerRow = Record<string, unknown> & { id: string; name?: string };

/**
 * Loads cleaners from the admin API (cookie session). Use on admin routes.
 */
export function useCleaners(options?: { limit?: number; activeOnly?: boolean }) {
  const limit = options?.limit ?? 100;
  const activeOnly = options?.activeOnly ?? false;
  const [cleaners, setCleaners] = useState<CleanerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: String(limit) });
      if (activeOnly) params.set('active', 'true');
      const res = await fetch(`/api/admin/cleaners?${params.toString()}`, { cache: 'no-store' });
      const json = await res.json();
      if (!json?.ok) {
        setError(json?.error || 'Failed to load cleaners');
        setCleaners([]);
        return;
      }
      setCleaners(Array.isArray(json.cleaners) ? json.cleaners : []);
    } catch {
      setError('Failed to load cleaners');
      setCleaners([]);
    } finally {
      setLoading(false);
    }
  }, [limit, activeOnly]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { cleaners, loading, error, refresh };
}
