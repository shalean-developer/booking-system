'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  Clock, 
  Home, 
  User, 
  MapPin, 
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { CreateBookingFormData, BookingType, Frequency, FREQUENCY_OPTIONS, DAYS_OF_WEEK, DAYS_OF_MONTH, TIME_SLOTS } from '@/types/recurring';
import { validateRecurringSchedule } from '@/lib/recurring-bookings';

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address_line1?: string;
  address_suburb?: string;
  address_city?: string;
}

interface Cleaner {
  id: string;
  name: string;
  is_active: boolean;
}

interface CreateBookingDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateBookingDialog({ open, onClose, onSuccess }: CreateBookingDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState<CreateBookingFormData>({
    booking_type: 'one-time',
    customer_id: '',
    service_type: '',
    bedrooms: 1,
    bathrooms: 1,
    extras: [],
    notes: '',
    address_line1: '',
    address_suburb: '',
    address_city: '',
    cleaner_id: '',
    booking_date: '',
    booking_time: '',
    frequency: 'weekly',
    day_of_week: 1,
    day_of_month: 1,
    days_of_week: [],
    preferred_time: '',
    start_date: '',
    end_date: '',
    generate_current_month: false,
  });

  // Load customers and cleaners on mount
  useEffect(() => {
    if (open) {
      loadCustomers();
      loadCleaners();
    }
  }, [open]);

  const loadCustomers = async () => {
    try {
      const response = await fetch('/api/admin/customers');
      const data = await response.json();
      if (data.ok) {
        setCustomers(data.customers);
      }
    } catch (err) {
      console.error('Error loading customers:', err);
    }
  };

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

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData(prev => ({
      ...prev,
      customer_id: customer.id,
      address_line1: customer.address_line1 || '',
      address_suburb: customer.address_suburb || '',
      address_city: customer.address_city || '',
    }));
    setSearchQuery('');
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/bookings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!data.ok) {
        const errorMsg = data.details ? `${data.error}: ${data.details}` : data.error || 'Failed to create booking';
        throw new Error(errorMsg);
      }

      onSuccess();
      onClose();
      resetForm();

    } catch (err) {
      console.error('Error creating booking:', err);
      setError(err instanceof Error ? err.message : 'Failed to create booking');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      booking_type: 'one-time',
      customer_id: '',
      service_type: '',
      bedrooms: 1,
      bathrooms: 1,
      extras: [],
      notes: '',
      address_line1: '',
      address_suburb: '',
      address_city: '',
      cleaner_id: '',
      booking_date: '',
      booking_time: '',
      frequency: 'weekly',
      day_of_week: 1,
      day_of_month: 1,
      preferred_time: '',
      start_date: '',
      end_date: '',
      generate_current_month: false,
    });
    setSelectedCustomer(null);
    setSearchQuery('');
    setError(null);
  };

  const filteredCustomers = customers.filter(customer =>
    `${customer.first_name} ${customer.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isFormValid = () => {
    if (!formData.customer_id || !formData.service_type) return false;
    
    if (formData.booking_type === 'one-time') {
      return formData.booking_date && formData.booking_time;
    } else {
      const errors = validateRecurringSchedule(formData);
      return errors.length === 0;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Booking</DialogTitle>
          <DialogDescription>
            Create a one-time booking or set up a recurring schedule for a customer.
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
          {/* Booking Type Selection */}
          <div className="space-y-3">
            <Label>Booking Type</Label>
            <div className="flex gap-4">
              <Button
                type="button"
                variant={formData.booking_type === 'one-time' ? 'default' : 'outline'}
                onClick={() => setFormData(prev => ({ ...prev, booking_type: 'one-time' }))}
                className="flex-1"
              >
                One-Time Booking
              </Button>
              <Button
                type="button"
                variant={formData.booking_type === 'recurring' ? 'default' : 'outline'}
                onClick={() => setFormData(prev => ({ ...prev, booking_type: 'recurring' }))}
                className="flex-1"
              >
                Recurring Schedule
              </Button>
            </div>
          </div>

          {/* Customer Selection */}
          <div className="space-y-3">
            <Label>Customer *</Label>
            <div className="relative">
              <Input
                placeholder="Search customers by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchQuery('')}
              />
              {searchQuery && filteredCustomers.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredCustomers.map((customer) => (
                    <button
                      key={customer.id}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      onClick={() => handleCustomerSelect(customer)}
                    >
                      <div className="font-medium">{customer.first_name} {customer.last_name}</div>
                      <div className="text-sm text-gray-600">{customer.email}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedCustomer && (
              <Card className="p-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{selectedCustomer.first_name} {selectedCustomer.last_name}</span>
                  <Badge variant="outline">{selectedCustomer.email}</Badge>
                </div>
              </Card>
            )}
          </div>

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
            <Label>Cleaner Assignment</Label>
            <Select
              value={formData.cleaner_id || 'manual'}
              onValueChange={(value) => setFormData(prev => ({ ...prev, cleaner_id: value === 'manual' ? '' : value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select cleaner (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual Assignment</SelectItem>
                {cleaners.map((cleaner) => (
                  <SelectItem key={cleaner.id} value={cleaner.id}>
                    {cleaner.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* One-Time Booking Fields */}
          {formData.booking_type === 'one-time' && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Booking Details
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label>Date *</Label>
                    <Input
                      type="date"
                      value={formData.booking_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, booking_date: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-3">
                    <Label>Time *</Label>
                    <Select
                      value={formData.booking_time}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, booking_time: value }))}
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
                </div>
              </div>
            </>
          )}

          {/* Recurring Schedule Fields */}
          {formData.booking_type === 'recurring' && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recurring Schedule
                </h3>

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
                            id={`day-${day.value}`}
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
                            htmlFor={`day-${day.value}`}
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

                {/* Generate Current Month */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="generate-current-month"
                    checked={formData.generate_current_month}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, generate_current_month: !!checked }))}
                  />
                  <Label htmlFor="generate-current-month" className="text-sm">
                    Generate bookings for current month
                  </Label>
                </div>
              </div>
            </>
          )}

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
                Creating...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Create {formData.booking_type === 'one-time' ? 'Booking' : 'Schedule'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
