'use client';

import { useState, useEffect } from 'react';
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
import { generateTimeSlots } from '@/lib/pricing';
import { ArrowLeft, Loader2, Search } from 'lucide-react';
import Link from 'next/link';

type ServiceType = 'Standard' | 'Deep' | 'Move In/Out' | 'Airbnb';
type Frequency = 'weekly' | 'bi-weekly' | 'monthly' | 'custom-weekly' | 'custom-bi-weekly';

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
}

const SERVICE_EXTRAS: Record<ServiceType, string[]> = {
  'Standard': ['Inside Fridge', 'Inside Oven', 'Inside Cabinets', 'Interior Windows', 'Interior Walls', 'Laundry & Ironing'],
  'Deep': ['Inside Fridge', 'Inside Oven', 'Inside Cabinets', 'Interior Windows', 'Interior Walls', 'Laundry & Ironing', 'Carpet Cleaning', 'Ceiling Cleaning', 'Garage Cleaning', 'Balcony Cleaning', 'Couch Cleaning', 'Outside Window Cleaning'],
  'Move In/Out': ['Inside Fridge', 'Inside Oven', 'Inside Cabinets', 'Interior Windows', 'Interior Walls', 'Laundry & Ironing', 'Carpet Cleaning', 'Ceiling Cleaning', 'Garage Cleaning', 'Balcony Cleaning', 'Couch Cleaning', 'Outside Window Cleaning'],
  'Airbnb': ['Inside Fridge', 'Inside Oven', 'Inside Cabinets', 'Interior Windows', 'Interior Walls', 'Laundry & Ironing'],
};

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function NewRecurringSchedulePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [customerId, setCustomerId] = useState<string>('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
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
  const [cleanerId, setCleanerId] = useState<string>('unassigned');
  const [availableCleaners, setAvailableCleaners] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    fetchCleaners();
  }, []);

  useEffect(() => {
    if (customerSearch.length >= 2) {
      const timeoutId = setTimeout(() => {
        searchCustomers();
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setCustomers([]);
      setIsLoadingCustomers(false);
    }
  }, [customerSearch]);

  const searchCustomers = async () => {
    if (!customerSearch || customerSearch.length < 2) {
      setCustomers([]);
      return;
    }
    
    setIsLoadingCustomers(true);
    try {
      const response = await fetch(`/api/admin/customers?search=${encodeURIComponent(customerSearch)}&limit=10`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        console.error('Customer search failed:', errorMessage);
        setCustomers([]);
        return;
      }
      
      const data = await response.json();
      
      if (data.ok && data.customers) {
        setCustomers(data.customers);
      } else {
        console.error('Search failed:', data.error);
        setCustomers([]);
      }
    } catch (error: any) {
      console.error('Error searching customers:', error);
      setCustomers([]);
    } finally {
      setIsLoadingCustomers(false);
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

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerId(customer.id);
    setCustomerSearch(`${customer.first_name} ${customer.last_name}`.trim());
    setCustomers([]);
    setIsLoadingCustomers(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerId) {
      alert('Please select a customer');
      return;
    }

    setIsSubmitting(true);

    try {
      const updateData: any = {
        customer_id: customerId,
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

      const response = await fetch('/api/admin/recurring-schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (data.ok) {
        router.push('/admin/recurring-schedules');
      } else {
        alert(data.error || 'Failed to create recurring schedule');
      }
    } catch (error) {
      console.error('Error creating recurring schedule:', error);
      alert('Failed to create recurring schedule');
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableExtras = serviceType ? SERVICE_EXTRAS[serviceType as ServiceType] || [] : [];
  const timeSlots = generateTimeSlots();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Recurring Schedule"
        description="Create a new recurring booking schedule"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Recurring Schedules', href: '/admin/recurring-schedules' },
          { label: 'New Schedule' },
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
        {/* Customer Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Customer</CardTitle>
            <CardDescription>Search and select a customer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Label htmlFor="customerSearch">Search Customer *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="customerSearch"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Type customer name or email..."
                  className="pl-10"
                />
              </div>
              {isLoadingCustomers && (
                <p className="text-sm text-gray-500 mt-2">Searching...</p>
              )}
              {!isLoadingCustomers && customerSearch.length >= 2 && customers.length === 0 && (
                <p className="text-sm text-gray-500 mt-2">No customers found. Try a different search term.</p>
              )}
              {customers.length > 0 && (
                <div className="mt-2 border rounded-md max-h-60 overflow-y-auto">
                  {customers.map((customer) => (
                    <div
                      key={customer.id}
                      onClick={() => handleCustomerSelect(customer)}
                      className={`p-3 cursor-pointer hover:bg-gray-50 border-b last:border-b-0 ${
                        selectedCustomer?.id === customer.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="font-medium">
                        {customer.first_name} {customer.last_name}
                      </div>
                      <div className="text-sm text-gray-500">{customer.email}</div>
                      {customer.phone && (
                        <div className="text-sm text-gray-500">{customer.phone}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {selectedCustomer && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="font-medium text-green-900">
                    Selected: {selectedCustomer.first_name} {selectedCustomer.last_name}
                  </div>
                  <div className="text-sm text-green-700">{selectedCustomer.email}</div>
                </div>
              )}
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

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/recurring-schedules">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Schedule'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

