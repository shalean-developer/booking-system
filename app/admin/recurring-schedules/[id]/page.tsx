'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/admin/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/admin/shared/loading-state';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { generateTimeSlots } from '@/lib/pricing';
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import Link from 'next/link';

type ServiceType = 'Standard' | 'Deep' | 'Move In/Out' | 'Airbnb';
type Frequency = 'weekly' | 'bi-weekly' | 'monthly' | 'custom-weekly' | 'custom-bi-weekly';

const SERVICE_EXTRAS: Record<ServiceType, string[]> = {
  'Standard': ['Inside Fridge', 'Inside Oven', 'Inside Cabinets', 'Interior Windows', 'Interior Walls', 'Laundry & Ironing'],
  'Deep': ['Inside Fridge', 'Inside Oven', 'Inside Cabinets', 'Interior Windows', 'Interior Walls', 'Laundry & Ironing', 'Carpet Cleaning', 'Ceiling Cleaning', 'Garage Cleaning', 'Balcony Cleaning', 'Couch Cleaning', 'Outside Window Cleaning'],
  'Move In/Out': ['Inside Fridge', 'Inside Oven', 'Inside Cabinets', 'Interior Windows', 'Interior Walls', 'Laundry & Ironing', 'Carpet Cleaning', 'Ceiling Cleaning', 'Garage Cleaning', 'Balcony Cleaning', 'Couch Cleaning', 'Outside Window Cleaning'],
  'Airbnb': ['Inside Fridge', 'Inside Oven', 'Inside Cabinets', 'Interior Windows', 'Interior Walls', 'Laundry & Ironing'],
};

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function EditRecurringSchedulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdatingBookings, setIsUpdatingBookings] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [updateFutureOnly, setUpdateFutureOnly] = useState(true);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateMonth, setGenerateMonth] = useState('');
  const [generateYear, setGenerateYear] = useState('');

  // Form state
  const [serviceType, setServiceType] = useState<ServiceType | ''>('');
  const [bedrooms, setBedrooms] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [frequency, setFrequency] = useState<Frequency>('weekly');
  const [dayOfWeek, setDayOfWeek] = useState<number | undefined>(undefined);
  const [dayOfMonth, setDayOfMonth] = useState<number | undefined>(undefined);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [preferredTime, setPreferredTime] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [notes, setNotes] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressSuburb, setAddressSuburb] = useState('');
  const [addressCity, setAddressCity] = useState('');
  const [cleanerId, setCleanerId] = useState<string>('');
  const [availableCleaners, setAvailableCleaners] = useState<Array<{ id: string; name: string }>>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [totalAmount, setTotalAmount] = useState<string>('');
  const [cleanerEarnings, setCleanerEarnings] = useState<string>('');

  useEffect(() => {
    if (id === 'new') {
      router.push('/admin/recurring-schedules/new');
      return;
    }
    fetchSchedule();
    fetchCleaners();
    
    // Set default month/year to next month
    const today = new Date();
    const nextMonth = today.getMonth() === 11 ? 1 : today.getMonth() + 2;
    const nextYear = today.getMonth() === 11 ? today.getFullYear() + 1 : today.getFullYear();
    setGenerateMonth(String(nextMonth).padStart(2, '0'));
    setGenerateYear(String(nextYear));
  }, [id, router]);

  const fetchSchedule = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/recurring-schedules/${id}`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (data.ok && data.schedule) {
        const schedule = data.schedule;
        setServiceType(schedule.service_type || '');
        setBedrooms(schedule.bedrooms || 1);
        setBathrooms(schedule.bathrooms || 1);
        setSelectedExtras(schedule.extras || []);
        setFrequency(schedule.frequency || 'weekly');
        setDayOfWeek(schedule.day_of_week);
        setDayOfMonth(schedule.day_of_month);
        setDaysOfWeek(schedule.days_of_week || []);
        setPreferredTime(schedule.preferred_time || '');
        setStartDate(schedule.start_date || '');
        setEndDate(schedule.end_date || '');
        setIsActive(schedule.is_active !== false);
        setNotes(schedule.notes || '');
        setAddressLine1(schedule.address_line1 || '');
        setAddressSuburb(schedule.address_suburb || '');
        setAddressCity(schedule.address_city || '');
        setCleanerId(schedule.cleaner_id || 'unassigned');
        setCustomerName(schedule.customer_name || '');
        setCustomerEmail(schedule.customer_email || '');
        // Set price fields (convert from cents to rands for display)
        setTotalAmount(schedule.total_amount ? (schedule.total_amount / 100).toFixed(2) : '');
        setCleanerEarnings(schedule.cleaner_earnings ? (schedule.cleaner_earnings / 100).toFixed(2) : '');
      } else {
        alert(data.error || 'Failed to fetch recurring schedule');
        router.push('/admin/recurring-schedules');
      }
    } catch (error) {
      console.error('Error fetching recurring schedule:', error);
      alert('Failed to load recurring schedule');
      router.push('/admin/recurring-schedules');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCleaners = async () => {
    try {
      const response = await fetch('/api/admin/cleaners', {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.ok && data.cleaners) {
        setAvailableCleaners(data.cleaners);
      }
    } catch (error) {
      console.error('Error fetching cleaners:', error);
    }
  };

  const handleExtraToggle = (extra: string) => {
    setSelectedExtras((prev) => {
      if (prev.includes(extra)) {
        return prev.filter((e) => e !== extra);
      } else {
        return [...prev, extra];
      }
    });
  };

  const handleDayOfWeekToggle = (day: number) => {
    setDaysOfWeek((prev) => {
      if (prev.includes(day)) {
        return prev.filter((d) => d !== day);
      } else {
        return [...prev, day].sort();
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const updateData: any = {
        service_type: serviceType,
        bedrooms,
        bathrooms,
        extras: selectedExtras,
        frequency,
        preferred_time: preferredTime,
        start_date: startDate,
        end_date: endDate || null,
        is_active: isActive,
        notes,
        address_line1: addressLine1,
        address_suburb: addressSuburb,
        address_city: addressCity,
        cleaner_id: cleanerId === 'unassigned' ? null : cleanerId || null,
      };

      // Add price fields if provided (convert from rands to cents)
      if (totalAmount && !isNaN(parseFloat(totalAmount))) {
        updateData.total_amount = Math.round(parseFloat(totalAmount) * 100);
      }
      if (cleanerEarnings && !isNaN(parseFloat(cleanerEarnings))) {
        updateData.cleaner_earnings = Math.round(parseFloat(cleanerEarnings) * 100);
      }

      // Add frequency-specific fields
      if (frequency === 'weekly' || frequency === 'bi-weekly') {
        updateData.day_of_week = dayOfWeek;
        updateData.day_of_month = null;
        updateData.days_of_week = null;
      } else if (frequency === 'monthly') {
        updateData.day_of_month = dayOfMonth;
        updateData.day_of_week = null;
        updateData.days_of_week = null;
      } else if (frequency === 'custom-weekly' || frequency === 'custom-bi-weekly') {
        updateData.days_of_week = daysOfWeek;
        updateData.day_of_week = null;
        updateData.day_of_month = null;
      }

      const response = await fetch(`/api/admin/recurring-schedules/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (data.ok) {
        // If pricing was updated, ask if user wants to update existing bookings
        if ((totalAmount && !isNaN(parseFloat(totalAmount))) || 
            (cleanerEarnings && !isNaN(parseFloat(cleanerEarnings)))) {
          setShowUpdateDialog(true);
        } else {
          router.push('/admin/recurring-schedules');
        }
      } else {
        alert(data.error || 'Failed to update recurring schedule');
      }
    } catch (error) {
      console.error('Error updating recurring schedule:', error);
      alert('Failed to update recurring schedule');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateBookings = async () => {
    setIsUpdatingBookings(true);
    try {
      const response = await fetch(`/api/admin/recurring-schedules/${id}/update-bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          updateFutureOnly: updateFutureOnly,
          updateAll: !updateFutureOnly,
        }),
      });

      // Check if response is ok before parsing JSON
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to update bookings' }));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();

      if (data.ok) {
        alert(`Successfully updated ${data.updatedCount} booking(s)`);
        setShowUpdateDialog(false);
        router.push('/admin/recurring-schedules');
      } else {
        // Show more detailed error message
        const errorMsg = data.error || 'Failed to update bookings';
        const details = data.details ? `\n\nDetails: ${data.details}` : '';
        const failedCount = data.failedCount ? `\n\n${data.failedCount} booking(s) failed to update.` : '';
        alert(errorMsg + details + failedCount);
      }
    } catch (error: any) {
      console.error('Error updating bookings:', error);
      const errorMessage = error.message || 'Failed to update bookings. Please check the console for details.';
      alert(errorMessage);
    } finally {
      setIsUpdatingBookings(false);
    }
  };

  const handleGenerateBookings = async () => {
    if (!generateMonth || !generateYear) {
      alert('Please select a month and year');
      return;
    }

    const yearNum = parseInt(generateYear);
    const monthNum = parseInt(generateMonth);

    if (isNaN(yearNum) || isNaN(monthNum)) {
      alert('Please enter valid year and month values');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch(`/api/admin/recurring-schedules/${id}/generate-bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          year: yearNum,
          month: monthNum,
        }),
      }).catch((fetchError) => {
        // Handle network errors
        console.error('Network error:', fetchError);
        throw new Error(`Network error: ${fetchError.message || 'Failed to connect to server. Please check your connection and try again.'}`);
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: `Server error: ${response.status} ${response.statusText}` };
        }
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();

      if (data.ok) {
        const message = data.generatedCount > 0
          ? `Successfully generated ${data.generatedCount} booking(s) for ${data.monthYear}${data.skippedCount > 0 ? ` (${data.skippedCount} already existed)` : ''}`
          : data.message || `No bookings generated for ${data.monthYear}`;
        alert(message);
        setShowGenerateDialog(false);
        // Refresh the page to show new bookings
        router.refresh();
      } else {
        alert(data.error || 'Failed to generate bookings');
      }
    } catch (error: any) {
      console.error('Error generating bookings:', error);
      const errorMessage = error.message || 'Failed to generate bookings. Please check the console for details.';
      alert(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Edit Recurring Schedule"
          breadcrumbs={[
            { label: 'Admin', href: '/admin' },
            { label: 'Recurring Schedules', href: '/admin/recurring-schedules' },
            { label: 'Edit' },
          ]}
        />
        <LoadingState variant="cards" />
      </div>
    );
  }

  const availableExtras = serviceType ? SERVICE_EXTRAS[serviceType as ServiceType] || [] : [];
  const timeSlots = generateTimeSlots();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Recurring Schedule"
        description={`Editing schedule ${id}`}
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Recurring Schedules', href: '/admin/recurring-schedules' },
          { label: 'Edit' },
        ]}
        actions={
          <Button variant="outline" asChild>
            <Link href="/admin/recurring-schedules">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancel
            </Link>
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Info (Read-only) */}
        <Card>
          <CardHeader>
            <CardTitle>Customer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Customer Name</Label>
                <Input value={customerName} readOnly className="bg-gray-100" />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={customerEmail} readOnly className="bg-gray-100" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Details */}
        <Card>
          <CardHeader>
            <CardTitle>Service Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="service">Service Type *</Label>
                <Select value={serviceType} onValueChange={(value) => setServiceType(value as ServiceType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Standard">Standard</SelectItem>
                    <SelectItem value="Deep">Deep</SelectItem>
                    <SelectItem value="Move In/Out">Move In/Out</SelectItem>
                    <SelectItem value="Airbnb">Airbnb</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="bedrooms">Bedrooms *</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  min="1"
                  value={bedrooms}
                  onChange={(e) => setBedrooms(parseInt(e.target.value) || 1)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="bathrooms">Bathrooms *</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  min="1"
                  value={bathrooms}
                  onChange={(e) => setBathrooms(parseInt(e.target.value) || 1)}
                  required
                />
              </div>
            </div>

            {serviceType && (
              <div>
                <Label>Extras</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                  {availableExtras.map((extra) => (
                    <div key={extra} className="flex items-center space-x-2">
                      <Checkbox
                        id={extra}
                        checked={selectedExtras.includes(extra)}
                        onCheckedChange={() => handleExtraToggle(extra)}
                      />
                      <Label htmlFor={extra} className="cursor-pointer">
                        {extra}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Schedule Details */}
        <Card>
          <CardHeader>
            <CardTitle>Schedule Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="frequency">Frequency *</Label>
                <Select value={frequency} onValueChange={(value) => setFrequency(value as Frequency)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="custom-weekly">Custom Weekly</SelectItem>
                    <SelectItem value="custom-bi-weekly">Custom Bi-weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="preferredTime">Preferred Time *</Label>
                <Select value={preferredTime} onValueChange={setPreferredTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((slot) => (
                      <SelectItem key={slot} value={slot}>
                        {slot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Day selection based on frequency */}
            {(frequency === 'weekly' || frequency === 'bi-weekly') && (
              <div>
                <Label htmlFor="dayOfWeek">Day of Week *</Label>
                <Select
                  value={dayOfWeek?.toString() || ''}
                  onValueChange={(value) => setDayOfWeek(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    {DAY_LABELS.map((day, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {frequency === 'monthly' && (
              <div>
                <Label htmlFor="dayOfMonth">Day of Month *</Label>
                <Input
                  id="dayOfMonth"
                  type="number"
                  min="1"
                  max="31"
                  value={dayOfMonth || ''}
                  onChange={(e) => setDayOfMonth(parseInt(e.target.value) || undefined)}
                  required
                />
              </div>
            )}

            {(frequency === 'custom-weekly' || frequency === 'custom-bi-weekly') && (
              <div>
                <Label>Days of Week *</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                  {DAY_LABELS.map((day, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Checkbox
                        id={`day-${index}`}
                        checked={daysOfWeek.includes(index)}
                        onCheckedChange={() => handleDayOfWeekToggle(index)}
                      />
                      <Label htmlFor={`day-${index}`} className="cursor-pointer">
                        {day}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date (Optional)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={isActive}
                onCheckedChange={(checked) => setIsActive(checked === true)}
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Active Schedule
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle>Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="addressLine1">Address Line 1 *</Label>
              <Input
                id="addressLine1"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="addressSuburb">Suburb *</Label>
                <Input
                  id="addressSuburb"
                  value={addressSuburb}
                  onChange={(e) => setAddressSuburb(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="addressCity">City *</Label>
                <Input
                  id="addressCity"
                  value={addressCity}
                  onChange={(e) => setAddressCity(e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cleaner Assignment */}
        <Card>
          <CardHeader>
            <CardTitle>Cleaner Assignment</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="cleaner">Cleaner</Label>
              <Select value={cleanerId || 'unassigned'} onValueChange={setCleanerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select cleaner or leave unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {availableCleaners.map((cleaner) => (
                    <SelectItem key={cleaner.id} value={cleaner.id}>
                      {cleaner.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
            <CardDescription>
              Set default pricing for bookings generated from this schedule. Leave empty to use automatic pricing.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="totalAmount">Total Amount (R)</Label>
                <Input
                  id="totalAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  placeholder="Leave empty for auto pricing"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Total price per booking in Rands
                </p>
              </div>
              <div>
                <Label htmlFor="cleanerEarnings">Cleaner Earnings (R)</Label>
                <Input
                  id="cleanerEarnings"
                  type="number"
                  step="0.01"
                  min="0"
                  value={cleanerEarnings}
                  onChange={(e) => setCleanerEarnings(e.target.value)}
                  placeholder="Leave empty for auto calculation"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Amount cleaner earns per booking in Rands
                </p>
              </div>
            </div>
            {totalAmount && cleanerEarnings && (
              <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                <div className="text-sm font-medium text-blue-900 mb-1">Pricing Summary</div>
                <div className="text-xs text-blue-700 space-y-1">
                  <div>Total Amount: R{parseFloat(totalAmount || '0').toFixed(2)}</div>
                  <div>Cleaner Earnings: R{parseFloat(cleanerEarnings || '0').toFixed(2)}</div>
                  <div className="font-semibold">
                    Company Earnings: R{(parseFloat(totalAmount || '0') - parseFloat(cleanerEarnings || '0')).toFixed(2)}
                  </div>
                </div>
              </div>
            )}
            {totalAmount && cleanerEarnings && (
              <div className="pt-2 border-t">
                <p className="text-xs text-gray-600 mb-2">
                  After saving, you can update existing bookings with the new pricing.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special instructions or notes..."
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-between items-center gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowGenerateDialog(true)}
            disabled={isSubmitting || !isActive}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Generate Bookings
          </Button>
          <div className="flex gap-4">
            <Button type="button" variant="outline" asChild>
              <Link href="/admin/recurring-schedules">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* Update Bookings Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Existing Bookings?</DialogTitle>
            <DialogDescription>
              You've updated the pricing for this recurring schedule. Would you like to update existing bookings with the new pricing?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="futureOnly"
                name="updateScope"
                checked={updateFutureOnly}
                onChange={() => setUpdateFutureOnly(true)}
                className="h-4 w-4"
              />
              <Label htmlFor="futureOnly" className="cursor-pointer">
                Update future bookings only (recommended)
                <p className="text-xs text-gray-500 mt-1">
                  Only updates pending, accepted, and future bookings. Completed bookings remain unchanged.
                </p>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="updateAll"
                name="updateScope"
                checked={!updateFutureOnly}
                onChange={() => setUpdateFutureOnly(false)}
                className="h-4 w-4"
              />
              <Label htmlFor="updateAll" className="cursor-pointer">
                Update all bookings (including completed)
                <p className="text-xs text-gray-500 mt-1">
                  Updates all bookings including completed ones. Use with caution.
                </p>
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowUpdateDialog(false);
                router.push('/admin/recurring-schedules');
              }}
              disabled={isUpdatingBookings}
            >
              Skip
            </Button>
            <Button
              onClick={handleUpdateBookings}
              disabled={isUpdatingBookings}
            >
              {isUpdatingBookings ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Update Bookings
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Bookings Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Bookings</DialogTitle>
            <DialogDescription>
              Generate bookings for this recurring schedule for a specific month. Existing bookings for the same dates will be skipped.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="generateYear">Year</Label>
                <Input
                  id="generateYear"
                  type="number"
                  min="2024"
                  max="2100"
                  value={generateYear}
                  onChange={(e) => setGenerateYear(e.target.value)}
                  placeholder="2024"
                />
              </div>
              <div>
                <Label htmlFor="generateMonth">Month</Label>
                <Select value={generateMonth} onValueChange={setGenerateMonth}>
                  <SelectTrigger id="generateMonth">
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="01">January</SelectItem>
                    <SelectItem value="02">February</SelectItem>
                    <SelectItem value="03">March</SelectItem>
                    <SelectItem value="04">April</SelectItem>
                    <SelectItem value="05">May</SelectItem>
                    <SelectItem value="06">June</SelectItem>
                    <SelectItem value="07">July</SelectItem>
                    <SelectItem value="08">August</SelectItem>
                    <SelectItem value="09">September</SelectItem>
                    <SelectItem value="10">October</SelectItem>
                    <SelectItem value="11">November</SelectItem>
                    <SelectItem value="12">December</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
              <p className="text-sm text-blue-900">
                This will create bookings based on the schedule's frequency and settings. Only dates within the schedule's start and end dates will be used.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowGenerateDialog(false)}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerateBookings}
              disabled={isGenerating || !generateMonth || !generateYear}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Generate Bookings
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

