'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Loader2, User } from 'lucide-react';

interface Cleaner {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  rating?: number;
  photo_url?: string;
}

interface AssignCleanerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  bookingDate: string;
  bookingTime: string;
  bookingCity: string;
  onSuccess?: () => void;
}

export function AssignCleanerDialog({
  open,
  onOpenChange,
  bookingId,
  bookingDate,
  bookingCity,
  onSuccess,
}: AssignCleanerDialogProps) {
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [selectedCleanerId, setSelectedCleanerId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && bookingDate && bookingCity) {
      fetchCleaners();
    }
  }, [open, bookingDate, bookingCity]);

  const fetchCleaners = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams({
        date: bookingDate,
        city: bookingCity,
      });
      const response = await fetch(`/api/cleaners/available?${params}`);
      const data = await response.json();

      if (data.ok) {
        setCleaners(data.cleaners || []);
      } else {
        setError(data.error || 'Failed to fetch cleaners');
      }
    } catch (err) {
      setError('Failed to load cleaners');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedCleanerId) {
      setError('Please select a cleaner');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const response = await fetch(`/api/admin/bookings/${bookingId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cleaner_id: selectedCleanerId }),
      });

      const data = await response.json();

      if (data.ok) {
        onSuccess?.();
        onOpenChange(false);
        setSelectedCleanerId('');
      } else {
        setError(data.error || 'Failed to assign cleaner');
      }
    } catch (err) {
      setError('Failed to assign cleaner');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign Cleaner</DialogTitle>
          <DialogDescription>
            Select a cleaner for this booking on {new Date(bookingDate).toLocaleDateString('en-ZA')}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-red-50 p-3 border border-red-200">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading cleaners...</span>
          </div>
        ) : cleaners.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No cleaners available for this date and location.
          </div>
        ) : (
          <div className="space-y-4">
            <Label>Available Cleaners</Label>
            <RadioGroup value={selectedCleanerId} onValueChange={setSelectedCleanerId}>
              <div className="space-y-2">
                {cleaners.map((cleaner) => (
                  <div
                    key={cleaner.id}
                    className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-accent cursor-pointer"
                  >
                    <RadioGroupItem value={cleaner.id} id={cleaner.id} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {cleaner.photo_url ? (
                          <img
                            src={cleaner.photo_url}
                            alt={cleaner.name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1">
                          <Label htmlFor={cleaner.id} className="font-medium cursor-pointer">
                            {cleaner.name}
                          </Label>
                          {cleaner.rating && (
                            <Badge variant="outline" className="ml-2">
                              ⭐ {cleaner.rating.toFixed(1)}
                            </Badge>
                          )}
                          {cleaner.email && (
                            <p className="text-xs text-muted-foreground">{cleaner.email}</p>
                          )}
                          {cleaner.phone && (
                            <p className="text-xs text-muted-foreground">{cleaner.phone}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={!selectedCleanerId || isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Assigning...
              </>
            ) : (
              'Assign Cleaner'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

