'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface SendEmailDialogProps {
  booking: {
    id: string;
    customer_name: string;
    customer_email: string;
    service_type: string;
    booking_date: string;
    booking_time: string;
    address_line1: string;
    address_suburb: string;
    address_city: string;
    status: string;
    cleaner_name?: string | null;
  } | null;
  open: boolean;
  onClose: () => void;
  onSent: () => void;
}

export function SendEmailDialog({ booking, open, onClose, onSent }: SendEmailDialogProps) {
  const [isSending, setIsSending] = useState(false);
  const [template, setTemplate] = useState<string>('confirmation');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (booking && template) {
      generateEmail();
    }
  }, [booking, template]);

  const generateEmail = () => {
    if (!booking) return;

    switch (template) {
      case 'confirmation':
        setSubject(`Booking Confirmation - ${booking.id}`);
        setBody(`Dear ${booking.customer_name},\n\nYour booking has been confirmed!\n\nBooking Details:\n- Service: ${booking.service_type}\n- Date: ${new Date(booking.booking_date).toLocaleDateString()}\n- Time: ${booking.booking_time}\n- Address: ${booking.address_line1}, ${booking.address_suburb}, ${booking.address_city}\n${booking.cleaner_name ? `- Cleaner: ${booking.cleaner_name}\n` : ''}\nIf you have any questions, please don't hesitate to contact us.\n\nBest regards,\nShalean Cleaning Services`);
        break;
      case 'update':
        setSubject(`Booking Update - ${booking.id}`);
        setBody(`Dear ${booking.customer_name},\n\nYour booking has been updated.\n\nUpdated Details:\n- Service: ${booking.service_type}\n- Date: ${new Date(booking.booking_date).toLocaleDateString()}\n- Time: ${booking.booking_time}\n- Status: ${booking.status}\n${booking.cleaner_name ? `- Cleaner: ${booking.cleaner_name}\n` : ''}\nIf you have any questions about this update, please contact us.\n\nBest regards,\nShalean Cleaning Services`);
        break;
      case 'reminder':
        setSubject(`Booking Reminder - ${booking.id}`);
        setBody(`Dear ${booking.customer_name},\n\nThis is a friendly reminder about your upcoming cleaning service.\n\nBooking Details:\n- Service: ${booking.service_type}\n- Date: ${new Date(booking.booking_date).toLocaleDateString()}\n- Time: ${booking.booking_time}\n- Address: ${booking.address_line1}, ${booking.address_suburb}, ${booking.address_city}\n${booking.cleaner_name ? `- Cleaner: ${booking.cleaner_name}\n` : ''}\nWe look forward to serving you!\n\nBest regards,\nShalean Cleaning Services`);
        break;
      case 'custom':
        setSubject('');
        setBody('');
        break;
    }
  };

  const handleSend = async () => {
    if (!booking || !subject || !body) {
      alert('Please fill in all fields');
      return;
    }

    try {
      setIsSending(true);

      // Convert plain text to HTML
      const htmlBody = body.split('\n').map(line => {
        if (!line.trim()) return '<br>';
        return `<p>${line}</p>`;
      }).join('');

      const response = await fetch('/api/admin/bookings/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          to: booking.customer_email,
          subject,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              ${htmlBody}
            </div>
          `,
          template: template === 'custom' ? null : template,
          bookingData: booking,
        }),
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || 'Failed to send email');
      }

      alert('Email sent successfully!');
      onSent();
      onClose();
    } catch (err) {
      console.error('Error sending email:', err);
      alert('Failed to send email: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsSending(false);
    }
  };

  if (!booking) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send Email to Customer</DialogTitle>
          <DialogDescription>
            Sending email to {booking.customer_email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="template">Email Template</Label>
            <Select value={template} onValueChange={setTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="confirmation">Booking Confirmation</SelectItem>
                <SelectItem value="update">Booking Update</SelectItem>
                <SelectItem value="reminder">Booking Reminder</SelectItem>
                <SelectItem value="custom">Custom Message</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
            />
          </div>

          <div>
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Email body"
              rows={12}
              className="font-mono text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </Button>
          </div>

          {showPreview && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-semibold mb-2">Preview:</h4>
              <div className="space-y-2 text-sm">
                <p><strong>To:</strong> {booking.customer_email}</p>
                <p><strong>Subject:</strong> {subject}</p>
                <div className="border-t pt-2 mt-2">
                  <div className="whitespace-pre-wrap">{body}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isSending || !subject || !body}>
            {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

