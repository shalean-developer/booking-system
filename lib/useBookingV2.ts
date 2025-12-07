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
      // Check for template in sessionStorage first
      const templateRaw = sessionStorage.getItem('booking_template');
      if (templateRaw) {
        try {
          const template = JSON.parse(templateRaw);
          // Apply template to booking state
          globalState = {
            ...initial,
            service: template.service_type || null,
            bedrooms: template.bedrooms || 2,
            bathrooms: template.bathrooms || 1,
            extras: template.extras || [],
            extrasQuantities: template.extras_quantities || {},
            notes: template.notes || '',
            frequency: template.frequency || 'one-time',
            address: {
              line1: template.address_line1 || '',
              line2: '',
              suburb: template.address_suburb || '',
              city: template.address_city || '',
            },
            cleaner_id: template.cleaner_id || null,
            selected_team: template.selected_team || null,
            requires_team: template.requires_team || false,
            tipAmount: template.tip_amount ? template.tip_amount / 100 : 0, // Convert cents to rands
            currentStep: 1,
          };
          // Clear template from sessionStorage after loading
          sessionStorage.removeItem('booking_template');
        } catch (e) {
          console.error('Failed to parse booking template:', e);
        }
      }
      
      // Then load regular booking state
      const raw = sessionStorage.getItem(KEY);
      if (raw) {
        try {
          const loadedState = JSON.parse(raw);
          globalState = {
            ...globalState,
            ...loadedState,
            extrasQuantities: loadedState.extrasQuantities || {},
            address: loadedState.address || globalState.address,
          };
        } catch (e) {
          console.error('Failed to parse booking state:', e);
        }
      }
      
      setStateInternal(globalState);
      isInitialized = true;
      notifyListeners();
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

