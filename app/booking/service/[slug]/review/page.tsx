'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { StepReview } from '@/components/booking-v2/step-review';
import { useBookingV2 } from '@/lib/useBookingV2';
import { useBookingPath } from '@/lib/useBookingPath';
import { slugToServiceType } from '@/lib/booking-utils';
import { Stepper } from '@/components/stepper';

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const { state, updateField } = useBookingV2();
  const { getSelectPath } = useBookingPath();
  const slug = params.slug as string;
  const serviceFromSlug = slugToServiceType(slug);

  useEffect(() => {
    updateField('currentStep', 4);
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
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          <Stepper currentStep={state.currentStep} />
          <StepReview />
        </div>
      </div>
    </div>
  );
}

