'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface SendEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  customerName: string;
  customerEmail: string;
  bookingDetails?: {
    service_type?: string;
    booking_date?: string;
    booking_time?: string;
  };
  onSuccess?: () => void;
}

const EMAIL_TEMPLATES = {
  confirmation: {
    subject: 'Booking Confirmation',
    message: 'Your booking has been confirmed. We look forward to serving you!',
  },
  update: {
    subject: 'Booking Update',
    message: 'There has been an update to your booking. Please review the details below.',
  },
  reminder: {
    subject: 'Booking Reminder',
    message: 'This is a reminder about your upcoming booking. We look forward to seeing you!',
  },
};

export function SendEmailDialog({
  open,
  onOpenChange,
  bookingId,
  customerName,
  customerEmail,
  bookingDetails,
  onSuccess,
}: SendEmailDialogProps) {
  const [template, setTemplate] = useState<string>('custom');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTemplateChange = (value: string) => {
    setTemplate(value);
    if (value !== 'custom' && EMAIL_TEMPLATES[value as keyof typeof EMAIL_TEMPLATES]) {
      const selectedTemplate = EMAIL_TEMPLATES[value as keyof typeof EMAIL_TEMPLATES];
      setSubject(selectedTemplate.subject);
      setMessage(selectedTemplate.message);
    } else {
      setSubject('');
      setMessage('');
    }
  };

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      setError('Subject and message are required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const response = await fetch(`/api/admin/bookings/${bookingId}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          message,
        }),
      });

      const data = await response.json();

      if (data.ok) {
        onSuccess?.();
        onOpenChange(false);
        setSubject('');
        setMessage('');
        setTemplate('custom');
      } else {
        setError(data.error || 'Failed to send email');
      }
    } catch (err) {
      setError('Failed to send email');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Send Email</DialogTitle>
          <DialogDescription>
            Send an email to {customerName} ({customerEmail})
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-red-50 p-3 border border-red-200">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Email Template</Label>
            <Select value={template} onValueChange={handleTemplateChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="confirmation">Booking Confirmation</SelectItem>
                <SelectItem value="update">Booking Update</SelectItem>
                <SelectItem value="reminder">Booking Reminder</SelectItem>
                <SelectItem value="custom">Custom Message</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Email message"
              rows={8}
            />
          </div>

          {bookingDetails && (
            <div className="rounded-md bg-muted p-3 text-sm">
              <p className="font-medium mb-1">Booking Details:</p>
              <p>Service: {bookingDetails.service_type || 'N/A'}</p>
              <p>Date: {bookingDetails.booking_date ? new Date(bookingDetails.booking_date).toLocaleDateString('en-ZA') : 'N/A'}</p>
              <p>Time: {bookingDetails.booking_time || 'N/A'}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={!subject.trim() || !message.trim() || isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              'Send Email'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

