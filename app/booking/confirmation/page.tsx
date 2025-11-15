'use client';

import { Suspense } from 'react';
import BookingV2ConfirmationPage from '@/app/booking-v2/confirmation/page';
import { Loader2 } from 'lucide-react';

// Render new booking-v2 confirmation while preserving old URL
export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <BookingV2ConfirmationPage />
    </Suspense>
  );
}
