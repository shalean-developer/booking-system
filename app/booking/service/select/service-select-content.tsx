"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Info, Phone } from 'lucide-react';
import { useBooking } from '@/lib/useBooking';
import { StepService } from '@/components/step-service';
import { BookingFooter } from '@/components/booking-footer';
import { Button } from '@/components/ui/button';
import type { ServiceType } from '@/types/booking';

function serviceTypeToSlug(serviceType: ServiceType): string {
  if (serviceType === 'Move In/Out') {
    return 'move-in-out';
  }

  return serviceType
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export function ServiceSelectContent() {
  const router = useRouter();
  const { state, isLoaded, updateField } = useBooking();
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
  const hasExistingSelection = useMemo(() => Boolean(state.service), [state.service]);

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
    setSelectedService(serviceType);
    updateField('service', serviceType);
  }, [updateField]);

  const handleContinue = useCallback(() => {
    if (!selectedService) return;

    const slug = serviceTypeToSlug(selectedService);
    updateField('step', 2);
    router.push(`/booking/service/${slug}/details`);
  }, [router, selectedService, updateField]);

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
      <div className="py-8 lg:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <header className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl space-y-4 text-center lg:text-left">
              <span className="inline-flex items-center justify-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                Step 1 · Service Setup
              </span>
              <div className="space-y-3">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
                  Book the right clean for your home
                </h1>
                <p className="text-base text-slate-600 md:text-lg">
                  Start by choosing the type of clean you need. We’ll tailor the checklist, timing, and price so you only pay for what matters.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-slate-600 lg:justify-start">
                <span className="inline-flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  Trusted, vetted cleaners
                </span>
                <span className="inline-flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  No hidden fees
                </span>
                <span className="inline-flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  Flexible rescheduling
                </span>
              </div>
            </div>

            <aside className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm">
              <div className="flex items-start gap-3">
                <Info className="mt-1 h-5 w-5 text-primary" aria-hidden="true" />
                <div className="space-y-2 text-sm text-slate-600">
                  <p className="font-semibold text-slate-900">Need help choosing?</p>
                  <p>
                    Tell us about your space and we’ll point you to the right service in a quick call or chat.
                  </p>
                  <div className="flex flex-col gap-2 text-sm">
                    <Link href="/contact" className="inline-flex items-center gap-2 text-primary hover:text-primary/80">
                      <Phone className="h-4 w-4" />
                      Talk to our team
                    </Link>
                    <span className="text-xs text-slate-500">
                      Available Monday to Saturday, 8am – 6pm.
                    </span>
                  </div>
                </div>
              </div>
            </aside>
          </header>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)]">
            <StepService selectedService={selectedService} onSelect={handleSelect} />

            <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-dashed border-primary/20 bg-primary/5 p-4 text-center md:flex-row md:text-left">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-900">
                  {selectedService ? `${selectedService} cleaning selected` : 'Select a service to continue'}
                </p>
                <p className="text-sm text-slate-600">
                  {selectedService
                    ? 'Next up: customise the checklist, add extras and confirm the schedule.'
                    : hasExistingSelection
                      ? 'We saved your previous choice — tap a card to confirm and continue.'
                      : 'Your choice helps us tailor the rest of the booking to your needs.'}
                </p>
              </div>
              <Button
                size="lg"
                className="w-full md:w-auto"
                onClick={handleContinue}
                disabled={!selectedService}
              >
                Continue to details
              </Button>
            </div>
          </div>
        </div>
      </div>

      <BookingFooter />
    </div>
  );
}

