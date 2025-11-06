'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { RecurringScheduleWithCustomer, Frequency, FREQUENCY_OPTIONS, DAYS_OF_WEEK, DAYS_OF_MONTH, TIME_SLOTS } from '@/types/recurring';
import { validateRecurringSchedule } from '@/lib/recurring-bookings';
import { useEffect } from 'react';

interface Cleaner {
  id: string;
  name: string;
  is_active: boolean;
}

interface EditRecurringScheduleDialogProps {
  schedule: RecurringScheduleWithCustomer;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EXTRAS_OPTIONS = [
  'Inside Windows',
  'Inside Fridge',
  'Inside Oven',
  'Garage',
  'Patio',
  'Balcony',
  'Laundry',
  'Carpet Cleaning',
];

export function EditRecurringScheduleDialog({ 
  schedule, 
  open, 
  onClose, 
  onSuccess 
}: EditRecurringScheduleDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);

  const [formData, setFormData] = useState({
    service_type: schedule.service_type,
    frequency: schedule.frequency,
    day_of_week: schedule.day_of_week,
    day_of_month: schedule.day_of_month,
    days_of_week: schedule.days_of_week || [],
    preferred_time: schedule.preferred_time,
    bedrooms: schedule.bedrooms,
    bathrooms: schedule.bathrooms,
    extras: schedule.extras || [],
    notes: schedule.notes || '',
    address_line1: schedule.address_line1,
    address_suburb: schedule.address_suburb,
    address_city: schedule.address_city,
    cleaner_id: schedule.cleaner_id || '',
    start_date: schedule.start_date,
    end_date: schedule.end_date || '',
    is_active: schedule.is_active,
  });

  // Reset form data when schedule changes
  useEffect(() => {
    if (open && schedule) {
      setFormData({
        service_type: schedule.service_type,
        frequency: schedule.frequency,
        day_of_week: schedule.day_of_week,
        day_of_month: schedule.day_of_month,
        days_of_week: schedule.days_of_week || [],
        preferred_time: schedule.preferred_time,
        bedrooms: schedule.bedrooms,
        bathrooms: schedule.bathrooms,
        extras: schedule.extras || [],
        notes: schedule.notes || '',
        address_line1: schedule.address_line1,
        address_suburb: schedule.address_suburb,
        address_city: schedule.address_city,
        cleaner_id: schedule.cleaner_id || '',
        start_date: schedule.start_date,
        end_date: schedule.end_date || '',
        is_active: schedule.is_active,
      });
      setError(null);
    }
  }, [schedule, open]);

  // Load cleaners when dialog opens
  useEffect(() => {
    if (open) {
      loadCleaners();
    }
  }, [open]);

  const loadCleaners = async () => {
    try {
      const response = await fetch('/api/admin/cleaners');
      const data = await response.json();
      if (data.ok) {
        setCleaners(data.cleaners.filter((c: Cleaner) => c.is_active));
      }
    } catch (err) {
      console.error('Error loading cleaners:', err);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/recurring-schedules', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: schedule.id,
          ...formData,
        }),
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || 'Failed to update schedule');
      }

      onSuccess();
      onClose();

    } catch (err) {
      console.error('Error updating schedule:', err);
      setError(err instanceof Error ? err.message : 'Failed to update schedule');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = () => {
    const errors = validateRecurringSchedule(formData);
    return errors.length === 0;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Recurring Schedule</DialogTitle>
          <DialogDescription>
            Update the recurring schedule for {schedule.customer.first_name} {schedule.customer.last_name}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Error</span>
            </div>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Service Type */}
          <div className="space-y-3">
            <Label>Service Type *</Label>
            <Select
              value={formData.service_type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, service_type: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select service type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Standard">Standard Cleaning</SelectItem>
                <SelectItem value="Deep">Deep Cleaning</SelectItem>
                <SelectItem value="Move In/Out">Move In/Out</SelectItem>
                <SelectItem value="Airbnb">Airbnb Cleaning</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Frequency */}
          <div className="space-y-3">
            <Label>Frequency *</Label>
            <Select
              value={formData.frequency}
              onValueChange={(value: Frequency) => setFormData(prev => ({ ...prev, frequency: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-gray-600">{option.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Day Selection */}
          {(formData.frequency === 'weekly' || formData.frequency === 'bi-weekly') && (
            <div className="space-y-3">
              <Label>Day of Week *</Label>
              <Select
                value={formData.day_of_week?.toString()}
                onValueChange={(value) => setFormData(prev => ({ ...prev, day_of_week: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day) => (
                    <SelectItem key={day.value} value={day.value.toString()}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Multi-Day Selection for Custom Frequencies */}
          {(formData.frequency === 'custom-weekly' || formData.frequency === 'custom-bi-weekly') && (
            <div className="space-y-3">
              <Label>Select Days *</Label>
              <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-lg border">
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-day-${day.value}`}
                      checked={formData.days_of_week?.includes(day.value) || false}
                      onCheckedChange={(checked) => {
                        const currentDays = formData.days_of_week || [];
                        if (checked) {
                          setFormData(prev => ({
                            ...prev,
                            days_of_week: [...currentDays, day.value].sort((a, b) => a - b)
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            days_of_week: currentDays.filter(d => d !== day.value)
                          }));
                        }
                      }}
                    />
                    <Label
                      htmlFor={`edit-day-${day.value}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {day.label}
                    </Label>
                  </div>
                ))}
              </div>
              {formData.days_of_week && formData.days_of_week.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {formData.days_of_week.map(dayNum => {
                    const day = DAYS_OF_WEEK.find(d => d.value === dayNum);
                    return day ? (
                      <Badge key={dayNum} variant="secondary" className="text-xs">
                        {day.label}
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          )}

          {formData.frequency === 'monthly' && (
            <div className="space-y-3">
              <Label>Day of Month *</Label>
              <Select
                value={formData.day_of_month?.toString()}
                onValueChange={(value) => setFormData(prev => ({ ...prev, day_of_month: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_MONTH.map((day) => (
                    <SelectItem key={day.value} value={day.value.toString()}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Time */}
          <div className="space-y-3">
            <Label>Preferred Time *</Label>
            <Select
              value={formData.preferred_time}
              onValueChange={(value) => setFormData(prev => ({ ...prev, preferred_time: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                {TIME_SLOTS.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Home Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label>Bedrooms *</Label>
              <Input
                type="number"
                min="1"
                value={formData.bedrooms}
                onChange={(e) => setFormData(prev => ({ ...prev, bedrooms: parseInt(e.target.value) || 1 }))}
              />
            </div>
            <div className="space-y-3">
              <Label>Bathrooms *</Label>
              <Input
                type="number"
                min="1"
                value={formData.bathrooms}
                onChange={(e) => setFormData(prev => ({ ...prev, bathrooms: parseInt(e.target.value) || 1 }))}
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-3">
            <Label>Address *</Label>
            <Input
              placeholder="Street address"
              value={formData.address_line1}
              onChange={(e) => setFormData(prev => ({ ...prev, address_line1: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Suburb"
                value={formData.address_suburb}
                onChange={(e) => setFormData(prev => ({ ...prev, address_suburb: e.target.value }))}
              />
              <Input
                placeholder="City"
                value={formData.address_city}
                onChange={(e) => setFormData(prev => ({ ...prev, address_city: e.target.value }))}
              />
            </div>
          </div>

          {/* Cleaner Assignment */}
          <div className="space-y-3">
            <Label>Assign Cleaner (Optional)</Label>
            <Select
              value={formData.cleaner_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, cleaner_id: value || '' }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a cleaner (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No cleaner assigned</SelectItem>
                {cleaners.map((cleaner) => (
                  <SelectItem key={cleaner.id} value={cleaner.id}>
                    {cleaner.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Extras */}
          <div className="space-y-3">
            <Label>Extras</Label>
            <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-lg border">
              {EXTRAS_OPTIONS.map((extra) => (
                <div key={extra} className="flex items-center space-x-2">
                  <Checkbox
                    id={`edit-extra-${extra}`}
                    checked={formData.extras?.includes(extra) || false}
                    onCheckedChange={(checked) => {
                      const currentExtras = formData.extras || [];
                      if (checked) {
                        setFormData(prev => ({
                          ...prev,
                          extras: [...currentExtras, extra]
                        }));
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          extras: currentExtras.filter(e => e !== extra)
                        }));
                      }
                    }}
                  />
                  <Label
                    htmlFor={`edit-extra-${extra}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {extra}
                  </Label>
                </div>
              ))}
            </div>
            {formData.extras && formData.extras.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {formData.extras.map(extra => (
                  <Badge key={extra} variant="secondary" className="text-xs">
                    {extra}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label>Start Date *</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
              />
            </div>
            <div className="space-y-3">
              <Label>End Date (Optional)</Label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
              />
            </div>
          </div>

          {/* Status */}
          <div className="space-y-3">
            <Label>Status</Label>
            <Select
              value={formData.is_active ? 'active' : 'inactive'}
              onValueChange={(value) => setFormData(prev => ({ ...prev, is_active: value === 'active' }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-3">
            <Label>Notes</Label>
            <Textarea
              placeholder="Additional notes or special instructions..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isFormValid() || isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Update Schedule
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
