'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { supabase } from '@/lib/supabase/client';
import type { CleanerFinancialData } from '@/lib/cleaner-financial';

type RealtimeMode = 'subscribed' | 'polling_only' | 'unknown';

type CleanerFinancialContextValue = {
  data: CleanerFinancialData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  realtimeMode: RealtimeMode;
};

const CleanerFinancialContext = createContext<CleanerFinancialContextValue | null>(null);

/** When Realtime works, poll less often; on failure, poll faster. */
const POLL_MS_SUBSCRIBED = 22_000;
const POLL_MS_FALLBACK = 14_000;

function logRealtime(state: string, detail?: string) {
  const line = `[cleaner-financial:realtime] ${state}${detail ? `: ${detail}` : ''}`;
  if (process.env.NODE_ENV === 'development') {
    console.info(line);
  } else {
    console.log(line);
  }
}

export function CleanerFinancialProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<CleanerFinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [realtimeMode, setRealtimeMode] = useState<RealtimeMode>('unknown');
  const pollMsRef = useRef(POLL_MS_FALLBACK);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/cleaner/financial', { credentials: 'include', cache: 'no-store' });
      const json = (await res.json()) as { ok?: boolean; error?: string; data?: CleanerFinancialData };
      if (!json.ok || !json.data) {
        setError(json.error || 'Failed to load wallet');
        setData(null);
        return;
      }
      setError(null);
      setData(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load wallet');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const id = data?.cleaner_id;
    if (!id) return;

    let pollTimer: ReturnType<typeof setInterval> | undefined;
    const schedulePoll = (ms: number) => {
      if (pollTimer) clearInterval(pollTimer);
      pollMsRef.current = ms;
      pollTimer = setInterval(() => void refresh(), ms);
    };

    schedulePoll(POLL_MS_FALLBACK);

    const channel = supabase
      .channel(`cleaner-wallet-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cleaner_wallets',
          filter: `cleaner_id=eq.${id}`,
        },
        () => void refresh(),
      )
      .subscribe((status, err) => {
        logRealtime(status, err?.message);
        if (status === 'SUBSCRIBED') {
          setRealtimeMode('subscribed');
          schedulePoll(POLL_MS_SUBSCRIBED);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          setRealtimeMode('polling_only');
          schedulePoll(POLL_MS_FALLBACK);
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            logRealtime('fallback_active', 'using interval polling');
          }
        }
      });

    const onFocus = () => void refresh();
    window.addEventListener('focus', onFocus);

    return () => {
      if (pollTimer) clearInterval(pollTimer);
      window.removeEventListener('focus', onFocus);
      void supabase.removeChannel(channel);
    };
  }, [data?.cleaner_id, refresh]);

  const value = useMemo(
    () => ({ data, loading, error, refresh, realtimeMode }),
    [data, loading, error, refresh, realtimeMode],
  );

  return (
    <CleanerFinancialContext.Provider value={value}>{children}</CleanerFinancialContext.Provider>
  );
}

export function useCleanerFinancial(): CleanerFinancialContextValue {
  const ctx = useContext(CleanerFinancialContext);
  if (!ctx) {
    throw new Error('useCleanerFinancial must be used within CleanerFinancialProvider');
  }
  return ctx;
}
