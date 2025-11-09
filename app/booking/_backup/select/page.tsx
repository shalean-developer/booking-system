'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBooking } from '@/lib/useBooking';
import { Stepper } from '@/components/stepper';
import { BookingSummary } from '@/components/booking-summary';
import { StepService } from '@/components/step-service';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { ServiceType } from '@/types/booking';

export default function ServiceSelectPage() {
  const { state, isLoaded, updateField } = useBooking();
  const router = useRouter();
  const handleServiceSelect = (serviceType: ServiceType) => {
    updateField('service', serviceType);
  };

  // Ensure user is on step 1, or reset to step 1
  useEffect(() => {
    if (isLoaded && state.step !== 1) {
      // If user somehow ends up here on a different step, reset to step 1
      // This shouldn't happen with proper navigation, but provides a safeguard
      router.push('/booking/service/select');
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
        <Stepper currentStep={state.step} />

        {/* Main Content */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
          {/* Step Content */}
          <div className="min-h-[420px]">
            <StepService selectedService={state.service} onSelect={handleServiceSelect} />
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
