'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import type { ServiceType, TeamName } from '@/types/booking';

const KEY = 'booking_state_v2';

export interface BookingStateV2 {
  // Step 1
  service: ServiceType | null;
  
  // Step 2
  bedrooms: number;
  bathrooms: number;
  extras: string[];
  extrasQuantities: Record<string, number>;
  notes: string;
  
  // Step 3
  date: string | null;
  time: string | null;
  frequency: 'one-time' | 'weekly' | 'bi-weekly' | 'monthly';
  
  // Step 4
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: {
    line1: string;
    line2?: string; // Apartment/Unit number
    suburb: string;
    city: string;
  };
  
  // Step 5
  cleaner_id: string | null;
  selected_team: TeamName | null;
  requires_team: boolean;
  tipAmount: number; // Tip amount for cleaner
  
  // Step 6 (handled in review)
  paymentReference: string | null;
  
  // Navigation
  currentStep: number;
}

const initial: BookingStateV2 = {
  service: null,
  bedrooms: 2,
  bathrooms: 1,
  extras: [],
  extrasQuantities: {},
  notes: '',
  date: null,
  time: null,
  frequency: 'one-time',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: {
    line1: '',
    line2: '',
    suburb: '',
    city: '',
  },
  cleaner_id: null,
  selected_team: null,
  requires_team: false,
  tipAmount: 0,
  paymentReference: null,
  currentStep: 1,
};

// Global state instance to ensure all components share the same state
let globalState: BookingStateV2 = initial;
let listeners: Set<() => void> = new Set();
let isInitialized = false;

/**
 * Notify all listeners of state changes
 */
function notifyListeners() {
  listeners.forEach(listener => listener());
}

/**
 * Custom hook for managing booking state V2 with sessionStorage persistence
 * Guest-friendly: No authentication required
 * Uses sessionStorage instead of localStorage (clears on browser close)
 */
export function useBookingV2() {
  const [state, setStateInternal] = useState<BookingStateV2>(globalState);
  const [isLoaded, setIsLoaded] = useState(isInitialized);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Subscribe to global state changes
  useEffect(() => {
    const listener = () => {
      setStateInternal(globalState);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  
  // Wrapper to update both local and global state
  const setState = useCallback((updater: BookingStateV2 | ((prev: BookingStateV2) => BookingStateV2)) => {
    const newState = typeof updater === 'function' ? updater(globalState) : updater;
    globalState = newState;
    setStateInternal(newState);
    notifyListeners();
  }, []);

  // Load from sessionStorage on mount (only once globally)
  useEffect(() => {
    if (!isInitialized) {
      const raw = sessionStorage.getItem(KEY);
      if (raw) {
        try {
          const loadedState = JSON.parse(raw);
          globalState = {
            ...initial,
            ...loadedState,
            extrasQuantities: loadedState.extrasQuantities || {},
            address: loadedState.address || initial.address,
          };
          setStateInternal(globalState);
          isInitialized = true;
          notifyListeners();
        } catch (e) {
          console.error('Failed to parse booking state:', e);
          isInitialized = true;
        }
      } else {
        isInitialized = true;
      }
    }
    setIsLoaded(true);
  }, []);

  // Debounced save to sessionStorage
  useEffect(() => {
    if (isLoaded) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        sessionStorage.setItem(KEY, JSON.stringify(globalState));
      }, 100);
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [state, isLoaded]);

  const updateField = useCallback(<K extends keyof BookingStateV2>(
    key: K,
    value: BookingStateV2[K]
  ) => {
    setState((s) => ({ ...s, [key]: value }));
  }, [setState]);

  const reset = useCallback(() => {
    globalState = initial;
    setState(initial);
    sessionStorage.removeItem(KEY);
    notifyListeners();
  }, [setState]);

  return { state, setState, updateField, reset, isLoaded };
}

