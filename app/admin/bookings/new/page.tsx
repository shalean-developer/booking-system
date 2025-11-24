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
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

type ServiceType = 'Standard' | 'Deep' | 'Move In/Out' | 'Airbnb';

interface Cleaner {
  id: string;
  name: string;
  email?: string;
  phone?: string;
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

  const requiresTeam = serviceType === 'Deep' || serviceType === 'Move In/Out';

  useEffect(() => {
    fetchCleaners();
  }, []);

  useEffect(() => {
    if (serviceType) {
      calculatePricing();
    }
  }, [serviceType, bedrooms, bathrooms, selectedExtras, extrasQuantities]);

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

    try {
      const response = await fetch('/api/admin/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

      const data = await response.json();

      if (data.ok) {
        router.push(`/admin/bookings/${data.booking.id}`);
      } else {
        alert(data.error || 'Failed to create booking');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Failed to create booking');
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
          </CardHeader>
          <CardContent className="space-y-4">
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
                  <Select value={cleanerId} onValueChange={setCleanerId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a cleaner (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No cleaner assigned</SelectItem>
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
