'use client';

import { Suspense } from 'react';
import BookingFlow from '@/components/booking-flow';

function BookingFlowWrapper() {
  return <BookingFlow />;
}

export default function BookingPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading booking...</p>
        </div>
      </div>
    }>
      <BookingFlowWrapper />
    </Suspense>
  );
}
