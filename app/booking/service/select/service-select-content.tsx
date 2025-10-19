"use client";

import { useEffect } from 'react';
import { useBooking } from '@/lib/useBooking';
import { Stepper } from '@/components/stepper';
import { BookingSummary } from '@/components/booking-summary';
import { StepService } from '@/components/step-service';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export function ServiceSelectContent() {
  const { state, isLoaded, updateField } = useBooking();

  // Set step to 1 when this page loads
  useEffect(() => {
    if (isLoaded && state.step !== 1) {
      updateField('step', 1);
    }
  }, [isLoaded, state.step, updateField]);

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

  // If not on step 1, don't render
  if (state.step !== 1) {
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
            href="/" 
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </motion.div>

        {/* Progress Stepper - Centered */}
        <div className="flex justify-center w-full mb-6 lg:mb-8">
          <div className="max-w-4xl w-full">
            <Stepper currentStep={state.step} />
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-12 gap-6 pb-24 lg:pb-8">
          {/* Main Column - Service Selection */}
          <div className="col-span-12 lg:col-span-8">
            <StepService />
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

