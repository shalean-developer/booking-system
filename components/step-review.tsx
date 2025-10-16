'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PaystackConsumer } from 'react-paystack';
import type { ServiceType, PaystackVerificationResponse } from '@/types/booking';
import { useBooking } from '@/lib/useBooking';
import { calcTotal, PRICING } from '@/lib/pricing';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, MapPin, Clock, Home, User, Mail, Phone, FileText, Loader2, CreditCard } from 'lucide-react';
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
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Memoize price calculation
  const total = useMemo(() => calcTotal({
    service: state.service,
    bedrooms: state.bedrooms,
    bathrooms: state.bathrooms,
    extras: state.extras,
  }), [state.service, state.bedrooms, state.bathrooms, state.extras]);

  // Generate unique payment reference for each render
  const [paymentReference] = useState(
    () => `BK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  );

  // Paystack payment success handler (needs to be defined before config)
  const onPaymentSuccess = useCallback(async (reference: any) => {
    console.log('=== PAYMENT SUCCESS HANDLER CALLED ===');
    console.log('Payment reference received:', reference);
    
    setIsSubmitting(true);
    setPaymentError(null);

    try {
      console.log('Step 1: Starting payment verification...');
      console.log('Reference to verify:', reference.reference);

      // Verify payment with our backend
      const verifyResponse = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reference: reference.reference }),
      });

      console.log('Step 2: Verification response received');
      console.log('Response status:', verifyResponse.status);
      console.log('Response ok:', verifyResponse.ok);

      const verifyResult: PaystackVerificationResponse = await verifyResponse.json();
      console.log('Step 3: Verification result parsed:', verifyResult);

      if (!verifyResult.ok) {
        console.error('Verification failed:', verifyResult);
        throw new Error(verifyResult.error || verifyResult.message || 'Payment verification failed');
      }

      console.log('Step 4: Payment verified successfully, submitting booking...');

      // Submit booking with payment reference
      const bookingPayload = {
        ...state,
        paymentReference: reference.reference,
      };
      console.log('Booking payload:', bookingPayload);

      const bookingResponse = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingPayload),
      });

      console.log('Step 5: Booking response received');
      console.log('Booking response status:', bookingResponse.status);
      console.log('Booking response ok:', bookingResponse.ok);

      const bookingResult = await bookingResponse.json();
      console.log('Step 6: Booking result parsed:', bookingResult);

      if (bookingResult.ok) {
        console.log('Step 7: Booking successful! Redirecting...');
        console.log('Booking ID:', bookingResult.bookingId);
        console.log('Email sent:', bookingResult.emailSent);
        
        // Clear booking state
        reset();
        
        // Navigate to confirmation page
        console.log('Navigating to /booking/confirmation');
        router.push('/booking/confirmation');
      } else {
        console.error('Booking submission failed:', bookingResult);
        throw new Error(bookingResult.error || bookingResult.message || 'Failed to submit booking after payment');
      }
    } catch (error) {
      console.error('=== POST-PAYMENT ERROR ===');
      console.error('Error type:', error instanceof Error ? 'Error object' : typeof error);
      console.error('Error details:', error);
      console.error('Error message:', error instanceof Error ? error.message : String(error));
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to complete booking. Please contact support with your payment reference: ' + reference.reference;
      
      setPaymentError(errorMessage);
      setIsSubmitting(false);
      
      // Show alert as backup
      alert('Error: ' + errorMessage);
    }
  }, [state, reset, router]);

  // Paystack payment close handler
  const onPaymentClose = useCallback(() => {
    console.log('=== PAYMENT POPUP CLOSED ===');
    console.log('User closed the payment popup without completing payment');
    setPaymentError('Payment was cancelled. Please try again to complete your booking.');
  }, []);

  // Configure Paystack payment - simple object with all properties
  const paystackConfig = {
    reference: paymentReference,
    email: state.email,
    amount: total * 100, // Paystack uses kobo/cents
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
    currency: 'ZAR',
    channels: ['card'],
    metadata: {
      custom_fields: [
        {
          display_name: 'Service Type',
          variable_name: 'service',
          value: state.service || '',
        },
        {
          display_name: 'Customer Name',
          variable_name: 'customer_name',
          value: `${state.firstName} ${state.lastName}`,
        },
        {
          display_name: 'Booking Reference',
          variable_name: 'booking_reference',
          value: paymentReference,
        },
      ],
    },
  };

  // Simple wrapper for PaystackConsumer without problematic props
  const paystackProps = {
    ...paystackConfig,
    text: 'Confirm & Pay',
  };

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
            Secure payment powered by Paystack
          </p>
        </div>

        {/* Payment Error */}
        {paymentError && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-800">{paymentError}</p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between gap-3 pt-4 pb-20 lg:pb-0">
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
          
          <PaystackConsumer {...paystackProps}>
            {({initializePayment}) => (
              <Button 
                onClick={() => {
                  console.log('=== PAYSTACK BUTTON CLICKED ===');
                  console.log('Config:', {
                    ...paystackConfig,
                    publicKey: paystackConfig.publicKey ? 'pk_***' : 'MISSING',
                  });
                  if (!process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY) {
                    setPaymentError('Payment service is not configured. Please contact support.');
                    return;
                  }
                  if (!state.email) {
                    setPaymentError('Email is required for payment. Please go back and enter your email.');
                    return;
                  }
                  setPaymentError(null);
                  console.log('Calling initializePayment from PaystackConsumer');
                  initializePayment(onPaymentSuccess, onPaymentClose);
                }}
                size="lg" 
                disabled={isSubmitting} 
                className="sm:min-w-[200px] transition-all duration-150 flex-1 sm:flex-none"
                type="button"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span className="sm:hidden">Processing...</span>
                    <span className="hidden sm:inline">Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span className="sm:hidden">Pay R{total}</span>
                    <span className="hidden sm:inline">Confirm & Pay R{total}</span>
                  </>
                )}
              </Button>
            )}
          </PaystackConsumer>
        </div>
      </CardContent>
    </Card>
  );
}

