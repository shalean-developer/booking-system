'use client';

import { useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useBooking } from '@/lib/useBooking';
import { StepReview } from '@/components/step-review';
import { BookingFooter } from '@/components/booking-footer';
import type { ServiceType } from '@/types/booking';

import { slugToServiceType } from '@/lib/booking-utils';

export default function ReviewPage() {
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
    // Step 6 is Review (fixes error #4 - step number is correct)
    if (state.step !== 6) {
      updateField('step', 6);
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

  // If service is invalid or not on step 6, don't render
  if (!serviceFromSlug || state.step !== 6) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <div className="py-6 lg:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Main Content - Full Width */}
          <div className="pb-24 lg:pb-8">
            <div className="max-w-4xl mx-auto">
              <StepReview />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <BookingFooter />
    </div>
  );
}

