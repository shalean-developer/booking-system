'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBookingV2 } from '@/lib/useBookingV2';
import { useBookingPath } from '@/lib/useBookingPath';

// Redirect to details page (combined step)
export default function ServiceSelectPage() {
  const router = useRouter();
  const { state } = useBookingV2();
  const { getDetailsPath } = useBookingPath();

  useEffect(() => {
    // If service is already selected, redirect to details page with slug
    if (state.service) {
      router.replace(getDetailsPath(state.service));
    } else {
      // If no service selected, redirect to a default details page (will show service selection)
      // Use 'standard' as default slug
      router.replace('/booking/service/standard/details');
    }
  }, [state.service, router, getDetailsPath]);

  return null;
}
