'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import type { BookingState } from '@/types/booking';

const KEY = 'booking_state_v1';

const initial: BookingState = {
  step: 1,
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
  address: { line1: '', suburb: '', city: '' },
  cleaner_id: undefined,
};

// Global state instance to ensure all components share the same state
let globalState: BookingState = initial;
let listeners: Set<() => void> = new Set();
let isInitialized = false;

/**
 * Notify all listeners of state changes
 */
function notifyListeners() {
  listeners.forEach(listener => listener());
}

/**
 * Custom hook for managing booking state with localStorage persistence
 * Optimized with debounced localStorage writes for better performance
 * Now uses a singleton state pattern to ensure all components see the same state
 */
export function useBooking() {
  const [state, setStateInternal] = useState<BookingState>(globalState);
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
  const setState = useCallback((updater: BookingState | ((prev: BookingState) => BookingState)) => {
    const newState = typeof updater === 'function' ? updater(globalState) : updater;
    globalState = newState;
    setStateInternal(newState);
    notifyListeners();
  }, []);

  // Load from localStorage on mount (only once globally)
  useEffect(() => {
    if (!isInitialized) {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        try {
          const loadedState = JSON.parse(raw);
          console.log('📦 Loading state from localStorage:', loadedState);
          globalState = {
            ...initial,
            ...loadedState,
            extrasQuantities: loadedState.extrasQuantities || {},
          };
          // Update local state immediately and notify all listeners
          setStateInternal(globalState);
          // Set initialized flag before notifying to avoid re-initialization
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

  // Debounced save to localStorage (only write after 100ms of no changes)
  useEffect(() => {
    if (isLoaded) {
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set new timeout to save after 100ms (reduced for better responsiveness)
      saveTimeoutRef.current = setTimeout(() => {
        console.log('💾 Saving state to localStorage:', globalState);
        localStorage.setItem(KEY, JSON.stringify(globalState));
      }, 100);
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
    setState((s) => ({ ...s, step: Math.min(6, (s.step + 1)) as any }));
  }, [setState]);

  const back = useCallback(() => {
    // Immediate state update for responsive navigation
    setState((s) => ({ ...s, step: Math.max(1, (s.step - 1)) as any }));
  }, [setState]);

  const reset = useCallback(() => {
    globalState = initial;
    setState(initial);
    localStorage.removeItem(KEY);
    notifyListeners();
  }, [setState]);

  const updateField = useCallback(<K extends keyof BookingState>(
    key: K,
    value: BookingState[K]
  ) => {
    console.log('🔄 updateField called:', key, '=', value);
    console.log('📝 Current globalState before update:', globalState);
    // Immediate state update for all fields for better responsiveness
    setState((s) => {
      const newState = { ...s, [key]: value };
      console.log('📝 New state after update:', newState);
      return newState;
    });
  }, [setState]);

  return { state, setState, next, back, reset, updateField, isLoaded };
}

