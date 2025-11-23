'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { StepServiceDetails } from '@/components/booking-v2/step-service-details';
import { BookingSummaryV2 } from '@/components/booking-v2/booking-summary';
import { useBookingV2 } from '@/lib/useBookingV2';
import { slugToServiceType } from '@/lib/booking-utils';
import { Stepper } from '@/components/stepper';

export default function DetailsPage() {
  const params = useParams();
  const { state, updateField } = useBookingV2();
  const slug = params.slug as string;
  const serviceFromSlug = slugToServiceType(slug);

  useEffect(() => {
    updateField('currentStep', 1);
    if (serviceFromSlug && serviceFromSlug !== state.service) {
      updateField('service', serviceFromSlug);
    }
  }, [serviceFromSlug, state.service, updateField]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Stepper currentStep={state.currentStep} />
            <StepServiceDetails />
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

