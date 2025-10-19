'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, User } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface Cleaner {
  id: string;
  name: string;
  email: string;
  phone: string;
  rating: number;
  areas: string[];
  photo_url: string;
  bookings_on_date: Array<{
    id: string;
    time: string;
    service: string;
    status: string;
  }>;
  has_conflict: boolean;
}

interface AssignCleanerDialogProps {
  booking: {
    id: string;
    booking_date: string;
    booking_time: string;
    customer_name: string;
    service_type: string;
  } | null;
  open: boolean;
  onClose: () => void;
  onAssigned: () => void;
}

export function AssignCleanerDialog({ booking, open, onClose, onAssigned }: AssignCleanerDialogProps) {
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedCleaner, setSelectedCleaner] = useState<string | null>(null);
  const [showConflictWarning, setShowConflictWarning] = useState(false);

  useEffect(() => {
    if (open && booking) {
      fetchCleaners();
    }
  }, [open, booking]);

  const fetchCleaners = async () => {
    if (!booking) return;

    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        date: booking.booking_date,
        time: booking.booking_time,
      });

      const response = await fetch(`/api/admin/bookings/assign?${params}`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || 'Failed to fetch cleaners');
      }

      setCleaners(data.cleaners || []);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching cleaners:', err);
      alert('Failed to fetch cleaners');
      setIsLoading(false);
    }
  };

  const handleAssign = async (override: boolean = false) => {
    if (!selectedCleaner || !booking) return;

    const cleaner = cleaners.find(c => c.id === selectedCleaner);
    
    // Check for conflict
    if (!override && cleaner?.has_conflict) {
      setShowConflictWarning(true);
      return;
    }

    try {
      setIsAssigning(true);
      const response = await fetch('/api/admin/bookings/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          bookingId: booking.id,
          cleanerId: selectedCleaner,
          override,
        }),
      });

      const data = await response.json();

      if (!data.ok) {
        if (data.requiresOverride) {
          setShowConflictWarning(true);
          setIsAssigning(false);
          return;
        }
        throw new Error(data.error || 'Failed to assign cleaner');
      }

      alert('Cleaner assigned successfully!');
      onAssigned();
      onClose();
    } catch (err) {
      console.error('Error assigning cleaner:', err);
      alert('Failed to assign cleaner');
    } finally {
      setIsAssigning(false);
    }
  };

  if (!booking) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign Cleaner to Booking</DialogTitle>
          <DialogDescription>
            Booking {booking.id} - {booking.customer_name} - {new Date(booking.booking_date).toLocaleDateString()} at {booking.booking_time}
          </DialogDescription>
        </DialogHeader>

        {showConflictWarning ? (
          <div className="py-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-900">Time Conflict Detected</h4>
                  <p className="text-sm text-yellow-800 mt-1">
                    This cleaner already has a booking at this time. Do you want to override and assign anyway?
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConflictWarning(false)}>
                Go Back
              </Button>
              <Button 
                variant="default" 
                onClick={() => handleAssign(true)}
                disabled={isAssigning}
              >
                {isAssigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Override and Assign
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : cleaners.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No cleaners available
              </div>
            ) : (
              <div className="py-4">
                <Label className="mb-2 block">Select a cleaner:</Label>
                <div className="space-y-3">
                  {cleaners.map((cleaner) => (
                    <div
                      key={cleaner.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedCleaner === cleaner.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      } ${cleaner.has_conflict ? 'opacity-75' : ''}`}
                      onClick={() => setSelectedCleaner(cleaner.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                            {cleaner.photo_url ? (
                              <img
                                src={cleaner.photo_url}
                                alt={cleaner.name}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <User className="h-6 w-6 text-gray-500" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-semibold">{cleaner.name}</h4>
                            <p className="text-sm text-gray-600">{cleaner.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                Rating: {cleaner.rating.toFixed(1)}
                              </Badge>
                              {cleaner.has_conflict && (
                                <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-800 border-yellow-200">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Conflict
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <input
                          type="radio"
                          checked={selectedCleaner === cleaner.id}
                          onChange={() => setSelectedCleaner(cleaner.id)}
                          className="mt-1"
                        />
                      </div>

                      {/* Show bookings on this date */}
                      {cleaner.bookings_on_date.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs font-medium text-gray-700 mb-2">
                            Schedule for {new Date(booking.booking_date).toLocaleDateString()}:
                          </p>
                          <div className="space-y-1">
                            {cleaner.bookings_on_date.map((b) => (
                              <div
                                key={b.id}
                                className={`text-xs p-2 rounded ${
                                  b.time === booking.booking_time
                                    ? 'bg-yellow-100 text-yellow-900'
                                    : 'bg-gray-50 text-gray-700'
                                }`}
                              >
                                <span className="font-medium">{b.time}</span> - {b.service} ({b.status})
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={() => handleAssign(false)}
                disabled={!selectedCleaner || isAssigning}
              >
                {isAssigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Assign Cleaner
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

