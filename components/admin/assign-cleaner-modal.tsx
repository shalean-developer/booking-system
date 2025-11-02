'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle } from 'lucide-react';

interface Cleaner {
  id: string;
  name: string;
  initials: string;
  availableToday: boolean;
}

interface AssignCleanerModalProps {
  bookingId?: string;
  cleaners?: Cleaner[];
}

export function AssignCleanerModal({ bookingId, cleaners = [] }: AssignCleanerModalProps) {
  const [open, setOpen] = useState(false);
  const [selectedCleaner, setSelectedCleaner] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);

  const handleAssign = async (cleanerId: string) => {
    setIsAssigning(true);
    try {
      // TODO: Call API to assign cleaner
      // await fetch(`/api/admin/bookings/assign`, { ... })
      setSelectedCleaner(cleanerId);
      setTimeout(() => {
        setIsAssigning(false);
        setOpen(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to assign cleaner:', error);
      setIsAssigning(false);
    }
  };

  const availableCleaners = cleaners.filter(c => c.availableToday);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          Assign Cleaner
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Cleaner</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {availableCleaners.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No cleaners available</p>
            </div>
          ) : (
            availableCleaners.map((cleaner) => (
              <div
                key={cleaner.id}
                className="flex items-center justify-between border p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-700">
                    {cleaner.initials}
                  </div>
                  <div>
                    <div className="font-medium">{cleaner.name}</div>
                    <div className="text-xs text-muted-foreground">Available</div>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleAssign(cleaner.id)}
                  disabled={isAssigning || selectedCleaner === cleaner.id}
                >
                  {selectedCleaner === cleaner.id ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Assigned
                    </>
                  ) : (
                    'Assign'
                  )}
                </Button>
              </div>
            ))
          )}
          
          {/* Include unavailable cleaners at bottom */}
          {cleaners.filter(c => !c.availableToday).length > 0 && (
            <>
              <div className="text-xs text-muted-foreground font-medium pt-4 pb-2">
                Unavailable
              </div>
              {cleaners
                .filter(c => !c.availableToday)
                .map((cleaner) => (
                  <div
                    key={cleaner.id}
                    className="flex items-center justify-between border p-3 rounded-lg opacity-60"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-500">
                        {cleaner.initials}
                      </div>
                      <div>
                        <div className="font-medium">{cleaner.name}</div>
                        <div className="text-xs text-muted-foreground">Unavailable</div>
                      </div>
                    </div>
                    <Circle className="h-4 w-4 text-gray-400" />
                  </div>
                ))}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

