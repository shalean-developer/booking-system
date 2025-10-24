'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface EditBookingDialogProps {
  booking: {
    id: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    service_type: string;
    booking_date: string;
    booking_time: string;
    address_line1: string;
    address_suburb: string;
    address_city: string;
    total_amount: number;
    service_fee: number;
    cleaner_earnings: number;
    status: string;
    payment_reference: string;
  } | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function EditBookingDialog({ booking, open, onClose, onSaved }: EditBookingDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    service_type: '',
    booking_date: '',
    booking_time: '',
    address_line1: '',
    address_suburb: '',
    address_city: '',
    total_amount: 0,
    service_fee: 0,
    cleaner_earnings: 0,
    status: '',
    payment_reference: '',
  });

  useEffect(() => {
    if (booking) {
      setFormData({
        customer_name: booking.customer_name,
        customer_email: booking.customer_email,
        customer_phone: booking.customer_phone,
        service_type: booking.service_type,
        booking_date: booking.booking_date,
        booking_time: booking.booking_time,
        address_line1: booking.address_line1,
        address_suburb: booking.address_suburb,
        address_city: booking.address_city,
        total_amount: booking.total_amount / 100, // Convert from cents
        service_fee: booking.service_fee / 100, // Convert from cents
        cleaner_earnings: booking.cleaner_earnings / 100, // Convert from cents
        status: booking.status,
        payment_reference: booking.payment_reference || '',
      });
    }
  }, [booking]);

  const handleSave = async () => {
    if (!booking) return;

    try {
      setIsSaving(true);
      const response = await fetch('/api/admin/bookings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: booking.id,
          ...formData,
          total_amount: Math.round(formData.total_amount * 100), // Convert to cents
          cleaner_earnings: Math.round(formData.cleaner_earnings * 100), // Convert to cents
        }),
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || 'Failed to update booking');
      }

      alert('Booking updated successfully!');
      onSaved();
      onClose();
    } catch (err) {
      console.error('Error updating booking:', err);
      alert('Failed to update booking');
    } finally {
      setIsSaving(false);
    }
  };

  if (!booking) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Booking</DialogTitle>
          <DialogDescription>
            Update booking details for {booking.id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Customer Information */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Customer Information</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="customer_name">Name</Label>
                <Input
                  id="customer_name"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="customer_email">Email</Label>
                <Input
                  id="customer_email"
                  type="email"
                  value={formData.customer_email}
                  onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="customer_phone">Phone</Label>
              <Input
                id="customer_phone"
                value={formData.customer_phone}
                onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
              />
            </div>
          </div>

          {/* Service Details */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Service Details</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="service_type">Service Type</Label>
                <Select value={formData.service_type} onValueChange={(value) => setFormData({ ...formData, service_type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Standard Home Cleaning">Standard Home Cleaning</SelectItem>
                    <SelectItem value="Deep Cleaning">Deep Cleaning</SelectItem>
                    <SelectItem value="Move-In / Move-Out">Move-In / Move-Out</SelectItem>
                    <SelectItem value="Office Cleaning">Office Cleaning</SelectItem>
                    <SelectItem value="Post-Construction">Post-Construction</SelectItem>
                    <SelectItem value="Airbnb Cleaning">Airbnb Cleaning</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="booking_date">Date</Label>
                <Input
                  id="booking_date"
                  type="date"
                  value={formData.booking_date}
                  onChange={(e) => setFormData({ ...formData, booking_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="booking_time">Time</Label>
                <Input
                  id="booking_time"
                  type="time"
                  value={formData.booking_time}
                  onChange={(e) => setFormData({ ...formData, booking_time: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Address</h3>
            <div>
              <Label htmlFor="address_line1">Street Address</Label>
              <Input
                id="address_line1"
                value={formData.address_line1}
                onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="address_suburb">Suburb</Label>
                <Input
                  id="address_suburb"
                  value={formData.address_suburb}
                  onChange={(e) => setFormData({ ...formData, address_suburb: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="address_city">City</Label>
                <Input
                  id="address_city"
                  value={formData.address_city}
                  onChange={(e) => setFormData({ ...formData, address_city: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Payment</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="total_amount">Total Amount (R)</Label>
                <Input
                  id="total_amount"
                  type="number"
                  step="0.01"
                  value={formData.total_amount}
                  onChange={(e) => setFormData({ ...formData, total_amount: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="cleaner_earnings">Cleaner Earnings (R)</Label>
                <Input
                  id="cleaner_earnings"
                  type="number"
                  step="0.01"
                  value={formData.cleaner_earnings}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    cleaner_earnings: parseFloat(e.target.value) || 0 
                  })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Subtotal: R{(formData.total_amount - formData.service_fee).toFixed(2)} | 
                  Company gets: R{(formData.total_amount - formData.cleaner_earnings).toFixed(2)}
                </p>
              </div>
              <div>
                <Label htmlFor="payment_reference">Payment Reference</Label>
                <Input
                  id="payment_reference"
                  value={formData.payment_reference}
                  onChange={(e) => setFormData({ ...formData, payment_reference: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

