'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBooking } from '@/lib/useBooking';

export default function BookingPage() {
  const { state, isLoaded } = useBooking();
  const router = useRouter();

  // Redirect logic based on current step
  useEffect(() => {
    if (!isLoaded) return;

    if (state.step === 1) {
      router.push('/booking/service/select');
    } else if (state.step >= 2 && state.step <= 5 && state.service) {
      // Redirect to the appropriate step URL based on current step and service
      const serviceTypeToSlug = (serviceType: string) => {
        if (serviceType === 'Move In/Out') {
          return 'move-in-out';
        }
        return serviceType
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '');
      };

      const slug = serviceTypeToSlug(state.service);
      const stepUrls = {
        2: `/booking/service/${slug}/details`,
        3: `/booking/service/${slug}/schedule`,
        4: `/booking/service/${slug}/contact`,
        5: `/booking/service/${slug}/review`,
      };
      
      router.push(stepUrls[state.step as keyof typeof stepUrls] || '/booking/service/select');
    } else {
      // Default to service select if no service or invalid state
      router.push('/booking/service/select');
    }
  }, [isLoaded, state.step, state.service, router]);

  // Show loading while redirecting
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="mt-4 text-sm text-slate-600">Redirecting...</p>
      </div>
    </div>
  );
}
