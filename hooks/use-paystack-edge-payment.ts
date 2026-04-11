'use client';

import { useCallback, useState } from 'react';

export function usePaystackEdgePayment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialize = useCallback(
    async (params: { bookingId: string }) => {
      setError(null);
      setLoading(true);
      try {
        const res = await fetch('/api/paystack/initialize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ booking_id: params.bookingId }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok || !data.authorization_url) {
          setError(data.error || 'Could not start payment');
          return { ok: false as const };
        }
        window.location.href = data.authorization_url as string;
        return { ok: true as const };
      } catch {
        setError('Network error');
        return { ok: false as const };
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { loading, error, initialize, clearError: () => setError(null) };
}
