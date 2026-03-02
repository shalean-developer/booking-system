'use client';

import { useParams } from 'next/navigation';
import { Suspense } from 'react';
import { BookingFlowWrapper } from '@/app/booking/booking-flow-wrapper';

function ServiceBookingContent() {
  const params = useParams();
  const serviceType = typeof params?.serviceType === 'string' ? params.serviceType : null;

  if (!serviceType) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-slate-600">Invalid booking URL.</p>
      </div>
    );
  }

  return <BookingFlowWrapper initialServiceSlug={serviceType} />;
}

export default function ServiceBookingStepPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
            <p className="mt-4 text-slate-600">Loading booking...</p>
          </div>
        </div>
      }
    >
      <ServiceBookingContent />
    </Suspense>
  );
}
