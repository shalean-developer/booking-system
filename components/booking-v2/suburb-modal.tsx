'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface SuburbModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (suburb: string) => void;
  currentSuburb?: string;
}

export function SuburbModal({ open, onClose, onSubmit, currentSuburb = '' }: SuburbModalProps) {
  const [suburb, setSuburb] = useState(currentSuburb);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSuburb(currentSuburb);
      setError(null);
    }
  }, [open, currentSuburb]);

  const handleSubmit = useCallback(() => {
    const trimmedSuburb = suburb.trim();
    
    if (!trimmedSuburb) {
      setError('Please enter your suburb');
      return;
    }

    if (trimmedSuburb.length < 2) {
      setError('Suburb must be at least 2 characters');
      return;
    }

    setError(null);
    onSubmit(trimmedSuburb);
  }, [suburb, onSubmit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && suburb.trim()) {
      handleSubmit();
    }
  }, [suburb, handleSubmit]);

  const isValid = suburb.trim().length >= 2;

  return (
    <Dialog 
      open={open} 
      onOpenChange={(isOpen) => {
        // Only allow closing if suburb is entered (via Continue button)
        // If user tries to close without entering suburb, prevent it
        if (!isOpen) {
          // Check if suburb is valid before allowing close
          if (suburb.trim().length >= 2) {
            onClose();
          }
          // If suburb is not valid, don't call onClose() which keeps dialog open
          // The dialog's open prop stays true, preventing it from closing
        }
      }}
    >
      <DialogContent 
        className={cn(
          "w-[calc(100%-2rem)] max-w-[425px] left-1/2 -translate-x-1/2 sm:mx-auto",
          !isValid && "[&>button]:hidden" // Hide close button when suburb is not entered
        )}
        onInteractOutside={(e) => {
          // Prevent closing by clicking outside if suburb is not entered
          if (!isValid) {
            e.preventDefault();
          }
        }} 
        onEscapeKeyDown={(e) => {
          // Prevent closing with Escape key if suburb is not entered
          if (!isValid) {
            e.preventDefault();
          }
        }}
        onPointerDownOutside={(e) => {
          // Prevent closing by clicking outside if suburb is not entered
          if (!isValid) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Enter Your Suburb</DialogTitle>
          <DialogDescription>
            Please enter your suburb so we can show you available cleaners in your area.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="suburb" className="text-sm font-semibold text-gray-900">
              Suburb
            </Label>
            <Input
              id="suburb"
              type="text"
              placeholder="e.g., Sandton, Rosebank, Midrand"
              value={suburb}
              onChange={(e) => {
                setSuburb(e.target.value);
                setError(null);
              }}
              onKeyDown={handleKeyDown}
              className={cn(
                "h-11",
                error ? 'border-red-500 focus-visible:ring-red-500' : ''
              )}
              autoFocus
            />
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row">
          <Button
            onClick={handleSubmit}
            disabled={!isValid}
            className={cn(
              "w-full sm:w-auto",
              isValid ? 'bg-primary hover:bg-primary/90' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            )}
          >
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

