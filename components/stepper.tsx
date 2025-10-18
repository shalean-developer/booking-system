'use client';

import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StepperProps {
  currentStep: number;
}

const stepLabels = [
  'Service',
  'Details',
  'Schedule',
  'Contact',
  'Select Cleaner',
  'Review',
];

const TOTAL_STEPS = 6;

export function Stepper({ currentStep }: StepperProps) {
  const current = currentStep;
  const total = TOTAL_STEPS;
  
  return (
    <div className="w-full" role="navigation" aria-label="Booking progress">
      {/* Mobile: Compact Progress Indicator */}
      <div className="mb-4 md:hidden">
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span className="font-medium">Step {current} of {total}</span>
          <span className="text-xs">{stepLabels[current - 1]}</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${(current / total) * 100}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Desktop: Full Stepper - Centered */}
      <div className="hidden md:flex items-center justify-center gap-2">
        {Array.from({ length: total }, (_, i) => i + 1).map((step, idx) => (
          <div key={step} className="flex items-center gap-2">
            {/* Step Circle */}
            <div className="flex flex-col items-center">
              <motion.div
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full font-semibold transition-all',
                  step < current && 'bg-primary text-white ring-2 ring-primary/20',
                  step === current && 'bg-primary text-white shadow-lg ring-2 ring-primary/30',
                  step > current && 'bg-gray-50 text-gray-400 border border-gray-200'
                )}
                initial={false}
                animate={{
                  scale: step === current ? 1.05 : 1,
                }}
                transition={{ duration: 0.2 }}
                aria-current={step === current ? 'step' : undefined}
                aria-label={`Step ${step} of ${total}: ${stepLabels[idx]}`}
              >
                {step < current ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="text-sm">{step}</span>
                )}
              </motion.div>
              <span
                className={cn(
                  'mt-2 text-xs font-medium whitespace-nowrap',
                  step <= current ? 'text-slate-900' : 'text-slate-400'
                )}
              >
                {stepLabels[idx]}
              </span>
            </div>

            {/* Connector Line */}
            {idx < total - 1 && (
              <div className="relative w-12 lg:w-16 h-0.5 bg-gray-200 mt-[-20px]">
                <motion.div
                  className="absolute inset-0 bg-primary"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: step < current ? 1 : 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  style={{ transformOrigin: 'left' }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

