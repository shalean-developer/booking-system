'use client';

import { useBooking } from '@/lib/useBooking';
import { Stepper } from '@/components/stepper';
import { BookingSummary } from '@/components/booking-summary';
import { StepService } from '@/components/step-service';
import { StepDetails } from '@/components/step-details';
import { StepSchedule } from '@/components/step-schedule';
import { StepContact } from '@/components/step-contact';
import { StepReview } from '@/components/step-review';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function BookingPage() {
  const { state, isLoaded } = useBooking();

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

  const steps = [
    <StepService key="1" />,
    <StepDetails key="2" />,
    <StepSchedule key="3" />,
    <StepContact key="4" />,
    <StepReview key="5" />,
  ];

  const currentStep = steps[state.step - 1];

  return (
    <div className="min-h-screen bg-slate-50 py-6">
      <div className="mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
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
              {currentStep}
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

