'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

const steps = [
  { href: '/booking-v2', label: 'Details' },
  { href: '/booking-v2/cleaner', label: 'Schedule' },
  { href: '/booking-v2/review', label: 'Review' },
  { href: '/booking-v2/payment', label: 'Pay' },
] as const;

export function BookingV2StepNav({ active }: { active: 0 | 1 | 2 | 3 }) {
  return (
    <nav className="flex flex-wrap items-center justify-center gap-2 border-b border-zinc-200 bg-white px-4 py-3 text-xs font-semibold text-zinc-500">
      {steps.map((s, stepIndex) => (
        <span key={s.href} className="flex items-center gap-2">
          <Link
            href={s.href}
            className={cn(
              'rounded-full px-3 py-1 transition-colors',
              stepIndex === active ? 'bg-violet-600 text-white' : 'hover:bg-zinc-100 hover:text-zinc-800',
            )}
          >
            {stepIndex + 1}. {s.label}
          </Link>
        </span>
      ))}
    </nav>
  );
}
