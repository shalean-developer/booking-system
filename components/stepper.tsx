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
    label: 'Service & Details',
    substeps: ['Service & Details']
  },
  {
    number: 2,
    label: 'Schedule & Cleaner',
    substeps: ['Schedule & Cleaner']
  },
  {
    number: 3,
    label: 'Contact & Review',
    substeps: ['Contact', 'Review']
  },
];

const TOTAL_STEPS = 4;
const TOTAL_GROUPS = 3;

export function Stepper({ currentStep }: StepperProps) {
  const current = currentStep;
  const total = TOTAL_STEPS;
  // Step 1 = Group 1, Step 2 = Group 2, Steps 3-4 = Group 3
  const currentGroup = currentStep === 1 ? 1 : currentStep === 2 ? 2 : 3;
  
  const getSubstep = (step: number) => {
    // Group 1 has 1 step (step 1), Group 2 has 1 step (step 2), Group 3 has 2 steps (steps 3-4)
    if (step === 1) return 1; // Group 1, substep 1
    if (step === 2) return 1; // Group 2, substep 1
    return step - 2; // Steps 3-4 map to substeps 1-2 of group 3
  };

  const getProgressPercentage = (step: number) => {
    // Convert 4-step system to 3-group progress (33%, 66%, 100%)
    if (step === 1) return 33;
    if (step === 2) return 66;
    return 100;
  };

  return (
    <div className="w-full" role="navigation" aria-label="Booking progress">
      {/* Mobile: Compact Progress Indicator */}
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

      {/* Desktop: Full Stepper - Show 3 Groups */}
      <div className="hidden md:flex items-center justify-center gap-1.5">
        {stepGroups.map((group, idx) => {
          const isCompleted = group.number < currentGroup;
          const isCurrent = group.number === currentGroup;
          const isUpcoming = group.number > currentGroup;
          const currentSubstep = isCurrent ? getSubstep(currentStep) : null;

          return (
            <div key={group.number} className="flex items-center gap-1.5">
              {/* Group Circle */}
              <div className="flex flex-col items-center">
                <motion.div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full font-semibold transition-all',
                    isCompleted && 'bg-primary text-white ring-1 ring-primary/20',
                    isCurrent && 'bg-primary text-white shadow-md ring-1 ring-primary/30',
                    isUpcoming && 'bg-gray-50 text-gray-400 border border-gray-200'
                  )}
                  initial={false}
                  animate={{
                    scale: isCurrent ? 1.05 : 1,
                  }}
                  transition={{ duration: 0.2 }}
                  aria-current={isCurrent ? 'step' : undefined}
                  aria-label={`Group ${group.number} of ${TOTAL_GROUPS}: ${group.label}`}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : isCurrent ? (
                    <span className="text-sm font-bold">{group.number}</span>
                  ) : (
                    <span className="text-xs">{group.number}</span>
                  )}
                </motion.div>
                <span
                  className={cn(
                    'hidden md:block mt-1 text-[10px] font-medium whitespace-nowrap text-center max-w-[80px] leading-tight',
                    !isUpcoming ? 'text-slate-900' : 'text-slate-400'
                  )}
                >
                  {group.label}
                </span>
              </div>

              {/* Connector Line */}
              {idx < TOTAL_GROUPS - 1 && (
                <div className="relative w-12 lg:w-14 h-0.5 bg-gray-200 mt-[-16px]">
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

