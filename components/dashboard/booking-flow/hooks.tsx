'use client';

import { useMemo } from 'react';
import { useBookingFormData, type BookingFormData } from '@/lib/useBookingFormData';
import type { FlowService, FlowTimeSlot } from './types';

/** Aligned with `TIME_SLOTS` in `components/booking-step2-schedule.tsx` (ids are HH:MM for API). */
export const DASHBOARD_TIME_SLOTS: FlowTimeSlot[] = [
  { id: '07:00', time: '7:00 AM', available: true },
  { id: '08:00', time: '8:00 AM', available: true },
  { id: '09:00', time: '9:00 AM', available: true },
  { id: '10:00', time: '10:00 AM', available: false },
  { id: '11:00', time: '11:00 AM', available: true },
  { id: '12:00', time: '12:00 PM', available: true },
  { id: '13:00', time: '1:00 PM', available: false },
  { id: '14:00', time: '2:00 PM', available: true },
  { id: '15:00', time: '3:00 PM', available: true },
  { id: '16:00', time: '4:00 PM', available: false },
];

function mapServices(data: BookingFormData | null): FlowService[] {
  if (!data?.services?.length || !data.pricing) return [];
  const pricing = data.pricing.services;
  return [...data.services]
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((s) => {
      const base = pricing[s.type]?.base;
      const price =
        typeof base === 'number' && !Number.isNaN(base) ? `R${Math.round(base)}` : 'R0';
      return {
        id: s.type,
        name: s.label,
        description: s.description || s.subLabel || '',
        duration: 'See checklist',
        price,
      };
    });
}

export function useBookingForm() {
  const { data, loading, error } = useBookingFormData();

  const services = useMemo(() => mapServices(data), [data]);

  return {
    formData: data,
    services,
    timeSlots: DASHBOARD_TIME_SLOTS,
    /** First load of `/api/booking/form-data` (no cached payload yet) */
    isInitialLoading: loading && data == null,
    loadError: error,
  };
}
