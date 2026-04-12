'use client';

import { useMemo } from 'react';
import { useBookingFormData, type BookingFormData } from '@/lib/useBookingFormData';
import type { FlowCleaner, FlowExtra, FlowService, FlowTimeSlot } from './types';

const FALLBACK_SERVICES: FlowService[] = [
  {
    id: 'Standard',
    name: 'Standard Clean',
    description: 'Regular maintenance cleaning for your home',
    duration: '2–3 hrs',
    price: 'R225',
  },
  {
    id: 'Deep',
    name: 'Deep Clean',
    description: 'Detailed top-to-bottom clean',
    duration: '4–5 hrs',
    price: 'R380',
  },
  {
    id: 'Airbnb',
    name: 'Airbnb Turnover',
    description: 'Fast turnaround for guests',
    duration: '2–4 hrs',
    price: 'R290',
  },
];

const FALLBACK_CLEANERS: FlowCleaner[] = [
  {
    id: 'c1',
    name: 'Thandiwe M.',
    initial: 'T',
    specialty: 'Standard & deep cleans',
    rating: '4.9',
    reviews: '128',
  },
  {
    id: 'c2',
    name: 'Nompumelelo K.',
    initial: 'N',
    specialty: 'Move-out specialist',
    rating: '4.8',
    reviews: '96',
  },
  {
    id: 'c3',
    name: 'Zanele D.',
    initial: 'Z',
    specialty: 'Airbnb & quick turns',
    rating: '5.0',
    reviews: '84',
  },
];

const FALLBACK_SLOTS: FlowTimeSlot[] = [
  { id: 'ts-08', time: '08:00', available: true },
  { id: 'ts-09', time: '09:00', available: true },
  { id: 'ts-10', time: '10:00', available: false },
  { id: 'ts-11', time: '11:00', available: true },
  { id: 'ts-12', time: '12:00', available: true },
  { id: 'ts-14', time: '14:00', available: true },
  { id: 'ts-15', time: '15:00', available: true },
  { id: 'ts-16', time: '16:00', available: false },
];

const FALLBACK_EXTRAS: FlowExtra[] = [
  { id: 'extra-fridge', name: 'Inside Fridge', price: '+R60' },
  { id: 'extra-oven', name: 'Inside Oven', price: '+R80' },
  { id: 'extra-windows', name: 'Interior Windows', price: '+R120' },
];

function mapServices(data: BookingFormData | null): FlowService[] {
  if (!data?.services?.length) return FALLBACK_SERVICES;
  const pricing = data.pricing?.services;
  return [...data.services]
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((s) => {
      const base = pricing?.[s.type]?.base;
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

function mapExtras(data: BookingFormData | null): FlowExtra[] {
  if (!data?.extras?.all?.length) return FALLBACK_EXTRAS;
  const prices = data.extras.prices || {};
  return data.extras.all.map((name, idx) => {
    const n = name.trim();
    const p = prices[n] ?? 0;
    const slug = n.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'extra';
    return {
      id: `extra-${idx}-${slug}`,
      name: n,
      price: `+R${Math.round(p)}`,
    };
  });
}

export function useBookingForm() {
  const { data, loading } = useBookingFormData();

  const services = useMemo(() => mapServices(data), [data]);
  const extras = useMemo(() => mapExtras(data), [data]);
  const cleaners = FALLBACK_CLEANERS;
  const timeSlots = FALLBACK_SLOTS;

  return {
    services,
    cleaners,
    timeSlots,
    extras,
    /** First load of `/api/booking/form-data` (no cached payload yet) */
    isInitialLoading: loading && data == null,
  };
}
