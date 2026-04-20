'use client';

import { cn } from '@/lib/utils';

interface StepLayoutProps {
  step: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export function StepLayout({ step, totalSteps, title, subtitle, children, className }: StepLayoutProps) {
  return (
    <section className={cn('space-y-4', className)}>
      <div className="lg:hidden rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-wide text-primary">Step {step} of {totalSteps}</p>
        <p className="mt-0.5 text-sm font-semibold text-gray-900">{title}</p>
        {subtitle ? <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}
