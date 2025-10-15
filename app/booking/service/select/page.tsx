'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useBooking } from '@/lib/useBooking';
import { Stepper } from '@/components/stepper';
import { BookingSummary } from '@/components/booking-summary';
import { StepService } from '@/components/step-service';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { ServiceType } from '@/types/booking';

// Helper function to convert ServiceType to URL slug (same as in StepService)
function serviceTypeToSlug(serviceType: ServiceType): string {
  // Handle "Move In/Out" special case first
  if (serviceType === 'Move In/Out') {
    return 'move-in-out';
  }
  
  return serviceType
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export default function ServiceSelectPage() {
  const { state, isLoaded, next } = useBooking();
  const router = useRouter();

  // Enhanced next function that navigates to service-specific details URL
  const handleNext = useCallback(() => {
    if (state.service) {
      const slug = serviceTypeToSlug(state.service);
      next(); // Update step to 2 in state
      router.push(`/booking/service/${slug}/details`);
    }
  }, [state.service, next, router]);

  // Redirect to main booking page if not on step 1
  useEffect(() => {
    if (isLoaded && state.step !== 1) {
      router.push('/booking');
    }
  }, [isLoaded, state.step, router]);

  // Wait for localStorage to load
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </div>
    );
  }

  // If not on step 1, don't render this page yet
  if (state.step !== 1) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-6">
      <div className="mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-slate-900">Book Your Cleaning</h1>
        </div>

        {/* Stepper */}
        <Stepper current={state.step} total={5} />

        {/* Main Content */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
          {/* Step Content with Animation */}
          <div className="min-h-[420px]">
            <StepService onNext={handleNext} />
          </div>

          {/* Sticky Summary (Desktop) */}
          <div className="hidden lg:block">
            <BookingSummary />
          </div>
        </div>
      </div>
    </div>
  );
}
