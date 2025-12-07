'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { devLog } from '@/lib/dev-logger';

interface CancelBookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  bookingDate: string;
  serviceType: string;
  onSuccess?: () => void;
  onOptimisticUpdate?: (bookingId: string) => void; // Callback for optimistic UI update
}

export function CancelBookingModal({
  open,
  onOpenChange,
  bookingId,
  bookingDate,
  serviceType,
  onSuccess,
  onOptimisticUpdate,
}: CancelBookingModalProps) {
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancel = async () => {
    setIsCancelling(true);
    
    // Optimistic update: immediately update UI
    if (onOptimisticUpdate) {
      onOptimisticUpdate(bookingId);
    }
    
    // Close modal immediately for better UX
    onOpenChange(false);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in to cancel bookings');
        setIsCancelling(false);
        // Revert optimistic update on error
        if (onSuccess) {
          onSuccess(); // This will trigger a refresh to revert
        }
        return;
      }

      const response = await fetch(`/api/dashboard/booking?id=${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          status: 'cancelled',
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Failed to cancel booking');
      }

      toast.success('Booking cancelled successfully');
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: unknown) {
      devLog.error('Error cancelling booking:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel booking. Please try again.';
      toast.error(errorMessage);
      // Revert optimistic update on error - refresh data
      if (onSuccess) {
        onSuccess(); // This will trigger a refresh to revert the optimistic update
      }
    } finally {
      setIsCancelling(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Cancel Booking
          </DialogTitle>
          <DialogDescription className="pt-2">
            Are you sure you want to cancel this booking? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-2">
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm font-medium text-gray-900">{serviceType}</p>
            <p className="text-sm text-gray-600 mt-1">{formatDate(bookingDate)}</p>
          </div>
          <p className="text-sm text-gray-600">
            If you need to reschedule instead, you can use the "Reschedule" option.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCancelling}
            aria-label="Keep booking and close dialog"
          >
            Keep Booking
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={isCancelling}
            aria-label={`Confirm cancellation of ${serviceType} booking`}
            aria-busy={isCancelling}
          >
            {isCancelling ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                <span aria-live="polite">Cancelling...</span>
              </>
            ) : (
              'Cancel Booking'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
