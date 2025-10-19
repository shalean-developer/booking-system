'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface AvailabilityToggleProps {
  isAvailable: boolean;
  onChange?: (isAvailable: boolean) => void;
}

export function AvailabilityToggle({ isAvailable, onChange }: AvailabilityToggleProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [localIsAvailable, setLocalIsAvailable] = useState(isAvailable);

  const handleToggle = async (checked: boolean) => {
    setIsUpdating(true);
    setLocalIsAvailable(checked);

    try {
      const response = await fetch('/api/cleaner/availability', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_available: checked }),
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || 'Failed to update availability');
      }

      onChange?.(checked);
    } catch (error) {
      console.error('Error updating availability:', error);
      // Revert on error
      setLocalIsAvailable(!checked);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border-2 border-gray-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex-1">
        <Label
          htmlFor="availability-toggle"
          className="text-sm font-semibold text-gray-900 cursor-pointer"
        >
          {localIsAvailable ? 'Available for Jobs' : 'Not Available'}
        </Label>
        <p className="text-xs text-gray-500 mt-0.5">
          {localIsAvailable
            ? 'You can claim available bookings'
            : 'You won\'t see new available jobs'}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {isUpdating && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
        <Switch
          id="availability-toggle"
          checked={localIsAvailable}
          onCheckedChange={handleToggle}
          disabled={isUpdating}
          className="data-[state=checked]:bg-green-500"
        />
      </div>
    </div>
  );
}

