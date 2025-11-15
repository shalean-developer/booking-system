'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { StepScheduleCleaner } from '@/components/booking-v2/step-schedule-cleaner';
import { BookingSummaryV2 } from '@/components/booking-v2/booking-summary';
import { useBookingV2 } from '@/lib/useBookingV2';
import { useBookingPath } from '@/lib/useBookingPath';
import { slugToServiceType } from '@/lib/booking-utils';
export default function SchedulePage() {
  const params = useParams();
  const router = useRouter();
  const { state, updateField } = useBookingV2();
  const { getSelectPath } = useBookingPath();
  const slug = params.slug as string;
  const serviceFromSlug = slugToServiceType(slug);

  useEffect(() => {
    updateField('currentStep', 2);
    if (serviceFromSlug && serviceFromSlug !== state.service) {
      updateField('service', serviceFromSlug);
    }
    if (!state.service) {
      router.push(getSelectPath);
    }
  }, [serviceFromSlug, state.service, updateField, router, getSelectPath]);

  if (!state.service) {
    return null;
  }

  return (
    <div className="mx-auto max-w-7xl mt-8">
      {/* Heading - positioned below stepper, same width as stepper */}
      {state.currentStep === 2 && (
        <div className="mb-8 md:mb-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Schedule & Cleaner
            </h2>
            <p className="text-gray-600">
              Choose your preferred date and time
            </p>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <StepScheduleCleaner />
        </div>
        <div className="md:col-span-1 sticky top-6 md:top-24 self-start h-fit">
          <BookingSummaryV2 />
        </div>
      </div>
    </div>
  );
}

