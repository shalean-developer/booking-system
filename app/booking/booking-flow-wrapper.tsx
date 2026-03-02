'use client';

import { useRouter } from 'next/navigation';
import { BookingSystem } from '@/components/booking-system';
import type { BookingFormData } from '@/lib/useBookingFormData';

interface BookingFlowWrapperProps {
  initialFormData?: BookingFormData | null;
}

export function BookingFlowWrapper({ initialFormData }: BookingFlowWrapperProps) {
  const router = useRouter();
  return (
    <BookingSystem
      initialFormData={initialFormData}
      onNavigateContact={() => router.push('/contact')}
    />
  );
}
