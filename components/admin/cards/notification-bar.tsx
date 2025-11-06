'use client';

import { useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function NotificationBar() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="w-full bg-blue-100 border-b border-blue-200 py-3">
      <div className="px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-2 text-blue-900">
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm font-medium">New Quote: Standard Cleaning R79.00</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-blue-900 hover:bg-blue-200"
          onClick={() => setIsVisible(false)}
          aria-label="Close notification"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

