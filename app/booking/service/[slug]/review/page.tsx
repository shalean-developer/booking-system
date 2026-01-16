'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { StepReview } from '@/components/booking-v2/step-review';
import { useBookingV2 } from '@/lib/useBookingV2';
import { useBookingPath } from '@/lib/useBookingPath';
import { slugToServiceType } from '@/lib/booking-utils';

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const { state, updateField } = useBookingV2();
  const { getSelectPath, getSchedulePath } = useBookingPath();
  const slug = params.slug as string;
  const serviceFromSlug = slugToServiceType(slug);

  useEffect(() => {
    updateField('currentStep', 4);
    if (serviceFromSlug && serviceFromSlug !== state.service) {
      updateField('service', serviceFromSlug);
    }
    if (!state.service) {
      router.push(getSelectPath);
      return;
    }
    
    // Check if date/time are missing - redirect to worker/schedule page
    if (!state.date || !state.time) {
      if (state.service) {
        router.push(getSchedulePath(state.service));
      } else {
        router.push(getSelectPath);
      }
      return;
    }
    // Contact info can be filled on this page, so no redirect needed
  }, [serviceFromSlug, state.service, state.date, state.time, updateField, router, getSelectPath, getSchedulePath]);

  if (!state.service) {
    return null;
  }

  // The new StepReview component has its own full-page layout with header, footer, and step indicator
  return <StepReview />;
}

