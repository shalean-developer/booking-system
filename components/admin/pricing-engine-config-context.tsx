'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { PricingConfig } from '@/lib/pricing/config';

type PricingEngineConfigState = {
  config: PricingConfig | null;
  loading: boolean;
  error: string | null;
};

const PricingEngineConfigContext = createContext<PricingEngineConfigState>({
  config: null,
  loading: true,
  error: null,
});

export function PricingEngineConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<PricingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/pricing/config')
      .then((r) => r.json())
      .then((j: { ok?: boolean; config?: PricingConfig; error?: string }) => {
        if (cancelled) return;
        if (j.ok && j.config) {
          setConfig(j.config);
          setError(null);
        } else {
          setError(typeof j.error === 'string' ? j.error : 'Failed to load pricing config');
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Network error');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PricingEngineConfigContext.Provider value={{ config, loading, error }}>
      {children}
    </PricingEngineConfigContext.Provider>
  );
}

export function usePricingEngineConfig() {
  return useContext(PricingEngineConfigContext);
}
