'use client';

import { useState, useEffect, use, useMemo } from 'react';
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
import { calcTotalSafe } from '@/lib/pricing/calcTotalSafe';
import { generateTimeSlots } from '@/lib/pricing';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { computeHourlyEquivalentRandsPerCleaner, type EarningsBreakdownStored } from '@/lib/earnings-v2';
import { TARGET_HOURLY_RATE, MAX_HOURLY_RATE } from '@/lib/earnings-config';
import { buildEarningsAdminWarnings, impliedHourlyCentsForTeamPayout } from '@/lib/earnings-admin-warnings';

type ServiceType = 'Standard' | 'Deep' | 'Move In/Out' | 'Airbnb';

const SERVICE_EXTRAS: Record<ServiceType, string[]> = {
  'Standard': ['Inside Fridge', 'Inside Oven', 'Inside Cabinets', 'Interior Windows', 'Interior Walls', 'Laundry & Ironing'],
  'Deep': ['Inside Fridge', 'Inside Oven', 'Inside Cabinets', 'Interior Windows', 'Interior Walls', 'Laundry & Ironing', 'Carpet Cleaning', 'Ceiling Cleaning', 'Garage Cleaning', 'Balcony Cleaning', 'Couch Cleaning', 'Outside Window Cleaning'],
  'Move In/Out': ['Inside Fridge', 'Inside Oven', 'Inside Cabinets', 'Interior Windows', 'Interior Walls', 'Laundry & Ironing', 'Carpet Cleaning', 'Ceiling Cleaning', 'Garage Cleaning', 'Balcony Cleaning', 'Couch Cleaning', 'Outside Window Cleaning'],
  'Airbnb': ['Inside Fridge', 'Inside Oven', 'Inside Cabinets', 'Interior Windows', 'Interior Walls', 'Laundry & Ironing'],
};

export default function EditBookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pricing, setPricing] = useState<{
    subtotal: number;
    serviceFee: number;
    frequencyDiscount: number;
    frequencyDiscountPercent: number;
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
  const [status, setStatus] = useState('');
  const [customerFirstName, setCustomerFirstName] = useState('');
  const [customerLastName, setCustomerLastName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressSuburb, setAddressSuburb] = useState('');
  const [addressCity, setAddressCity] = useState('');
  const [storedTotalAmount, setStoredTotalAmount] = useState<number | null>(null);
  const [tipAmount, setTipAmount] = useState<number>(0);
  const [manualTotalAmount, setManualTotalAmount] = useState<number | null>(null);
  const [useManualPrice, setUseManualPrice] = useState(false);
  const [cleanerEarnings, setCleanerEarnings] = useState<number | null>(null);
  const [earningsTimeContext, setEarningsTimeContext] = useState<{
    total_hours: number | null;
    team_size: number | null;
    hours_per_cleaner: number | null;
    hourly_rate_used: number | null;
    earnings_status: string | null;
    earnings_final_cents: number | null;
    cleaner_earnings_cents: number | null;
    equipment_cost_cents: number | null;
    extra_cleaner_fee_cents: number | null;
    company_profit_cents: number | null;
    earnings_breakdown: EarningsBreakdownStored | null;
    total_amount_cents: number | null;
  } | null>(null);

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const earningsAdminWarnings = useMemo(() => {
    if (!earningsTimeContext) return [];
    const totalCents =
      earningsTimeContext.total_amount_cents ??
      (manualTotalAmount != null ? Math.round(manualTotalAmount * 100) : null);
    const resolved =
      earningsTimeContext.earnings_final_cents ??
      earningsTimeContext.cleaner_earnings_cents ??
      (cleanerEarnings != null ? Math.round(cleanerEarnings * 100) : null);
    const profit =
      earningsTimeContext.company_profit_cents ??
      (totalCents != null && resolved != null ? Math.max(0, totalCents - resolved) : null);
    const teamSz = Math.max(1, earningsTimeContext.team_size ?? 1);
    const implied =
      resolved != null
        ? impliedHourlyCentsForTeamPayout({
            totalPayoutCents: resolved,
            teamSize: teamSz,
            hoursPerCleaner: earningsTimeContext.hours_per_cleaner,
          })
        : null;
    return buildEarningsAdminWarnings({
      totalAmountCents: totalCents,
      companyProfitCents: profit,
      totalHours: earningsTimeContext.total_hours,
      teamSize: earningsTimeContext.team_size,
      impliedHourlyCentsPerCleaner: implied,
    });
  }, [earningsTimeContext, manualTotalAmount, cleanerEarnings]);

  useEffect(() => {
    if (serviceType) {
      calculatePricing();
    }
  }, [serviceType, bedrooms, bathrooms, selectedExtras, extrasQuantities]);

  const fetchBooking = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/bookings/${id}`);
      const data = await response.json();

      if (data.ok && data.booking) {
        const booking = data.booking;
        setServiceType(booking.service_type || '');
        setBedrooms(booking.bedrooms || 1);
        setBathrooms(booking.bathrooms || 1);
        setSelectedExtras(booking.extras || []);
        setExtrasQuantities(booking.extrasQuantities || {});
        setNotes(booking.notes || '');
        setBookingDate(booking.booking_date || '');
        setBookingTime(booking.booking_time || '');
        setStatus(booking.status || 'pending');
        
        const nameParts = (booking.customer_name || '').split(' ');
        setCustomerFirstName(nameParts[0] || '');
        setCustomerLastName(nameParts.slice(1).join(' ') || '');
        setCustomerEmail(booking.customer_email || '');
        setCustomerPhone(booking.customer_phone || '');
        setAddressLine1(booking.address_line1 || '');
        setAddressSuburb(booking.address_suburb || '');
        setAddressCity(booking.address_city || '');
        
        // Store the original total amount and tip from database
        if (booking.total_amount) {
          const totalInRands = booking.total_amount / 100; // Convert from cents to rands
          setStoredTotalAmount(totalInRands);
          setManualTotalAmount(totalInRands);
          console.log('📊 Stored booking total:', `R${totalInRands.toFixed(2)}`);
        }
        // Get tip amount (could be in price_snapshot or as separate field)
        const tip = booking.tip_amount ? (booking.tip_amount / 100) : 0;
        setTipAmount(tip);
        // Get cleaner earnings
        if (booking.cleaner_earnings) {
          setCleanerEarnings(booking.cleaner_earnings / 100); // Convert from cents to rands
        }
        setEarningsTimeContext({
          total_hours: booking.total_hours ?? null,
          team_size: booking.team_size ?? null,
          hours_per_cleaner: booking.hours_per_cleaner ?? null,
          hourly_rate_used: booking.hourly_rate_used ?? null,
          earnings_status: booking.earnings_status ?? null,
          earnings_final_cents: booking.earnings_final ?? null,
          cleaner_earnings_cents: booking.cleaner_earnings ?? null,
          equipment_cost_cents: booking.equipment_cost ?? null,
          extra_cleaner_fee_cents: booking.extra_cleaner_fee ?? null,
          company_profit_cents: booking.company_profit_cents ?? null,
          earnings_breakdown: (booking.earnings_breakdown as EarningsBreakdownStored | null) ?? null,
          total_amount_cents: booking.total_amount ?? null,
        });
        console.log('📊 Booking details:', {
          service_type: booking.service_type,
          bedrooms: booking.bedrooms,
          bathrooms: booking.bathrooms,
          extras: booking.extras,
          extrasQuantities: booking.extrasQuantities,
          tip_amount: tip,
          stored_total: booking.total_amount ? (booking.total_amount / 100) : 0,
        });
      }
    } catch (error) {
      console.error('Error fetching booking:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculatePricing = async () => {
    if (!serviceType) return;

    try {
      const result = await calcTotalSafe(
        {
          service: serviceType as ServiceType,
          bedrooms,
          bathrooms,
          extras: selectedExtras,
          extrasQuantities,
        },
        'one-time'
      );
      
      console.log('💰 Calculated pricing:', {
        subtotal: result.subtotal,
        serviceFee: result.serviceFee,
        frequencyDiscount: result.frequencyDiscount,
        total: result.total,
        extras: selectedExtras,
        extrasQuantities,
      });
      
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        service_type: serviceType,
        bedrooms,
        bathrooms,
        extras: selectedExtras,
        extrasQuantities,
        notes,
        booking_date: bookingDate,
        booking_time: bookingTime,
        status,
        customer_first_name: customerFirstName,
        customer_last_name: customerLastName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        address_line1: addressLine1,
        address_suburb: addressSuburb,
        address_city: addressCity,
        // Use manual price if override is enabled, otherwise always use calculated price
        // This ensures that when admin makes edits, the price is updated to match the new calculation
        total_amount: useManualPrice && manualTotalAmount !== null 
          ? Math.round(manualTotalAmount * 100) 
          : (pricing ? pricing.total * 100 : undefined),
        cleaner_earnings: cleanerEarnings !== null ? Math.round(cleanerEarnings * 100) : undefined,
      };

      console.log('Submitting booking update:', payload);

      const response = await fetch(`/api/admin/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      console.log('Response status:', response.status);
      console.log('Response text:', responseText);

      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          throw new Error(responseText || `HTTP error! status: ${response.status}`);
        }
        throw new Error(errorData.error || `Failed to update booking (${response.status})`);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error('Invalid JSON response from server');
      }

      if (data.ok) {
        // Refresh the booking data to show updated values
        await fetchBooking();
        // Show success message
        alert('Booking updated successfully!');
        // Navigate to booking detail page
        router.push(`/admin/bookings/${id}`);
      } else {
        alert(data.error || 'Failed to update booking');
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update booking';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push(`/admin/bookings/${id}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Edit Booking"
          breadcrumbs={[
            { label: 'Admin', href: '/admin' },
            { label: 'Bookings', href: '/admin/bookings' },
            { label: id, href: `/admin/bookings/${id}` },
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
        title="Edit Booking"
        description={`Editing booking ${id}`}
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Bookings', href: '/admin/bookings' },
          { label: id, href: `/admin/bookings/${id}` },
          { label: 'Edit' },
        ]}
        actions={
          <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
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
                <Label htmlFor="status">Status *</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
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

        {/* Pricing & Earnings */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing & Earnings</CardTitle>
            <CardDescription>
              Set manual pricing or let the system calculate based on service details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Checkbox
                    id="useManualPrice"
                    checked={useManualPrice}
                    onCheckedChange={(checked) => setUseManualPrice(checked === true)}
                  />
                  <Label htmlFor="useManualPrice" className="cursor-pointer">
                    Override calculated price
                  </Label>
                </div>
                <Label htmlFor="manualTotalAmount">Total Amount (R) *</Label>
                <Input
                  id="manualTotalAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={manualTotalAmount !== null ? manualTotalAmount.toFixed(2) : ''}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    setManualTotalAmount(isNaN(value) ? null : value);
                  }}
                  disabled={!useManualPrice}
                  required={useManualPrice}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {useManualPrice 
                    ? 'Manual price will override calculated price'
                    : `Calculated: R${pricing ? (pricing.subtotal + pricing.serviceFee - (pricing.frequencyDiscount || 0)).toFixed(2) : '0.00'}`}
                </p>
              </div>
              <div>
                <Label htmlFor="cleanerEarnings">Cleaner Earnings (R) *</Label>
                <Input
                  id="cleanerEarnings"
                  type="number"
                  step="0.01"
                  min="0"
                  value={cleanerEarnings !== null ? cleanerEarnings.toFixed(2) : ''}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    setCleanerEarnings(isNaN(value) ? null : value);
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Amount the cleaner earns from this booking
                </p>
              </div>
            </div>
            {earningsTimeContext &&
              (earningsTimeContext.total_hours != null ||
                earningsTimeContext.hours_per_cleaner != null ||
                (earningsTimeContext.equipment_cost_cents ?? 0) > 0 ||
                (earningsTimeContext.extra_cleaner_fee_cents ?? 0) > 0 ||
                !!earningsTimeContext.earnings_status ||
                earningsTimeContext.total_amount_cents != null ||
                earningsTimeContext.company_profit_cents != null) && (
              <div className="rounded-md border border-amber-200 bg-amber-50/80 p-3 text-sm dark:border-amber-900/50 dark:bg-amber-950/30">
                <p className="font-medium text-amber-900 dark:text-amber-100">Earnings review</p>
                {earningsAdminWarnings.length > 0 && (
                  <ul className="mt-2 list-none space-y-1 border-b border-amber-200/80 pb-2 dark:border-amber-900/50">
                    {earningsAdminWarnings.map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                  </ul>
                )}
                {(() => {
                  const totalCents =
                    earningsTimeContext.total_amount_cents ??
                    (manualTotalAmount != null ? Math.round(manualTotalAmount * 100) : null);
                  const resolvedCleanerCents =
                    earningsTimeContext.earnings_final_cents ??
                    earningsTimeContext.cleaner_earnings_cents ??
                    (cleanerEarnings != null ? Math.round(cleanerEarnings * 100) : null);
                  const profitCents =
                    totalCents != null && resolvedCleanerCents != null
                      ? Math.max(0, totalCents - resolvedCleanerCents)
                      : null;
                  const profitPct =
                    totalCents != null && totalCents > 0 && profitCents != null
                      ? (profitCents / totalCents) * 100
                      : null;
                  return (
                    <dl className="mt-2 grid grid-cols-1 gap-2 border-b border-amber-200/80 pb-3 sm:grid-cols-2 dark:border-amber-900/50">
                      <div className="flex justify-between gap-2 sm:col-span-2">
                        <dt className="text-muted-foreground">Total amount (customer)</dt>
                        <dd className="font-semibold">
                          {totalCents != null ? `R${(totalCents / 100).toFixed(2)}` : '—'}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2 sm:col-span-2">
                        <dt className="text-muted-foreground">Cleaner earnings (total payout)</dt>
                        <dd className="font-semibold">
                          {resolvedCleanerCents != null
                            ? `R${(resolvedCleanerCents / 100).toFixed(2)}`
                            : '—'}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2 sm:col-span-2">
                        <dt className="text-muted-foreground">Company profit</dt>
                        <dd className="font-semibold">
                          {profitCents != null ? `R${(profitCents / 100).toFixed(2)}` : '—'}
                          {earningsTimeContext.company_profit_cents != null &&
                          earningsTimeContext.earnings_status === 'approved' ? (
                            <span className="ml-2 text-xs font-normal text-muted-foreground">
                              (recorded R{(earningsTimeContext.company_profit_cents / 100).toFixed(2)})
                            </span>
                          ) : null}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2 sm:col-span-2">
                        <dt className="text-muted-foreground">Profit % of total</dt>
                        <dd>{profitPct != null ? `${profitPct.toFixed(1)}%` : '—'}</dd>
                      </div>
                    </dl>
                  );
                })()}
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Baseline / max for hourly checks: R{(TARGET_HOURLY_RATE / 100).toFixed(0)}/h – R
                  {(MAX_HOURLY_RATE / 100).toFixed(0)}/h per cleaner (implied).
                </p>
                <dl className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Total hours (est.)</dt>
                    <dd>{earningsTimeContext.total_hours ?? '—'}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Team size (earnings)</dt>
                    <dd>{earningsTimeContext.team_size ?? '—'}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Hours / cleaner</dt>
                    <dd>{earningsTimeContext.hours_per_cleaner ?? '—'}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Baseline rate used</dt>
                    <dd>
                      R{((earningsTimeContext.hourly_rate_used ?? TARGET_HOURLY_RATE) / 100).toFixed(2)}
                      /h
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2 sm:col-span-2">
                    <dt className="text-muted-foreground">Implied hourly (cleaner)</dt>
                    <dd>
                      {(() => {
                        const resolved =
                          earningsTimeContext.earnings_final_cents ??
                          earningsTimeContext.cleaner_earnings_cents ??
                          0;
                        const sz = Math.max(1, earningsTimeContext.team_size ?? 1);
                        const perCleanerCents = Math.round(resolved / sz);
                        const eq = computeHourlyEquivalentRandsPerCleaner({
                          payoutCentsForCleaner: perCleanerCents,
                          hoursPerCleaner: earningsTimeContext.hours_per_cleaner,
                        });
                        return eq != null ? `R${eq.toFixed(2)}/h` : '—';
                      })()}
                    </dd>
                  </div>
                  {earningsTimeContext.earnings_status && (
                    <div className="flex justify-between gap-2 sm:col-span-2">
                      <dt className="text-muted-foreground">Earnings status</dt>
                      <dd className="capitalize">{earningsTimeContext.earnings_status}</dd>
                    </div>
                  )}
                  {earningsTimeContext.earnings_breakdown ? (
                    <>
                      <div className="flex justify-between gap-2 sm:col-span-2 border-t border-amber-200/80 pt-2 mt-1 dark:border-amber-900/50">
                        <dt className="text-muted-foreground">Commission subtotal (pool base)</dt>
                        <dd>R{(earningsTimeContext.earnings_breakdown.subtotal / 100).toFixed(2)}</dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-muted-foreground">Pool (after rules)</dt>
                        <dd>R{(earningsTimeContext.earnings_breakdown.pool / 100).toFixed(2)}</dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-muted-foreground">Cap reference</dt>
                        <dd>R{(earningsTimeContext.earnings_breakdown.cap / 100).toFixed(2)}</dd>
                      </div>
                      <div className="flex justify-between gap-2 sm:col-span-2 text-xs text-muted-foreground">
                        <span>
                          Excluded from pool: service fee R
                          {(
                            (earningsTimeContext.earnings_breakdown.service_fee_cents ?? 0) / 100
                          ).toFixed(2)}
                          , tip R
                          {((earningsTimeContext.earnings_breakdown.tip_cents ?? 0) / 100).toFixed(2)} (not in
                          commission subtotal).
                        </span>
                      </div>
                    </>
                  ) : null}
                  <div className="flex justify-between gap-2 sm:col-span-2 border-t border-amber-200/80 pt-2 mt-1 dark:border-amber-900/50">
                    <dt className="text-muted-foreground">Equipment (company only)</dt>
                    <dd>
                      {earningsTimeContext.equipment_cost_cents != null
                        ? `R${(earningsTimeContext.equipment_cost_cents / 100).toFixed(2)}`
                        : '—'}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2 sm:col-span-2">
                    <dt className="text-muted-foreground">Extra cleaner fee (company only)</dt>
                    <dd>
                      {earningsTimeContext.extra_cleaner_fee_cents != null
                        ? `R${(earningsTimeContext.extra_cleaner_fee_cents / 100).toFixed(2)}`
                        : '—'}
                    </dd>
                  </div>
                </dl>
                {earningsTimeContext.earnings_breakdown ? (
                  <details className="mt-2 text-xs">
                    <summary className="cursor-pointer font-medium text-amber-900/90 dark:text-amber-200">
                      Debug: full earnings_breakdown JSON
                    </summary>
                    <pre className="mt-2 max-h-40 overflow-auto rounded bg-white/80 p-2 text-[10px] dark:bg-black/20">
                      {JSON.stringify(earningsTimeContext.earnings_breakdown, null, 2)}
                    </pre>
                  </details>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pricing Summary */}
        {pricing && (
          <Card>
            <CardHeader>
              <CardTitle>Calculated Pricing Summary</CardTitle>
              <CardDescription>
                This is the automatically calculated price based on service details. When you save, the stored price will be updated to match this calculated price (unless you use manual override above).
              </CardDescription>
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
                {pricing.frequencyDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Frequency Discount ({pricing.frequencyDiscountPercent}%):</span>
                    <span>-R{pricing.frequencyDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Subtotal + Service Fee:</span>
                  <span>R{(pricing.subtotal + pricing.serviceFee - (pricing.frequencyDiscount || 0)).toFixed(2)}</span>
                </div>
                {tipAmount > 0 && (
                  <div className="flex justify-between text-blue-600">
                    <span>Tip:</span>
                    <span>R{tipAmount.toFixed(2)}</span>
                  </div>
                )}
                {storedTotalAmount !== null && (
                  <div className="flex justify-between font-bold text-lg pt-2 border-t text-amber-600">
                    <span>Stored Total (from database):</span>
                    <span>R{storedTotalAmount.toFixed(2)}</span>
                  </div>
                )}
                {storedTotalAmount !== null && (
                  <div className="text-xs text-gray-500 pt-1">
                    {Math.abs(storedTotalAmount - (pricing.subtotal + pricing.serviceFee - (pricing.frequencyDiscount || 0) + tipAmount)) > 0.01 
                      ? `⚠️ Breakdown: R${(pricing.subtotal + pricing.serviceFee - (pricing.frequencyDiscount || 0)).toFixed(2)} (service) + R${tipAmount.toFixed(2)} (tip) = R${(pricing.subtotal + pricing.serviceFee - (pricing.frequencyDiscount || 0) + tipAmount).toFixed(2)}. Difference: R${Math.abs(storedTotalAmount - (pricing.subtotal + pricing.serviceFee - (pricing.frequencyDiscount || 0) + tipAmount)).toFixed(2)}`
                      : '✓ Calculated total matches stored total (including tip).'}
                  </div>
                )}
                {storedTotalAmount !== null && (
                  <div className="text-xs text-gray-500 pt-1">
                    {Math.abs(storedTotalAmount - (pricing.subtotal + pricing.serviceFee - (pricing.frequencyDiscount || 0))) > 0.01 
                      ? '⚠️ Calculated total differs from stored total. The stored price will be updated to match the calculated price when you save.'
                      : '✓ Calculated total matches stored total.'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !serviceType || !bookingDate || !bookingTime || (useManualPrice && manualTotalAmount === null) || cleanerEarnings === null}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Booking'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

