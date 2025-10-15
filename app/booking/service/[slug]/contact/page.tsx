'use client';

import { useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useBooking } from '@/lib/useBooking';
import { Stepper } from '@/components/stepper';
import { BookingSummary } from '@/components/booking-summary';
import { StepContact } from '@/components/step-contact';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { ServiceType } from '@/types/booking';

// Helper function to convert URL slug back to ServiceType
function slugToServiceType(slug: string): ServiceType | null {
  const serviceMap: Record<string, ServiceType> = {
    'standard': 'Standard',
    'deep': 'Deep',
    'move-inout': 'Move In/Out',
    'move-in-out': 'Move In/Out', // Alternative format
    'airbnb': 'Airbnb',
  };
  
  return serviceMap[slug] || null;
}

export default function ContactPage() {
  const { state, isLoaded, updateField } = useBooking();
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  // Derive service type from URL slug
  const serviceFromSlug = useMemo(() => slugToServiceType(slug), [slug]);

  // Ensure we're on step 4 and have the correct service selected
  useEffect(() => {
    if (!isLoaded || !serviceFromSlug) return;

    // If no service is selected or wrong service is selected, update it
    if (state.service !== serviceFromSlug) {
      updateField('service', serviceFromSlug);
    }

    // If not on step 4, redirect to the correct step
    if (state.step !== 4) {
      if (state.step === 1) {
        // Redirect back to service select
        router.push('/booking/service/select');
      } else if (state.step === 2) {
        // Redirect to details page
        router.push(`/booking/service/${slug}/details`);
      } else if (state.step === 3) {
        // Redirect to schedule page
        router.push(`/booking/service/${slug}/schedule`);
      } else if (state.step === 5) {
        // Redirect to review page
        router.push(`/booking/service/${slug}/review`);
      } else {
        // For other steps, redirect to service select
        router.push('/booking/service/select');
      }
    }
  }, [isLoaded, serviceFromSlug, state.service, state.step, updateField, router, slug]);

  // Wait for localStorage to load
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </div>
    );
  }

  // If no valid service from slug or not on step 4, don't render yet (will redirect)
  if (!serviceFromSlug || state.step !== 4) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/booking/service/${slug}/schedule`}
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Schedule
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-slate-900">Book Your Cleaning</h1>
        </div>

        {/* Stepper */}
        <Stepper current={state.step} total={5} />

        {/* Main Content */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
          {/* Step Content with Animation */}
          <AnimatePresence mode="wait">
            <motion.div
              key={state.step}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="min-h-[420px]"
            >
              <StepContact />
            </motion.div>
          </AnimatePresence>

          {/* Sticky Summary (Desktop) */}
          <div className="hidden lg:block">
            <BookingSummary />
          </div>
        </div>

        {/* Mobile Summary Sheet - triggered from BookingSummary component */}
      </div>
    </div>
  );
}
