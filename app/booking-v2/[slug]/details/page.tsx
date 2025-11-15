'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { StepServiceDetails } from '@/components/booking-v2/step-service-details';
import { BookingSummaryV2 } from '@/components/booking-v2/booking-summary';
import { useBookingV2 } from '@/lib/useBookingV2';
import { slugToServiceType } from '@/lib/booking-utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { calcTotalSync } from '@/lib/pricing';
import { Receipt } from 'lucide-react';
export default function DetailsPage() {
  const params = useParams();
  const { state, updateField } = useBookingV2();
  const slug = params.slug as string;
  const serviceFromSlug = slugToServiceType(slug);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  useEffect(() => {
    updateField('currentStep', 1);
    if (serviceFromSlug && serviceFromSlug !== state.service) {
      updateField('service', serviceFromSlug);
    }
  }, [serviceFromSlug, state.service, updateField]);

  // Calculate total for mobile footer
  const pricingDetails = useMemo(() => {
    if (!state.service) {
      return { total: 0 };
    }
    return calcTotalSync(
      {
        service: state.service,
        bedrooms: state.bedrooms || 0,
        bathrooms: state.bathrooms || 0,
        extras: state.extras || [],
        extrasQuantities: state.extrasQuantities || {},
      },
      state.frequency || 'one-time'
    );
  }, [state.service, state.bedrooms, state.bathrooms, state.extras, state.extrasQuantities, state.frequency]);

  const total = pricingDetails.total || 0;

  // Format total consistently to avoid hydration mismatch
  const formatTotal = (value: number) => {
    return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  return (
    <>
      {/* Heading - positioned below stepper, same width as stepper */}
      {state.currentStep === 1 && (
        <div className="mb-8 md:mb-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Choose your cleaning service
            </h2>
            <p className="text-gray-600">
              Select the type of cleaning service you need
            </p>
          </div>
        </div>
      )}
      
      {/* Main content with grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-20 md:pb-0">
        <div className="md:col-span-2">
          <StepServiceDetails />
        </div>
        <div className="hidden md:block md:col-span-1 sticky top-6 md:top-24 self-start h-fit">
          <BookingSummaryV2 />
        </div>
      </div>

      {/* Mobile Footer - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-gray-200 shadow-lg md:hidden z-40">
        <div className="flex items-center justify-between px-4 h-full">
          <div className="flex flex-col">
            <span className="text-xs text-gray-600">Total</span>
            <span className="text-xl font-bold text-gray-900">
              R{formatTotal(total)}
            </span>
          </div>
          <button
            onClick={() => setIsSheetOpen(true)}
            className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-white hover:bg-primary/90 transition-colors"
            aria-label="View booking summary"
          >
            <Receipt className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Sheet with Booking Summary for Mobile */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Booking Summary</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <BookingSummaryV2 />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
