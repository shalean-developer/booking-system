'use client';

import { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, DollarSign, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface BookingAdjustmentsDialogProps {
  booking: {
    id: string;
    booking_date: string;
    booking_time: string;
    cleaner_earnings: number;
    cleaner_name?: string | null;
  } | null;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function BookingAdjustmentsDialog({
  booking,
  open,
  onClose,
  onSuccess,
}: BookingAdjustmentsDialogProps) {
  const [activeTab, setActiveTab] = useState<'earnings' | 'schedule'>('earnings');
  
  // Earnings adjustment state
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [earningsReason, setEarningsReason] = useState('');
  const [earningsNotes, setEarningsNotes] = useState('');
  const [isAdjustingEarnings, setIsAdjustingEarnings] = useState(false);

  // Schedule adjustment state
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [scheduleReason, setScheduleReason] = useState('');
  const [scheduleNotes, setScheduleNotes] = useState('');
  const [isAdjustingSchedule, setIsAdjustingSchedule] = useState(false);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open && booking) {
      setNewDate(booking.booking_date);
      setNewTime(booking.booking_time);
      setAdjustmentAmount('');
      setEarningsReason('');
      setEarningsNotes('');
      setScheduleReason('');
      setScheduleNotes('');
    }
  }, [open, booking]);

  const handleEarningsAdjustment = async () => {
    if (!booking) return;

    const amount = parseFloat(adjustmentAmount);
    if (isNaN(amount) || amount === 0) {
      alert('Please enter a valid adjustment amount');
      return;
    }

    if (!earningsReason.trim()) {
      alert('Please provide a reason for the adjustment');
      return;
    }

    setIsAdjustingEarnings(true);
    try {
      const response = await fetch(`/api/admin/bookings/${booking.id}/adjust-earnings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adjustmentAmount: Math.round(amount * 100), // Convert to cents
          reason: earningsReason,
          notes: earningsNotes,
        }),
      });

      const data = await response.json();
      if (data.ok) {
        alert(`Earnings adjusted successfully. New earnings: R${data.newEarnings.toFixed(2)}`);
        setAdjustmentAmount('');
        setEarningsReason('');
        setEarningsNotes('');
        onSuccess?.();
        onClose();
      } else {
        alert(`Failed to adjust earnings: ${data.error}`);
      }
    } catch (err) {
      console.error('Error adjusting earnings:', err);
      alert('An error occurred while adjusting earnings');
    } finally {
      setIsAdjustingEarnings(false);
    }
  };

  const handleScheduleAdjustment = async () => {
    if (!booking) return;

    if (!newDate || !newTime) {
      alert('Please select both date and time');
      return;
    }

    if (!scheduleReason.trim()) {
      alert('Please provide a reason for the schedule change');
      return;
    }

    setIsAdjustingSchedule(true);
    try {
      const response = await fetch(`/api/admin/bookings/${booking.id}/adjust-schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingDate: newDate,
          bookingTime: newTime,
          reason: scheduleReason,
          notes: scheduleNotes,
        }),
      });

      const data = await response.json();
      if (data.ok) {
        alert(`Schedule adjusted successfully. New date/time: ${newDate} ${newTime}`);
        setScheduleReason('');
        setScheduleNotes('');
        onSuccess?.();
        onClose();
      } else {
        alert(`Failed to adjust schedule: ${data.error}`);
      }
    } catch (err) {
      console.error('Error adjusting schedule:', err);
      alert('An error occurred while adjusting schedule');
    } finally {
      setIsAdjustingSchedule(false);
    }
  };

  if (!booking) return null;

  const currentEarnings = booking.cleaner_earnings / 100;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Adjust Booking</DialogTitle>
          <DialogDescription>
            Make administrative adjustments to booking {booking.id}
            {booking.cleaner_name && ` (Cleaner: ${booking.cleaner_name})`}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'earnings' | 'schedule')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="earnings" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Earnings
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Schedule
            </TabsTrigger>
          </TabsList>

          <TabsContent value="earnings" className="space-y-4 mt-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Current Cleaner Earnings</div>
              <div className="text-2xl font-bold text-gray-900">R{currentEarnings.toFixed(2)}</div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="adjustmentAmount">Adjustment Amount (R)</Label>
                <Input
                  id="adjustmentAmount"
                  type="number"
                  step="0.01"
                  value={adjustmentAmount}
                  onChange={(e) => setAdjustmentAmount(e.target.value)}
                  placeholder="e.g., -50.00 or +100.00"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter positive amount to increase, negative to decrease
                </p>
              </div>

              <div>
                <Label htmlFor="earningsReason">Reason *</Label>
                <Input
                  id="earningsReason"
                  value={earningsReason}
                  onChange={(e) => setEarningsReason(e.target.value)}
                  placeholder="e.g., Bonus for exceptional service"
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="earningsNotes">Additional Notes</Label>
                <Textarea
                  id="earningsNotes"
                  value={earningsNotes}
                  onChange={(e) => setEarningsNotes(e.target.value)}
                  placeholder="Optional additional details..."
                  rows={3}
                  className="mt-1"
                />
              </div>

              {adjustmentAmount && !isNaN(parseFloat(adjustmentAmount)) && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm text-gray-600">New Earnings Will Be:</div>
                  <div className="text-lg font-bold text-blue-900">
                    R{(currentEarnings + parseFloat(adjustmentAmount || '0')).toFixed(2)}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4 mt-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Current Schedule</div>
              <div className="text-lg font-semibold text-gray-900">
                {format(new Date(booking.booking_date), 'EEEE, MMMM d, yyyy')} at {booking.booking_time}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="newDate">New Date *</Label>
                <Input
                  id="newDate"
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="newTime">New Time *</Label>
                <Input
                  id="newTime"
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="scheduleReason">Reason *</Label>
                <Input
                  id="scheduleReason"
                  value={scheduleReason}
                  onChange={(e) => setScheduleReason(e.target.value)}
                  placeholder="e.g., Customer requested reschedule"
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="scheduleNotes">Additional Notes</Label>
                <Textarea
                  id="scheduleNotes"
                  value={scheduleNotes}
                  onChange={(e) => setScheduleNotes(e.target.value)}
                  placeholder="Optional additional details..."
                  rows={3}
                  className="mt-1"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {activeTab === 'earnings' ? (
            <Button
              onClick={handleEarningsAdjustment}
              disabled={isAdjustingEarnings || !adjustmentAmount || !earningsReason.trim()}
            >
              {isAdjustingEarnings ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adjusting...
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Adjust Earnings
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleScheduleAdjustment}
              disabled={isAdjustingSchedule || !newDate || !newTime || !scheduleReason.trim()}
            >
              {isAdjustingSchedule ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adjusting...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Adjust Schedule
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

