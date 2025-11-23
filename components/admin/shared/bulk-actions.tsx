'use client';

import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BulkActionsProps {
  selectedCount: number;
  actions?: ReactNode;
  onClear?: () => void;
  className?: string;
}

export function BulkActions({
  selectedCount,
  actions,
  onClear,
  className,
}: BulkActionsProps) {
  if (selectedCount === 0) return null;

  return (
    <div
      className={cn(
        'flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg',
        className
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-blue-900">
          {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
        </span>
        {onClear && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-6 px-2 text-blue-700 hover:text-blue-900 hover:bg-blue-100"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

