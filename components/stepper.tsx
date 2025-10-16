'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepperProps {
  currentStep: number;
}

const stepLabels = [
  'Service',
  'Details',
  'Schedule',
  'Contact',
  'Review',
];

const TOTAL_STEPS = 5;

export function Stepper({ currentStep }: StepperProps) {
  const current = currentStep;
  const total = TOTAL_STEPS;
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {Array.from({ length: total }, (_, i) => i + 1).map((step, idx) => (
          <div key={step} className="flex flex-1 items-center">
            {/* Step Circle */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full border-2 font-semibold transition-all',
                  step < current && 'border-primary bg-primary text-white',
                  step === current && 'border-primary bg-primary text-white shadow-lg',
                  step > current && 'border-slate-300 bg-white text-slate-400'
                )}
              >
                {step < current ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span className="text-sm">{step}</span>
                )}
              </div>
              <span
                className={cn(
                  'mt-2 text-xs font-medium',
                  step <= current ? 'text-slate-900' : 'text-slate-400'
                )}
              >
                {stepLabels[idx]}
              </span>
            </div>

            {/* Connector Line */}
            {idx < total - 1 && (
              <div
                className={cn(
                  'mx-2 h-0.5 flex-1 transition-all',
                  step < current ? 'bg-primary' : 'bg-slate-300'
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

