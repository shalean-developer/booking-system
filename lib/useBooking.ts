'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import type { BookingState } from '@/types/booking';

const KEY = 'booking_state_v1';

const initial: BookingState = {
  step: 1,
  service: null,
  bedrooms: 1,
  bathrooms: 1,
  extras: [],
  notes: '',
  date: null,
  time: null,
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: { line1: '', suburb: '', city: '' },
};

/**
 * Custom hook for managing booking state with localStorage persistence
 * Optimized with debounced localStorage writes for better performance
 */
export function useBooking() {
  const [state, setState] = useState<BookingState>(initial);
  const [isLoaded, setIsLoaded] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      try {
        setState(JSON.parse(raw));
      } catch (e) {
        console.error('Failed to parse booking state:', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Debounced save to localStorage (only write after 300ms of no changes)
  useEffect(() => {
    if (isLoaded) {
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set new timeout to save after 300ms
      saveTimeoutRef.current = setTimeout(() => {
        localStorage.setItem(KEY, JSON.stringify(state));
      }, 300);
    }

    // Cleanup timeout on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [state, isLoaded]);

  const next = useCallback(() => {
    // Immediate state update for responsive navigation
    setState((s) => ({ ...s, step: Math.min(5, (s.step + 1)) as any }));
  }, []);

  const back = useCallback(() => {
    // Immediate state update for responsive navigation
    setState((s) => ({ ...s, step: Math.max(1, (s.step - 1)) as any }));
  }, []);

  const reset = useCallback(() => {
    setState(initial);
    localStorage.removeItem(KEY);
  }, []);

  const updateField = useCallback(<K extends keyof BookingState>(
    key: K,
    value: BookingState[K]
  ) => {
    // Immediate state update for all fields for better responsiveness
    setState((s) => ({ ...s, [key]: value }));
  }, []);

  return { state, setState, next, back, reset, updateField, isLoaded };
}

