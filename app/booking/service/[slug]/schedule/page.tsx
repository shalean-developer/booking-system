'use client';

import { useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useBooking } from '@/lib/useBooking';
import { BookingSummary } from '@/components/booking-summary';
import { StepSchedule } from '@/components/step-schedule';
import { motion } from 'framer-motion';
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

export default function SchedulePage() {
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
    if (state.step !== 3) {
      updateField('step', 3);
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

  // If service is invalid or not on step 3, don't render
  if (!serviceFromSlug || state.step !== 3) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-6 lg:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <Link 
            href={`/booking/service/${slug}/details`}
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Details
          </Link>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-12 gap-6 pb-24 lg:pb-8">
          {/* Main Column - Schedule Form */}
          <div className="col-span-12 lg:col-span-8">
            <StepSchedule />
          </div>

          {/* Right Column - Booking Summary (Desktop Only) */}
          <div className="col-span-12 lg:col-span-4">
            <BookingSummary />
          </div>
        </div>
      </div>
    </div>
  );
}

