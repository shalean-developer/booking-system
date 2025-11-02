'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type StatusVariant = 'completed' | 'pending' | 'cancelled' | 'in_progress' | 'urgent' | 'accepted' | 'ongoing';

interface StatusBadgeProps {
  status: StatusVariant | string;
  className?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  completed: { 
    label: 'Completed', 
    className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200' 
  },
  pending: { 
    label: 'Pending', 
    className: 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200' 
  },
  cancelled: { 
    label: 'Cancelled', 
    className: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200' 
  },
  in_progress: { 
    label: 'In Progress', 
    className: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200' 
  },
  urgent: { 
    label: 'Urgent', 
    className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200' 
  },
  accepted: { 
    label: 'Accepted', 
    className: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200' 
  },
  ongoing: { 
    label: 'Ongoing', 
    className: 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200' 
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status.toLowerCase()] || { 
    label: status.charAt(0).toUpperCase() + status.slice(1), 
    className: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200' 
  };

  return (
    <Badge className={cn('border transition-colors', config.className, className)}>
      {config.label}
    </Badge>
  );
}
