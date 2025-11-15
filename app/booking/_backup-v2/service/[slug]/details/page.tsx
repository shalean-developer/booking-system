'use client';

import { useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useBooking } from '@/lib/useBooking';
import { BookingSummary } from '@/components/booking-summary';
import { StepDetails } from '@/components/step-details';
import { BookingFooter } from '@/components/booking-footer';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { ServiceType } from '@/types/booking';

import { slugToServiceType } from '@/lib/booking-utils';

export default function DetailsPage() {
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
    if (state.step !== 2) {
      updateField('step', 2);
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

  // If service is invalid or not on step 2, don't render
  if (!serviceFromSlug || state.step !== 2) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <div className="py-6 lg:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Back Link */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="mb-6"
          >
            <Link 
              href="/booking/service/select" 
              className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-12 gap-6 pb-24 lg:pb-8">
            {/* Main Column - Home Details Form */}
            <div className="col-span-12 lg:col-span-8">
              <StepDetails />
            </div>

            {/* Right Column - Booking Summary (Desktop Only) */}
            <div className="col-span-12 lg:col-span-4">
              <BookingSummary />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <BookingFooter />
    </div>
  );
}

