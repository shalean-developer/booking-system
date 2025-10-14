'use client';

import { useEffect, useState } from 'react';
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
 */
export function useBooking() {
  const [state, setState] = useState<BookingState>(initial);
  const [isLoaded, setIsLoaded] = useState(false);

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

  // Save to localStorage on state change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(KEY, JSON.stringify(state));
    }
  }, [state, isLoaded]);

  function next() {
    setState((s) => ({ ...s, step: Math.min(5, (s.step + 1)) as any }));
  }

  function back() {
    setState((s) => ({ ...s, step: Math.max(1, (s.step - 1)) as any }));
  }

  function reset() {
    setState(initial);
    localStorage.removeItem(KEY);
  }

  function updateField<K extends keyof BookingState>(
    key: K,
    value: BookingState[K]
  ) {
    setState((s) => ({ ...s, [key]: value }));
  }

  return { state, setState, next, back, reset, updateField, isLoaded };
}

