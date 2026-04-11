'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';

/** Matches step 1 & 2 booking headers — 4-step progress with green complete + violet active. */
export function BookingFlowStepIndicator({ activeStep }: { activeStep: 1 | 2 | 3 | 4 }) {
  return (
    <div className="flex items-center gap-2">
      {([1, 2, 3, 4] as const).map((stepNum) => (
        <React.Fragment key={stepNum}>
          <div className="flex flex-col items-center">
            <div
              className={[
                'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all',
                stepNum < activeStep
                  ? 'bg-green-500 text-white shadow-md shadow-green-200'
                  : stepNum === activeStep
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-200 ring-2 ring-violet-200'
                    : stepNum === 3
                      ? 'bg-white border-2 border-gray-300 text-gray-400'
                      : 'bg-white border-2 border-gray-200 text-gray-300',
              ].join(' ')}
            >
              {stepNum < activeStep ? <CheckCircle2 size={18} /> : stepNum}
            </div>
          </div>
          {stepNum < 4 && (
            <div
              className={['w-8 h-0.5 rounded-full', stepNum < activeStep ? 'bg-green-400' : 'bg-gray-200'].join(' ')}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
