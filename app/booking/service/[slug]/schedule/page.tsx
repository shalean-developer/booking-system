'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { StepScheduleCleaner } from '@/components/booking-v2/step-schedule-cleaner';
import { BookingSummaryV2 } from '@/components/booking-v2/booking-summary';
import { useBookingV2 } from '@/lib/useBookingV2';
import { useBookingPath } from '@/lib/useBookingPath';
import { slugToServiceType } from '@/lib/booking-utils';
import { Stepper } from '@/components/stepper';

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
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Stepper currentStep={state.currentStep} />
            <StepScheduleCleaner />
          </div>
          <div className="md:col-span-1">
            <div className="hidden md:block">
              <BookingSummaryV2 />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

