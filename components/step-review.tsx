'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { ServiceType } from '@/types/booking';
import { useBooking } from '@/lib/useBooking';
import { calcTotal, PRICING } from '@/lib/pricing';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, MapPin, Clock, Home, User, Mail, Phone, FileText, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

// Helper function to convert ServiceType to URL slug
function serviceTypeToSlug(serviceType: ServiceType): string {
  if (serviceType === 'Move In/Out') {
    return 'move-in-out';
  }
  
  return serviceType
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export function StepReview() {
  const router = useRouter();
  const { state, reset } = useBooking();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Memoize price calculation
  const total = useMemo(() => calcTotal({
    service: state.service,
    bedrooms: state.bedrooms,
    bathrooms: state.bathrooms,
    extras: state.extras,
  }), [state.service, state.bedrooms, state.bathrooms, state.extras]);

  const handleConfirm = useCallback(async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(state),
      });

      const result = await response.json();

      if (result.ok) {
        // Clear booking state
        reset();
        // Navigate to confirmation page
        router.push('/booking/confirmation');
      } else {
        alert('Failed to submit booking. Please try again.');
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Booking submission error:', error);
      alert('An error occurred. Please try again.');
      setIsSubmitting(false);
    }
  }, [state, reset, router]);

  const handleBack = useCallback(() => {
    if (state.service) {
      const slug = serviceTypeToSlug(state.service);
      // Navigate immediately - step will be updated by the target page's useEffect
      router.push(`/booking/service/${slug}/contact`);
    }
  }, [state.service, router]);

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle>Review & Confirm</CardTitle>
        <CardDescription>Please review your booking details before confirming</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Service Type */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Home className="h-4 w-4 text-slate-600" />
            <h3 className="text-sm font-semibold text-slate-700">Service</h3>
          </div>
          <Badge variant="secondary" className="text-sm">
            {state.service}
          </Badge>
        </div>

        <Separator />

        {/* Home Details */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-700">Home Details</h3>
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Bedrooms</span>
              <span className="font-medium">{state.bedrooms}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Bathrooms</span>
              <span className="font-medium">{state.bathrooms}</span>
            </div>
          </div>
        </div>

        {/* Extras */}
        {state.extras.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-700">Additional Services</h3>
              <div className="space-y-2">
                {state.extras.map((extra) => (
                  <div key={extra} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{extra}</span>
                    <span className="font-medium">
                      +R{PRICING.extras[extra as keyof typeof PRICING.extras]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Special Instructions */}
        {state.notes && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-600" />
                <h3 className="text-sm font-semibold text-slate-700">Special Instructions</h3>
              </div>
              <p className="text-sm text-slate-600">{state.notes}</p>
            </div>
          </>
        )}

        <Separator />

        {/* Schedule */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-600" />
            <h3 className="text-sm font-semibold text-slate-700">Schedule</h3>
          </div>
          <div className="grid gap-2 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3 text-slate-500" />
              <span className="text-slate-600">
                {state.date && format(new Date(state.date), 'PPPP')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-slate-500" />
              <span className="text-slate-600">{state.time}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Contact */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-slate-600" />
            <h3 className="text-sm font-semibold text-slate-700">Contact Information</h3>
          </div>
          <div className="grid gap-2 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-3 w-3 text-slate-500" />
              <span className="text-slate-600">
                {state.firstName} {state.lastName}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-3 w-3 text-slate-500" />
              <span className="text-slate-600">{state.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-3 w-3 text-slate-500" />
              <span className="text-slate-600">{state.phone}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Address */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-slate-600" />
            <h3 className="text-sm font-semibold text-slate-700">Service Address</h3>
          </div>
          <div className="text-sm text-slate-600">
            <p>{state.address.line1}</p>
            <p>{state.address.suburb}</p>
            <p>{state.address.city}</p>
          </div>
        </div>

        <Separator />

        {/* Total */}
        <div className="rounded-lg bg-slate-50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-slate-900">Total Amount</span>
            <span className="text-3xl font-bold text-primary">R{total}</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Payment link will be sent to your email after confirmation
          </p>
        </div>

        {/* Navigation */}
        <div className="flex justify-between gap-3 pt-4">
          <Button 
            variant="outline" 
            onClick={handleBack} 
            size="lg" 
            disabled={isSubmitting} 
            className="transition-all duration-150"
            type="button"
          >
            Back
          </Button>
          <Button 
            onClick={handleConfirm} 
            size="lg" 
            disabled={isSubmitting} 
            className="min-w-[200px] transition-all duration-150"
            type="button"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Confirm Booking'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

