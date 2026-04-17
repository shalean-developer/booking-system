'use client';

import { useCallback, useMemo, useState } from 'react';
import type { BookingFormData as ApiBookingFormData } from '@/lib/useBookingFormData';
import type { ServiceType } from '@/types/booking';
import type { BookingEngineState, BookingServiceInfo } from './types';
import { calculateBooking } from './calculate';

const defaultState = (): BookingEngineState => ({
  service: null,
  bedrooms: 2,
  bathrooms: 2,
  extraRooms: 0,
  selectedExtraIds: [],
  provideEquipment: false,
  date: '',
  time: '',
  cleaner_id: null,
});

/** Customer dashboard book flow — slim cart aligned with API `ServiceType`. */
export function useDashboardBooking(options: {
  formData: ApiBookingFormData | null;
  initial?: Partial<BookingEngineState>;
}) {
  const { formData } = options;
  const [state, setState] = useState<BookingEngineState>(() => ({
    ...defaultState(),
    ...options.initial,
  }));

  const carpetDetails = useMemo(() => {
    if (state.service?.id !== 'Carpet') return null;
    return {
      hasFittedCarpets: state.bedrooms > 0,
      hasLooseCarpets: state.bathrooms > 0,
      numberOfRooms: Math.max(0, state.bedrooms),
      numberOfLooseCarpets: Math.max(0, state.bathrooms),
      roomStatus: 'empty' as const,
    };
  }, [state.service?.id, state.bedrooms, state.bathrooms]);

  const linePricing = useMemo(() => {
    if (!formData?.pricing || !state.service) return null;
    const svc = state.service.id;
    return calculateBooking({
      pricing: formData.pricing,
      catalogAllNames: formData.extras.all,
      service: svc,
      bedrooms: state.bedrooms,
      bathrooms: state.bathrooms,
      extraRooms: svc === 'Carpet' ? 0 : state.extraRooms,
      selectedExtraIds: state.selectedExtraIds,
      frequency: 'one-time',
      carpetDetails,
      provideEquipment:
        (svc === 'Standard' || svc === 'Airbnb') && state.provideEquipment,
      equipmentChargeOverride: formData.equipment?.charge,
      numberOfCleaners: 1,
    });
  }, [formData, state, carpetDetails]);

  const total = linePricing?.total ?? 0;

  const setService = useCallback((service: BookingServiceInfo | null) => {
    setState((s) => ({
      ...s,
      service,
      selectedExtraIds: [],
      provideEquipment: false,
      cleaner_id: null,
    }));
  }, []);

  return {
    state,
    setState,
    setService,
    linePricing,
    total,
    carpetDetails,
  };
}

export function bookingServiceInfo(
  formData: ApiBookingFormData,
  serviceId: string,
  label: string
): BookingServiceInfo {
  const base = formData.pricing?.services[serviceId as ServiceType]?.base ?? 0;
  return {
    id: serviceId as ServiceType,
    name: label,
    base_price: Math.round(base),
  };
}
