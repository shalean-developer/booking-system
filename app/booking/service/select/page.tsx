'use client';

import { useEffect } from 'react';
import { useBooking } from '@/lib/useBooking';
import { Stepper } from '@/components/stepper';
import { BookingSummary } from '@/components/booking-summary';
import { StepService } from '@/components/step-service';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function ServiceSelectPage() {
  const { state, isLoaded, updateField } = useBooking();

  // Set step to 1 when this page loads
  useEffect(() => {
    if (isLoaded && state.step !== 1) {
      updateField('step', 1);
    }
  }, [isLoaded, state.step, updateField]);

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

  // If not on step 1, don't render
  if (state.step !== 1) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>

        {/* Progress Stepper */}
        <div className="mb-8">
          <Stepper currentStep={state.step} />
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3 pb-24 lg:pb-0">
          {/* Left Column - Form */}
          <div className="lg:col-span-2">
            <StepService />
          </div>

          {/* Right Column - Summary */}
          <div className="lg:col-span-1">
            <BookingSummary />
          </div>
        </div>
      </div>
    </div>
  );
}

