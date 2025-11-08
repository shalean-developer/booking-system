"use client";

import { useEffect } from 'react';
import { useBooking } from '@/lib/useBooking';
import { StepService } from '@/components/step-service';
import { BookingFooter } from '@/components/booking-footer';

export function ServiceSelectContent() {
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
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="py-6 lg:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Page Heading */}
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 text-center">Book a Cleaning Service Online</h1>
          
          {/* Main Content Grid */}
          <div className="grid grid-cols-12 gap-6 pb-24 lg:pb-8">
            {/* Main Column - Service Selection (Full width on step 1) */}
            <div className="col-span-12">
              <StepService />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <BookingFooter />
    </div>
  );
}

