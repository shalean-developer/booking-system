'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Booking {
  id: string;
  customer_name: string | null;
}

interface RateCustomerModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (bookingId: string, rating: number, comment: string) => Promise<void>;
}

export function RateCustomerModal({
  booking,
  isOpen,
  onClose,
  onSubmit,
}: RateCustomerModalProps) {
  // All hooks must be called before any conditional returns
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!booking || rating === 0) return;

    setIsSubmitting(true);
    try {
      await onSubmit(booking.id, rating, comment);
      handleClose();
    } catch (error) {
      console.error('Error submitting rating:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(5);
    setHoverRating(0);
    setComment('');
    onClose();
  };

  // Early return after all hooks are called
  if (!booking) return null;
  
  // TypeScript type guard: booking is now guaranteed to be non-null
  const bookingData = booking;

  const displayRating = hoverRating || rating;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Rate Customer</DialogTitle>
          {bookingData.customer_name && (
            <p className="text-sm text-gray-600 mt-1">
              How was your experience with {bookingData.customer_name}?
            </p>
          )}
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Star Rating */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">Your Rating</Label>
            <div className="flex items-center justify-center gap-2 py-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transform transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    className={cn(
                      'h-10 w-10 transition-colors',
                      star <= displayRating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    )}
                  />
                </button>
              ))}
            </div>
            <p className="text-center text-sm text-gray-600">
              {rating === 5 && 'Excellent customer!'}
              {rating === 4 && 'Good customer'}
              {rating === 3 && 'Average experience'}
              {rating === 2 && 'Below average'}
              {rating === 1 && 'Poor experience'}
            </p>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment" className="text-base font-semibold">
              Comment (Optional)
            </Label>
            <Textarea
              id="comment"
              placeholder="Share your experience with this customer..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-gray-500">
              This helps us maintain quality standards
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Skip
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
            className="bg-primary hover:bg-primary/90"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Rating'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

