'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { StepContact } from '@/components/booking-v2/step-contact';
import { useBookingV2 } from '@/lib/useBookingV2';
import { useBookingPath } from '@/lib/useBookingPath';
import { slugToServiceType } from '@/lib/booking-utils';

export default function ContactPage() {
  const params = useParams();
  const router = useRouter();
  const { state, updateField } = useBookingV2();
  const { getSelectPath } = useBookingPath();
  const slug = params.slug as string;
  const serviceFromSlug = slugToServiceType(slug);

  useEffect(() => {
    updateField('currentStep', 3);
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
    <>
      {/* Heading - positioned below stepper, same width as stepper */}
      {state.currentStep === 3 && (
        <div className="mb-8 md:mb-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Contact & Address
            </h2>
            <p className="text-gray-600">
              Please provide your contact information and address
            </p>
          </div>
        </div>
      )}
      
      <StepContact />
    </>
  );
}

