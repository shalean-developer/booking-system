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
import { calcTotalAsync } from '@/lib/pricing';
import { generateTimeSlots } from '@/lib/pricing';
import { ArrowLeft, Loader2, Search } from 'lucide-react';
import Link from 'next/link';

type ServiceType = 'Standard' | 'Deep' | 'Move In/Out' | 'Airbnb';

interface Cleaner {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

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

const PRICING = {
  extras: {
    'Inside Fridge': 30,
    'Inside Oven': 30,
    'Inside Cabinets': 30,
    'Interior Windows': 40,
    'Interior Walls': 35,
    'Laundry & Ironing': 75,
    'Carpet Cleaning': 120,
    'Ceiling Cleaning': 85,
    'Garage Cleaning': 110,
    'Balcony Cleaning': 90,
    'Couch Cleaning': 130,
    'Outside Window Cleaning': 125,
  },
};

const SERVICE_EXTRAS: Record<ServiceType, string[]> = {
  'Standard': ['Inside Fridge', 'Inside Oven', 'Inside Cabinets', 'Interior Windows', 'Interior Walls', 'Laundry & Ironing'],
  'Deep': ['Inside Fridge', 'Inside Oven', 'Inside Cabinets', 'Interior Windows', 'Interior Walls', 'Laundry & Ironing', 'Carpet Cleaning', 'Ceiling Cleaning', 'Garage Cleaning', 'Balcony Cleaning', 'Couch Cleaning', 'Outside Window Cleaning'],
  'Move In/Out': ['Inside Fridge', 'Inside Oven', 'Inside Cabinets', 'Interior Windows', 'Interior Walls', 'Laundry & Ironing', 'Carpet Cleaning', 'Ceiling Cleaning', 'Garage Cleaning', 'Balcony Cleaning', 'Couch Cleaning', 'Outside Window Cleaning'],
  'Airbnb': ['Inside Fridge', 'Inside Oven', 'Inside Cabinets', 'Interior Windows', 'Interior Walls', 'Laundry & Ironing'],
};

export default function NewBookingPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableCleaners, setAvailableCleaners] = useState<Cleaner[]>([]);
  const [isLoadingCleaners, setIsLoadingCleaners] = useState(false);
  const [pricing, setPricing] = useState<{
    subtotal: number;
    serviceFee: number;
    frequencyDiscount: number;
    total: number;
  } | null>(null);

  // Form state
  const [serviceType, setServiceType] = useState<ServiceType | ''>('');
  const [bedrooms, setBedrooms] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [extrasQuantities, setExtrasQuantities] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [customerFirstName, setCustomerFirstName] = useState('');
  const [customerLastName, setCustomerLastName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressSuburb, setAddressSuburb] = useState('');
  const [addressCity, setAddressCity] = useState('');
  const [cleanerId, setCleanerId] = useState<string>('');
  const [selectedCleanerIds, setSelectedCleanerIds] = useState<string[]>([]);
  const [supervisorId, setSupervisorId] = useState<string>('');
  
  // Customer search state
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const requiresTeam = serviceType === 'Deep' || serviceType === 'Move In/Out';

  useEffect(() => {
    fetchCleaners();
  }, []);

  useEffect(() => {
    if (serviceType) {
      calculatePricing();
    }
  }, [serviceType, bedrooms, bathrooms, selectedExtras, extrasQuantities]);

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

  const fetchCleaners = async () => {
    setIsLoadingCleaners(true);
    try {
      const response = await fetch('/api/admin/cleaners');
      const data = await response.json();
      if (data.ok && data.cleaners) {
        setAvailableCleaners(data.cleaners);
      }
    } catch (error) {
      console.error('Error fetching cleaners:', error);
    } finally {
      setIsLoadingCleaners(false);
    }
  };

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

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch(`${customer.first_name} ${customer.last_name}`.trim());
    setCustomers([]);
    setIsLoadingCustomers(false);
    
    // Auto-fill customer information
    setCustomerFirstName(customer.first_name || '');
    setCustomerLastName(customer.last_name || '');
    setCustomerEmail(customer.email || '');
    setCustomerPhone(customer.phone || '');
    setAddressLine1(customer.address_line1 || '');
    setAddressSuburb(customer.address_suburb || '');
    setAddressCity(customer.address_city || '');
  };

  const calculatePricing = async () => {
    if (!serviceType) return;

    try {
      const result = await calcTotalAsync(
        {
          service: serviceType as ServiceType,
          bedrooms,
          bathrooms,
          extras: selectedExtras,
          extrasQuantities,
        },
        'one-time'
      );
      setPricing(result);
    } catch (error) {
      console.error('Error calculating pricing:', error);
    }
  };

  const handleExtraToggle = (extra: string) => {
    setSelectedExtras((prev) => {
      if (prev.includes(extra)) {
        const newExtras = prev.filter((e) => e !== extra);
        const newQuantities = { ...extrasQuantities };
        delete newQuantities[extra];
        setExtrasQuantities(newQuantities);
        return newExtras;
      } else {
        return [...prev, extra];
      }
    });
  };

  const handleExtraQuantityChange = (extra: string, quantity: number) => {
    if (quantity < 1) return;
    setExtrasQuantities((prev) => ({ ...prev, [extra]: quantity }));
  };

  const handleCleanerToggle = (cleanerId: string) => {
    if (requiresTeam) {
      setSelectedCleanerIds((prev) => {
        if (prev.includes(cleanerId)) {
          return prev.filter((id) => id !== cleanerId);
        } else {
          return [...prev, cleanerId];
        }
      });
    } else {
      setCleanerId(cleanerId === cleanerId ? '' : cleanerId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate required fields
    if (!serviceType || !bookingDate || !bookingTime) {
      alert('Please fill in all required fields (Service Type, Booking Date, and Booking Time)');
      setIsSubmitting(false);
      return;
    }

    if (!customerFirstName || !customerLastName || !customerEmail) {
      alert('Please fill in customer information (First Name, Last Name, and Email)');
      setIsSubmitting(false);
      return;
    }

    if (!addressLine1 || !addressSuburb || !addressCity) {
      alert('Please fill in the complete address');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          service_type: serviceType,
          bedrooms,
          bathrooms,
          extras: selectedExtras,
          extrasQuantities,
          notes,
          booking_date: bookingDate,
          booking_time: bookingTime,
          customer_first_name: customerFirstName,
          customer_last_name: customerLastName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          address_line1: addressLine1,
          address_suburb: addressSuburb,
          address_city: addressCity,
          cleaner_id: requiresTeam ? null : cleanerId || null,
          cleaner_ids: requiresTeam ? selectedCleanerIds : undefined,
          supervisor_id: requiresTeam ? supervisorId : undefined,
          total_amount: pricing?.total || 0,
        }),
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
        console.error('Booking creation failed:', errorMessage);
        alert(`Failed to create booking: ${errorMessage}`);
        setIsSubmitting(false);
        return;
      }

      const data = await response.json();

      if (data.ok && data.booking) {
        router.push(`/admin/bookings/${data.booking.id}`);
      } else {
        console.error('Booking creation failed:', data.error);
        alert(data.error || 'Failed to create booking');
      }
    } catch (error: any) {
      console.error('Error creating booking:', error);
      alert(`Failed to create booking: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableExtras = serviceType ? SERVICE_EXTRAS[serviceType as ServiceType] || [] : [];
  const timeSlots = generateTimeSlots();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create New Booking"
        description="Create a booking on behalf of a customer"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Bookings', href: '/admin/bookings' },
          { label: 'New Booking' },
        ]}
        actions={
          <Button variant="outline" asChild>
            <Link href="/admin/bookings">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Bookings
            </Link>
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Service Details */}
        <Card>
          <CardHeader>
            <CardTitle>Service Details</CardTitle>
            <CardDescription>Select the service type and specifications</CardDescription>
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
                  min="0"
                  value={bedrooms}
                  onChange={(e) => setBedrooms(parseInt(e.target.value) || 0)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="bathrooms">Bathrooms *</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  min="0"
                  value={bathrooms}
                  onChange={(e) => setBathrooms(parseInt(e.target.value) || 0)}
                  required
                />
              </div>
            </div>

            {serviceType && (
              <div>
                <Label>Extras</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                  {availableExtras.map((extra) => {
                    const isSelected = selectedExtras.includes(extra);
                    const quantity = extrasQuantities[extra] || 1;
                    return (
                      <div key={extra} className="flex items-center space-x-2">
                        <Checkbox
                          id={extra}
                          checked={isSelected}
                          onCheckedChange={() => handleExtraToggle(extra)}
                        />
                        <Label htmlFor={extra} className="flex-1 cursor-pointer">
                          {extra}
                        </Label>
                        {isSelected && (
                          <Input
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) =>
                              handleExtraQuantityChange(extra, parseInt(e.target.value) || 1)
                            }
                            className="w-20"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="notes">Special Instructions</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special instructions or notes..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Date & Time */}
        <Card>
          <CardHeader>
            <CardTitle>Date & Time</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Booking Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div>
                <Label htmlFor="time">Booking Time *</Label>
                <Select value={bookingTime} onValueChange={setBookingTime}>
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
          </CardContent>
        </Card>

        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
            <CardDescription>
              Search for an existing customer or enter new customer details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Label htmlFor="customerSearch">Search Customer (Optional)</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="customerSearch"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Type customer name or email to search..."
                  className="pl-10"
                />
              </div>
              {isLoadingCustomers && (
                <p className="text-sm text-gray-500 mt-2">Searching...</p>
              )}
              {!isLoadingCustomers && customerSearch.length >= 2 && customers.length === 0 && (
                <p className="text-sm text-gray-500 mt-2">No customers found. You can still enter customer details manually below.</p>
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
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCustomer(null);
                      setCustomerSearch('');
                    }}
                    className="text-xs text-green-600 hover:text-green-800 mt-1 underline"
                  >
                    Clear selection
                  </button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={customerFirstName}
                  onChange={(e) => setCustomerFirstName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={customerLastName}
                  onChange={(e) => setCustomerLastName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle>Service Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="addressLine1">Street Address *</Label>
              <Input
                id="addressLine1"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="suburb">Suburb *</Label>
                <Input
                  id="suburb"
                  value={addressSuburb}
                  onChange={(e) => setAddressSuburb(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
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
            <CardDescription>
              {requiresTeam
                ? 'Select multiple cleaners for team booking. Designate one as supervisor.'
                : 'Select a cleaner for this booking'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingCleaners ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <>
                {requiresTeam ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {availableCleaners.map((cleaner) => {
                        const isSelected = selectedCleanerIds.includes(cleaner.id);
                        const isSupervisor = supervisorId === cleaner.id;
                        return (
                          <div
                            key={cleaner.id}
                            className={`flex items-center space-x-2 p-3 border rounded-lg ${
                              isSelected ? 'border-primary bg-primary/5' : ''
                            }`}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleCleanerToggle(cleaner.id)}
                            />
                            <div className="flex-1">
                              <Label className="cursor-pointer font-medium">{cleaner.name}</Label>
                              {cleaner.email && (
                                <p className="text-sm text-gray-500">{cleaner.email}</p>
                              )}
                            </div>
                            {isSelected && (
                              <Button
                                type="button"
                                variant={isSupervisor ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setSupervisorId(isSupervisor ? '' : cleaner.id)}
                              >
                                {isSupervisor ? 'Supervisor' : 'Set as Supervisor'}
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {selectedCleanerIds.length > 0 && supervisorId === '' && (
                      <p className="text-sm text-amber-600">
                        Please designate one cleaner as supervisor
                      </p>
                    )}
                  </div>
                ) : (
                  <Select value={cleanerId || 'none'} onValueChange={(value) => setCleanerId(value === 'none' ? '' : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a cleaner (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No cleaner assigned</SelectItem>
                      {availableCleaners.map((cleaner) => (
                        <SelectItem key={cleaner.id} value={cleaner.id}>
                          {cleaner.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Pricing Summary */}
        {pricing && (
          <Card>
            <CardHeader>
              <CardTitle>Pricing Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>R{pricing.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Service Fee:</span>
                  <span>R{pricing.serviceFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total:</span>
                  <span>R{pricing.total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/bookings">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting || !serviceType || !bookingDate || !bookingTime}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Booking'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
