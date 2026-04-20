'use client';

import { useState, useEffect, useMemo } from 'react';

export type UnifiedAvailabilityApiSlot = {
  start: string;
  end: string;
  available: boolean;
  assignable_cleaners: number;
  recommended: boolean;
  /** Whole percent above base when surge pricing applies (e.g. 8 => +8%). Null when no surge. */
  surge_percent?: number | null;
};

export type UnifiedAvailabilityStatus = 'idle' | 'loading' | 'success' | 'error';

export type UnifiedAvailabilityBody = {
  date: string;
  suburb: string;
  city?: string;
  service_type: 'standard' | 'airbnb';
  pricing_mode: 'quick' | 'premium';
  bedrooms: number;
  bathrooms: number;
  extra_rooms: number;
  extras: string[];
  extrasQuantities?: Record<string, number>;
  has_extra_cleaner: boolean;
};

export function useUnifiedAvailability(enabled: boolean, body: UnifiedAvailabilityBody | null) {
  const [status, setStatus] = useState<UnifiedAvailabilityStatus>('idle');
  const [slots, setSlots] = useState<UnifiedAvailabilityApiSlot[]>([]);
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null);
  const [teamSize, setTeamSize] = useState<number | null>(null);
  const [requiredDurationMinutes, setRequiredDurationMinutes] = useState<number | null>(null);
  const [latestStart, setLatestStart] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [nextAvailableDay, setNextAvailableDay] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const key = useMemo(() => (body ? JSON.stringify(body) : ''), [body]);

  useEffect(() => {
    if (!enabled || !body || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
      setStatus('idle');
      setSlots([]);
      setDurationMinutes(null);
      setTeamSize(null);
      setRequiredDurationMinutes(null);
      setLatestStart(null);
      setSuggestion(null);
      setNextAvailableDay(null);
      setErrorMessage(null);
      return;
    }

    let cancelled = false;
    setStatus('loading');
    setErrorMessage(null);

    fetch('/api/availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then(async (res) => {
        const data = (await res.json().catch(() => null)) as {
          ok?: boolean;
          slots?: UnifiedAvailabilityApiSlot[];
          duration_minutes?: number;
          required_duration_minutes?: number;
          team_size?: number;
          latest_start?: string;
          suggestion?: string | null;
          next_available_day?: string | null;
          error?: string;
        } | null;
        if (cancelled) return;
        if (!res.ok || !data?.ok) {
          setStatus('error');
          setSlots([]);
          setDurationMinutes(null);
          setTeamSize(null);
          setRequiredDurationMinutes(null);
          setLatestStart(null);
          setSuggestion(null);
          setNextAvailableDay(null);
          setErrorMessage(data?.error || 'Could not load availability');
          return;
        }
        setStatus('success');
        setSlots(Array.isArray(data.slots) ? data.slots : []);
        setDurationMinutes(typeof data.duration_minutes === 'number' ? data.duration_minutes : null);
        setTeamSize(typeof data.team_size === 'number' ? data.team_size : null);
        setRequiredDurationMinutes(
          typeof data.required_duration_minutes === 'number' ? data.required_duration_minutes : null
        );
        setLatestStart(typeof data.latest_start === 'string' ? data.latest_start : null);
        setSuggestion(typeof data.suggestion === 'string' ? data.suggestion : null);
        setNextAvailableDay(typeof data.next_available_day === 'string' ? data.next_available_day : null);
      })
      .catch(() => {
        if (cancelled) return;
        setStatus('error');
        setSlots([]);
        setDurationMinutes(null);
        setTeamSize(null);
        setRequiredDurationMinutes(null);
        setLatestStart(null);
        setSuggestion(null);
        setNextAvailableDay(null);
        setErrorMessage('Could not load availability');
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, key]);

  return {
    status,
    slots,
    durationMinutes,
    teamSize,
    requiredDurationMinutes,
    latestStart,
    suggestion,
    nextAvailableDay,
    errorMessage,
  };
}
