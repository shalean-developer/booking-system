'use client';

import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BookingStatus } from '@/components/dashboard/customer-portal/types';

export function StatusBadge({ status }: { status: BookingStatus }) {
  const map = {
    upcoming: {
      label: 'Upcoming',
      icon: <Clock className="w-3 h-3" />,
      cls: 'bg-blue-50 text-blue-600 border-blue-200',
    },
    completed: {
      label: 'Completed',
      icon: <CheckCircle2 className="w-3 h-3" />,
      cls: 'bg-green-50 text-green-600 border-green-200',
    },
    cancelled: {
      label: 'Cancelled',
      icon: <XCircle className="w-3 h-3" />,
      cls: 'bg-red-50 text-red-500 border-red-200',
    },
  };
  const { label, icon, cls } = map[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[11px] font-bold border rounded-full px-2.5 py-1 leading-none',
        cls
      )}
    >
      {icon}
      <span>{label}</span>
    </span>
  );
}
