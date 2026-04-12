'use client';

import { useCallback, useEffect, useState } from 'react';

export type QuickServiceItem = {
  id: string;
  name: string;
  fullName: string;
  icon: string;
  type: 'service' | 'extra';
  href: string;
};

export function useServices() {
  const [services, setServices] = useState<QuickServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/dashboard/services', { cache: 'no-store' });
      const json = await res.json();
      if (!json?.ok) {
        setError(json?.error || 'Failed to load services');
        setServices([]);
        return;
      }
      setServices(Array.isArray(json.services) ? json.services : []);
    } catch {
      setError('Failed to load services');
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { services, loading, error, refresh };
}
