"use client";

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBooking } from '@/lib/useBooking';
import { StepService } from '@/components/step-service';
import { BookingFooter } from '@/components/booking-footer';
import { ChecklistModal } from '@/components/checklist-modal';
import type { ServiceType } from '@/types/booking';

import { serviceTypeToSlug } from '@/lib/booking-utils';

export function ServiceSelectContent() {
  const router = useRouter();
  const { state, isLoaded, updateField } = useBooking();
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
  const [showChecklist, setShowChecklist] = useState(false);

  // Set step to 1 when this page loads
  useEffect(() => {
    if (isLoaded && state.step !== 1) {
      updateField('step', 1);
    }
  }, [isLoaded, state.step, updateField]);

  useEffect(() => {
    if (isLoaded) {
      setSelectedService(state.service);
    }
  }, [isLoaded, state.service]);

  const handleSelect = useCallback((serviceType: ServiceType) => {
    // Update state and navigate immediately
    setSelectedService(serviceType);
    updateField('service', serviceType);
    updateField('step', 2);
    
    // Navigate immediately to details page
    const slug = serviceTypeToSlug(serviceType);
    router.push(`/booking/service/${slug}/details`);
  }, [router, updateField]);

  // Wait for localStorage to load
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" aria-hidden="true"></div>
          <p className="mt-4 text-sm text-slate-500">Loading your booking preferences…</p>
        </div>
      </div>
    );
  }

  // If not on step 1, don't render
  if (state.step !== 1) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="py-8 md:py-12">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          {/* Header */}
          <header className="mb-12 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
              Choose your service
            </h1>
          </header>

          {/* Service Cards */}
          <div className="mb-12">
            <StepService selectedService={selectedService} onSelect={handleSelect} />
          </div>
        </div>
      </div>

      <BookingFooter onShowChecklist={() => setShowChecklist(true)} />
      
      {/* Checklist Modal */}
      <ChecklistModal 
        isOpen={showChecklist}
        onClose={() => setShowChecklist(false)}
        selectedService={selectedService}
      />
    </div>
  );
}

