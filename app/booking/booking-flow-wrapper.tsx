'use client';

import { useRouter } from 'next/navigation';
import { BookingSystem } from '@/components/booking-system';
import type { BookingFormData } from '@/lib/useBookingFormData';

// Map URL slugs to BookingSystem ServiceType
const SLUG_TO_SERVICE: Record<string, 'standard' | 'deep' | 'move' | 'airbnb' | 'carpet'> = {
  standard: 'standard',
  deep: 'deep',
  'move-in-out': 'move',
  airbnb: 'airbnb',
  carpet: 'carpet',
};

interface BookingFlowWrapperProps {
  initialFormData?: BookingFormData | null;
  initialServiceSlug?: string;
}

export function BookingFlowWrapper({ initialFormData, initialServiceSlug }: BookingFlowWrapperProps) {
  const router = useRouter();
  const initialService = initialServiceSlug ? SLUG_TO_SERVICE[initialServiceSlug] : undefined;
  return (
    <BookingSystem
      initialFormData={initialFormData}
      initialService={initialService}
      onNavigateContact={() => router.push('/contact')}
    />
  );
}
