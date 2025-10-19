'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface AddNoteDialogProps {
  booking: {
    id: string;
    customer_name: string;
  } | null;
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
}

export function AddNoteDialog({ booking, open, onClose, onAdded }: AddNoteDialogProps) {
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!booking || !note.trim()) {
      alert('Please enter a note');
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch('/api/admin/bookings/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          bookingId: booking.id,
          note: note.trim(),
          adminId: 'admin', // You can get this from auth context
        }),
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || 'Failed to add note');
      }

      alert('Note added successfully!');
      setNote('');
      onAdded();
      onClose();
    } catch (err) {
      console.error('Error adding note:', err);
      alert('Failed to add note');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setNote('');
    onClose();
  };

  if (!booking) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Internal Note</DialogTitle>
          <DialogDescription>
            Add a note for booking {booking.id} - {booking.customer_name}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Label htmlFor="note">Note</Label>
          <Textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Enter your note here..."
            rows={6}
            className="mt-2"
          />
          <p className="text-xs text-gray-500 mt-2">
            This note is internal and will not be visible to the customer.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !note.trim()}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

