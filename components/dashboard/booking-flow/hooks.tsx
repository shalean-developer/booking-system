'use client';

import { useMemo } from 'react';
import { useBookingFormData, type BookingFormData } from '@/lib/useBookingFormData';
import { BOOKING_TIME_SLOT_DEFS } from '@/lib/booking-time-slots';
import type { FlowService, FlowTimeSlot } from './types';

/** Aligned with `BOOKING_TIME_SLOT_DEFS` (ids are HH:MM for API). */
export const DASHBOARD_TIME_SLOT_DEFS: Pick<FlowTimeSlot, 'id' | 'time'>[] = BOOKING_TIME_SLOT_DEFS.map(
  (d) => ({
    id: d.id,
    time: d.label,
  })
);

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
    timeSlotDefs: DASHBOARD_TIME_SLOT_DEFS,
    /** First load of `/api/booking/form-data` (no cached payload yet) */
    isInitialLoading: loading && data == null,
    loadError: error,
  };
}
