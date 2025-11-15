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
      {/* Debug banner - should always be visible at top */}
      <div className="bg-purple-500 text-white p-4 text-center font-bold text-xl">
        🚨 PAGE IS LOADING - If you see this, the page is working
      </div>
      <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Stepper currentStep={state.currentStep} />
            <StepServiceDetails />
          </div>
          {/* Always visible test - should appear even on mobile */}
          <div className="border-4 border-red-500 p-8 bg-yellow-200 min-h-[300px] md:col-span-1">
            <h2 className="text-2xl font-bold text-red-700 mb-4">🧪 TEST: Grid Column</h2>
            <p className="text-lg text-gray-800 mb-4">This should be visible on ALL screen sizes</p>
            <div className="mt-4 p-4 bg-blue-100 border-2 border-blue-500">
              <p className="font-bold text-blue-700 mb-2">BookingSummaryV2 Component:</p>
              <BookingSummaryV2 />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

