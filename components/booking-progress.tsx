'use client';

import { useMemo } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface BookingProgressProps {
  currentStep: number;
  totalSteps?: number;
  className?: string;
}

const STEP_LABELS = [
  'Service',
  'Details',
  'Schedule',
  'Contact',
  'Cleaner',
  'Review',
];

export function BookingProgress({ currentStep, totalSteps = 6, className }: BookingProgressProps) {
  const steps = useMemo(() => {
    return Array.from({ length: totalSteps }, (_, i) => i + 1);
  }, [totalSteps]);

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between mb-2">
        {steps.map((step, index) => {
          const isCompleted = step < currentStep;
          const isCurrent = step === currentStep;
          const isUpcoming = step > currentStep;

          return (
            <div key={step} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="flex flex-col items-center flex-1">
                <motion.div
                  initial={false}
                  animate={{
                    scale: isCurrent ? 1.1 : 1,
                  }}
                  className={cn(
                    'relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all',
                    isCompleted && 'bg-primary border-primary text-white',
                    isCurrent && 'border-primary bg-primary/10 text-primary ring-4 ring-primary/20',
                    isUpcoming && 'border-slate-300 bg-white text-slate-400'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-semibold">{step}</span>
                  )}
                </motion.div>
                
                {/* Step Label */}
                <span
                  className={cn(
                    'mt-2 text-xs font-medium hidden sm:block',
                    isCurrent && 'text-primary font-semibold',
                    isCompleted && 'text-slate-600',
                    isUpcoming && 'text-slate-400'
                  )}
                >
                  {STEP_LABELS[index] || `Step ${step}`}
                </span>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 flex-1 mx-2 transition-colors',
                    isCompleted ? 'bg-primary' : 'bg-slate-200'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="mt-4 h-2 bg-slate-200 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="h-full bg-primary rounded-full"
        />
      </div>

      {/* Step Info */}
      <div className="mt-3 text-center">
        <p className="text-sm text-slate-600">
          Step {currentStep} of {totalSteps} · {STEP_LABELS[currentStep - 1] || 'Review'}
        </p>
      </div>
    </div>
  );
}

