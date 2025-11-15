'use client';

import { useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useBooking } from '@/lib/useBooking';
import { BookingSummary } from '@/components/booking-summary';
import { StepSelectCleaner } from '@/components/step-select-cleaner';
import { slugToServiceType } from '@/lib/booking-utils';

export default function SelectCleanerPage() {
  const { state, isLoaded, updateField } = useBooking();
  const params = useParams();
  const slug = params.slug as string;

  // Derive service type from URL slug
  const serviceFromSlug = useMemo(() => slugToServiceType(slug), [slug]);

  // Sync service and step from URL
  useEffect(() => {
    if (!isLoaded || !serviceFromSlug) return;

    // Update service and step to match URL
    if (state.service !== serviceFromSlug) {
      updateField('service', serviceFromSlug);
    }
    if (state.step !== 5) {
      updateField('step', 5);
    }
  }, [isLoaded, serviceFromSlug, state.service, state.step, updateField]);

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

  // If service is invalid or not on step 5, don't render
  if (!serviceFromSlug || state.step !== 5) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-6 lg:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Main Content Grid */}
        <div className="grid grid-cols-12 gap-6 pb-24 lg:pb-8">
          {/* Main Column - Cleaner Selection */}
          <div className="col-span-12 lg:col-span-8">
            <StepSelectCleaner />
          </div>

          {/* Right Column - Booking Summary (Desktop Only) */}
          <div className="col-span-12 lg:col-span-4">
            <BookingSummary />
          </div>
        </div>
      </div>
    </div>
  );
}
