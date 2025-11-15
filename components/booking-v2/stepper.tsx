'use client';

import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StepperProps {
  currentStep: number;
}

const stepGroups = [
  {
    number: 1,
    label: 'Service Setup',
    substeps: ['Service', 'Details']
  },
  {
    number: 2,
    label: 'Schedule & Contact',
    substeps: ['Schedule', 'Contact']
  },
  {
    number: 3,
    label: 'Finalize',
    substeps: ['Select Cleaner', 'Review']
  },
];

const TOTAL_STEPS = 6;
const TOTAL_GROUPS = 3;

export function Stepper({ currentStep }: StepperProps) {
  const current = currentStep;
  const total = TOTAL_STEPS;
  const currentGroup = Math.ceil(currentStep / 2);
  
  const getSubstep = (step: number) => {
    return ((step - 1) % 2) + 1;
  };

  const getProgressPercentage = (step: number) => {
    if (step <= 2) return 33;
    if (step <= 4) return 66;
    return 100;
  };

  return (
    <div className="w-full" role="navigation" aria-label="Booking progress">
      <div className="mb-4 md:hidden">
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span className="font-medium">Step {current} of {total}</span>
          <span className="text-xs">{stepGroups[currentGroup - 1].label}</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${getProgressPercentage(current)}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>
      </div>

      <div className="hidden md:flex items-center justify-center gap-2">
        {stepGroups.map((group, idx) => {
          const isCompleted = group.number < currentGroup;
          const isCurrent = group.number === currentGroup;
          const isUpcoming = group.number > currentGroup;
          const currentSubstep = isCurrent ? getSubstep(currentStep) : null;

          return (
            <div key={group.number} className="flex items-center gap-2">
              <div className="flex flex-col items-center">
                <motion.div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full font-semibold transition-all',
                    isCompleted && 'bg-primary text-white ring-2 ring-primary/20',
                    isCurrent && 'bg-primary text-white shadow-lg ring-2 ring-primary/30',
                    isUpcoming && 'bg-gray-50 text-gray-400 border border-gray-200'
                  )}
                  initial={false}
                  animate={{
                    scale: isCurrent ? 1.1 : 1,
                  }}
                  transition={{ duration: 0.2 }}
                  aria-current={isCurrent ? 'step' : undefined}
                  aria-label={`Group ${group.number} of ${TOTAL_GROUPS}: ${group.label}`}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : isCurrent ? (
                    <span className="text-base font-bold">{group.number}</span>
                  ) : (
                    <span className="text-sm">{group.number}</span>
                  )}
                </motion.div>
                <span
                  className={cn(
                    'hidden md:block mt-2 text-xs font-medium whitespace-nowrap text-center max-w-[100px]',
                    !isUpcoming ? 'text-slate-900' : 'text-slate-400'
                  )}
                >
                  {group.label}
                </span>
              </div>

              {idx < TOTAL_GROUPS - 1 && (
                <div className="relative w-16 lg:w-20 h-0.5 bg-gray-200 mt-[-20px]">
                  <motion.div
                    className="absolute inset-0 bg-primary"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: isCompleted ? 1 : 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    style={{ transformOrigin: 'left' }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

