'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useBookingV2 } from '@/lib/useBookingV2';
import { useBookingPath } from '@/lib/useBookingPath';
import { slugToServiceType } from '@/lib/booking-utils';

// Redirect to schedule page (combined step)
export default function CleanerPage() {
  const params = useParams();
  const router = useRouter();
  const { state } = useBookingV2();
  const { getSchedulePath } = useBookingPath();
  const slug = params.slug as string;
  const serviceFromSlug = slugToServiceType(slug);

  useEffect(() => {
    // Redirect to schedule page where cleaner selection is now combined
    const service = serviceFromSlug || state.service;
    if (service) {
      router.replace(getSchedulePath(service));
    } else {
      router.replace('/booking-v2/select');
    }
  }, [serviceFromSlug, state.service, router, getSchedulePath]);

  return null;
}

