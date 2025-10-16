'use client';

import { useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useBooking } from '@/lib/useBooking';
import { Stepper } from '@/components/stepper';
import { BookingSummary } from '@/components/booking-summary';
import { StepContact } from '@/components/step-contact';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { ServiceType } from '@/types/booking';

// Helper function to convert URL slug back to ServiceType
function slugToServiceType(slug: string): ServiceType | null {
  const serviceMap: Record<string, ServiceType> = {
    'standard': 'Standard',
    'deep': 'Deep',
    'move-inout': 'Move In/Out',
    'move-in-out': 'Move In/Out',
    'airbnb': 'Airbnb',
  };
  
  return serviceMap[slug] || null;
}

export default function ContactPage() {
  const { state, isLoaded, updateField } = useBooking();
  const params = useParams();
  const slug = params.slug as string;

  // Derive service type from URL slug
  const serviceFromSlug = useMemo(() => slugToServiceType(slug), [slug]);

  // Sync service and step from URL
  useEffect(() => {
    if (!isLoaded || !serviceFromSlug) return;

    // Update service and step to match URL
    if (state.service !== serviceFromSlug) {
      updateField('service', serviceFromSlug);
    }
    if (state.step !== 4) {
      updateField('step', 4);
    }
  }, [isLoaded, serviceFromSlug, state.service, state.step, updateField]);

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

  // If service is invalid or not on step 4, don't render
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
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Schedule
          </Link>
        </div>

        {/* Progress Stepper */}
        <div className="mb-8">
          <Stepper currentStep={state.step} />
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Form */}
          <div className="lg:col-span-2">
            <StepContact />
          </div>

          {/* Right Column - Summary */}
          <div className="lg:col-span-1">
            <BookingSummary />
          </div>
        </div>
      </div>
    </div>
  );
}

