'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { ServiceType, PaystackVerificationResponse } from '@/types/booking';
import { useBooking } from '@/lib/useBooking';
import { calcTotal, calcTotalAsync, PRICING } from '@/lib/pricing';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Clock, Home, User, Mail, Phone, FileText, Loader2, CreditCard, AlertCircle, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { captureErrorContext, logBookingStep, createDebugSummary } from '@/lib/booking-debug';

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
  const [errorDetails, setErrorDetails] = useState<string[]>([]);
  const [PaystackHook, setPaystackHook] = useState<any>(null);
  const [pricingDetails, setPricingDetails] = useState<{
    subtotal: number;
    serviceFee: number;
    frequencyDiscount: number;
    frequencyDiscountPercent: number;
    total: number;
  } | null>(null);
  const pricingDetailsRef = useRef(pricingDetails);

  // Dynamically import react-paystack on client side only
  useEffect(() => {
    import('react-paystack').then((module) => {
      setPaystackHook(() => module.usePaystackPayment);
    });
  }, []);

  // Calculate total with service fee and frequency discount
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const details = await calcTotalAsync(
          {
            service: state.service,
            bedrooms: state.bedrooms,
            bathrooms: state.bathrooms,
            extras: state.extras,
          },
          state.frequency
        );
        setPricingDetails(details);
        console.log('=== PRICING LOADED ===');
        console.log('Pricing details:', JSON.stringify(details, null, 2));
        console.log('Total amount:', details.total);
        console.log('======================');
      } catch (error) {
        console.error('Failed to fetch pricing:', error);
        // Fallback to simple calculation
        const total = calcTotal({
          service: state.service,
          bedrooms: state.bedrooms,
          bathrooms: state.bathrooms,
          extras: state.extras,
        });
        setPricingDetails({
          subtotal: total,
          serviceFee: 0,
          frequencyDiscount: 0,
          frequencyDiscountPercent: 0,
          total,
        });
      }
    };

    fetchPricing();
  }, [state.service, state.bedrooms, state.bathrooms, state.extras, state.frequency]);

  // Keep ref in sync with pricingDetails
  useEffect(() => {
    pricingDetailsRef.current = pricingDetails;
  }, [pricingDetails]);

  const total = pricingDetails?.total || 0;

  // Generate unique payment reference for each render
  const [paymentReference] = useState(
    () => `BK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  );

  // Paystack payment success handler (needs to be defined before config)
  const onPaymentSuccess = useCallback(async (reference: any) => {
    console.log('=== PAYMENT SUCCESS HANDLER CALLED ===');
    console.log('Payment reference received:', reference);
    
    logBookingStep('PAYMENT_SUCCESS_RECEIVED', { reference }, reference.reference);
    
    setIsSubmitting(true);
    setPaymentError(null);
    setErrorDetails([]);

    // Declare variables outside try block for error context
    let verifyResponse: Response | undefined;
    let bookingResponse: Response | undefined;

    try {
      console.log('Step 1: Starting payment verification...');
      console.log('Reference to verify:', reference.reference);
      logBookingStep('PAYMENT_VERIFICATION_START', { reference: reference.reference }, reference.reference);

      // Verify payment with our backend
      verifyResponse = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reference: reference.reference }),
      });

      console.log('Step 2: Verification response received');
      console.log('Response status:', verifyResponse.status);
      console.log('Response ok:', verifyResponse.ok);
      logBookingStep('PAYMENT_VERIFICATION_RESPONSE', { 
        status: verifyResponse.status, 
        ok: verifyResponse.ok 
      }, reference.reference);

      const verifyResult: PaystackVerificationResponse = await verifyResponse.json();
      console.log('Step 3: Verification result parsed:', verifyResult);
      logBookingStep('PAYMENT_VERIFICATION_RESULT', verifyResult, reference.reference);

      if (!verifyResult.ok) {
        console.error('❌ Verification failed:', verifyResult);
        
        const errorContext = captureErrorContext('PAYMENT_VERIFICATION_FAILED', verifyResult, {
          paymentReference: reference.reference,
          verifyResponseStatus: verifyResponse.status,
          verifyResult
        });
        
        // Check for configuration errors
        if (verifyResponse.status === 500) {
          const details = (verifyResult as any).details || [];
          setErrorDetails(details);
          throw new Error('Server configuration error. Please contact support.');
        }
        
        throw new Error(verifyResult.error || verifyResult.message || 'Payment verification failed');
      }

      console.log('✅ Step 4: Payment verified successfully, submitting booking...');
      logBookingStep('PAYMENT_VERIFIED_SUCCESS', { verified: true }, reference.reference);

      // Validate pricing is loaded
      const currentPricing = pricingDetailsRef.current;
      if (!currentPricing || currentPricing.total <= 0) {
        console.error('❌ Pricing not loaded or invalid:', currentPricing);
        const errorContext = captureErrorContext('PRICING_NOT_LOADED', new Error('Pricing invalid'), {
          paymentReference: reference.reference,
          pricingDetails: currentPricing
        });
        throw new Error('Pricing information not loaded. Please refresh and try again.');
      }

      // Submit booking with payment reference and pricing details
      const bookingPayload = {
        ...state,
        paymentReference: reference.reference,
        totalAmount: currentPricing.total,
        serviceFee: currentPricing.serviceFee,
        frequencyDiscount: currentPricing.frequencyDiscount,
      };
      console.log('Booking payload:', bookingPayload);
      logBookingStep('BOOKING_PAYLOAD_PREPARED', bookingPayload, reference.reference);

      bookingResponse = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingPayload),
      });

      console.log('Step 5: Booking response received');
      console.log('Booking response status:', bookingResponse.status);
      console.log('Booking response ok:', bookingResponse.ok);
      logBookingStep('BOOKING_RESPONSE_RECEIVED', { 
        status: bookingResponse.status, 
        ok: bookingResponse.ok 
      }, reference.reference);

      const bookingResult = await bookingResponse.json();
      console.log('Step 6: Booking result parsed:', bookingResult);
      logBookingStep('BOOKING_RESULT_PARSED', bookingResult, reference.reference);

      if (bookingResult.ok) {
        console.log('✅ Step 7: Booking successful! Redirecting...');
        console.log('Booking ID:', bookingResult.bookingId);
        console.log('Message:', bookingResult.message);
        logBookingStep('BOOKING_SUCCESS', { 
          bookingId: bookingResult.bookingId, 
          message: bookingResult.message 
        }, reference.reference, bookingResult.bookingId);
        
        // Clear booking state
        reset();
        
        // Navigate to confirmation page
        console.log('Navigating to /booking/confirmation');
        logBookingStep('NAVIGATION_START', { target: '/booking/confirmation' }, reference.reference, bookingResult.bookingId);
        router.push('/booking/confirmation');
      } else {
        console.error('❌ Booking submission failed:', bookingResult);
        
        const errorContext = captureErrorContext('BOOKING_SUBMISSION_FAILED', bookingResult, {
          paymentReference: reference.reference,
          bookingResponseStatus: bookingResponse.status,
          bookingResult,
          bookingPayload
        });
        
        // Check for configuration errors
        if (bookingResponse.status === 500) {
          const details = (bookingResult as any).details || [];
          setErrorDetails(details);
          throw new Error(bookingResult.error || 'Server configuration error. Please contact support.');
        }
        
        throw new Error(bookingResult.error || bookingResult.message || 'Failed to complete booking');
      }
    } catch (error) {
      console.error('=== POST-PAYMENT ERROR ===');
      console.error('Error type:', error instanceof Error ? 'Error object' : typeof error);
      console.error('Error details:', error);
      console.error('Error message:', error instanceof Error ? error.message : String(error));
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      // Enhanced error context capture
      const errorContext = captureErrorContext('POST_PAYMENT_ERROR', error, {
        paymentReference: reference.reference,
        bookingState: state,
        pricingDetails: pricingDetailsRef.current,
        verifyResponse: verifyResponse,
        bookingResponse: bookingResponse
      });
      
      // Create comprehensive debug summary
      const debugSummary = createDebugSummary(error, {
        step: 'POST_PAYMENT_ERROR',
        paymentReference: reference.reference,
        bookingState: state,
        pricingDetails: pricingDetailsRef.current
      });
      
      console.error('=== FULL DEBUG SUMMARY ===');
      console.error(debugSummary);
      console.error('========================');
      
      let errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to complete booking. Please contact support.';
      
      // Add payment reference to error message for support
      if (reference.reference && !errorMessage.includes(reference.reference)) {
        errorMessage += `\n\nPayment Reference: ${reference.reference}`;
        errorMessage += '\nPlease save this reference for support.';
      }
      
      setPaymentError(errorMessage);
      setIsSubmitting(false);
    }
  }, [state, reset, router]); // REMOVE pricingDetails

  // Paystack payment close handler
  const onPaymentClose = useCallback(() => {
    console.log('=== PAYMENT POPUP CLOSED ===');
    console.log('User closed the payment popup without completing payment');
    setPaymentError('Payment was cancelled. Please try again to complete your booking.');
  }, []);

  // Configure Paystack payment (callbacks passed separately to initializePayment)
  const paystackConfig = useMemo(() => ({
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
  }), [paymentReference, state.email, total, state.service, state.firstName, state.lastName]);

  // Initialize Paystack payment hook (only when loaded on client side)
  const initializePayment = PaystackHook ? PaystackHook(paystackConfig) : () => {};

  const handleBack = useCallback(() => {
    if (state.service) {
      const slug = serviceTypeToSlug(state.service);
      // Navigate immediately - step will be updated by the target page's useEffect
      router.push(`/booking/service/${slug}/contact`);
    }
  }, [state.service, router]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100"
    >
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Review & Confirm
        </h2>
        <p className="text-sm md:text-base text-gray-600">
          Please review your booking details before confirming payment
        </p>
      </div>

      {/* Review Content */}
      <div className="space-y-4 mb-8">
        {/* Service Type Section */}
        <div className="rounded-xl bg-slate-50/50 p-5 border border-slate-200">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Home className="h-4 w-4 text-primary" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Service Type</h3>
          </div>
          <Badge variant="secondary" className="text-sm">
            {state.service}
          </Badge>
        </div>

        {/* Home Details Section */}
        <div className="rounded-xl bg-slate-50/50 p-5 border border-slate-200">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Home className="h-4 w-4 text-primary" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Home Details</h3>
          </div>
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Bedrooms</span>
              <span className="font-semibold text-gray-900">{state.bedrooms}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Bathrooms</span>
              <span className="font-semibold text-gray-900">{state.bathrooms}</span>
            </div>
          </div>
        </div>

        {/* Additional Services Section */}
        {state.extras.length > 0 && (
          <div className="rounded-xl bg-slate-50/50 p-5 border border-slate-200">
            <h3 className="text-base font-bold text-gray-900 mb-3">Additional Services</h3>
            <div className="space-y-2">
              {state.extras.map((extra) => (
                <div key={extra} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">{extra}</span>
                  <span className="font-semibold text-gray-900">
                    +R{PRICING.extras[extra as keyof typeof PRICING.extras]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Special Instructions Section */}
        {state.notes && (
          <div className="rounded-xl bg-slate-50/50 p-5 border border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Special Instructions</h3>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">{state.notes}</p>
          </div>
        )}

        {/* Schedule Section */}
        <div className="rounded-xl bg-slate-50/50 p-5 border border-slate-200">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Schedule</h3>
          </div>
          <div className="grid gap-2 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-500" />
              <span className="text-slate-700">
                {state.date && format(new Date(state.date), 'EEEE, MMMM d, yyyy')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-500" />
              <span className="text-slate-700 font-medium">{state.time}</span>
            </div>
          </div>
        </div>

        {/* Contact Information Section */}
        <div className="rounded-xl bg-slate-50/50 p-5 border border-slate-200">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Contact Information</h3>
          </div>
          <div className="grid gap-2 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-slate-500" />
              <span className="text-slate-700">
                {state.firstName} {state.lastName}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-slate-500" />
              <span className="text-slate-700">{state.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-slate-500" />
              <span className="text-slate-700">{state.phone}</span>
            </div>
          </div>
        </div>

        {/* Service Address Section */}
        <div className="rounded-xl bg-slate-50/50 p-5 border border-slate-200">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <MapPin className="h-4 w-4 text-primary" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Service Address</h3>
          </div>
          <div className="text-sm text-slate-700 space-y-1">
            <p>{state.address.line1}</p>
            <p>{state.address.suburb}</p>
            <p>{state.address.city}</p>
          </div>
        </div>

        {/* Cleaner Assignment Section */}
        {state.cleaner_id && (
          <div className="rounded-xl bg-slate-50/50 p-5 border border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Cleaner Assignment</h3>
            </div>
            {state.cleaner_id === 'manual' ? (
              <div className="rounded-xl bg-amber-50 border-2 border-amber-200 p-4">
                <p className="text-sm font-semibold text-amber-900 mb-1">
                  Manual Assignment Requested
                </p>
                <p className="text-xs text-amber-700 leading-relaxed">
                  Our team will assign the best available cleaner for you and contact you within 24 hours to confirm.
                </p>
              </div>
            ) : (
              <div className="rounded-xl bg-green-50 border-2 border-green-200 p-4">
                <p className="text-sm font-semibold text-green-900 mb-1">
                  Cleaner Selected
                </p>
                <p className="text-xs text-green-700 leading-relaxed">
                  Your professional cleaner has been assigned for this booking.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Total Amount Section */}
      <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-lg font-bold text-gray-900">Total Amount</span>
          <span className="text-3xl font-bold text-primary">R{total}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Shield className="h-4 w-4 text-primary" />
          <span>Secure payment powered by Paystack</span>
        </div>
      </div>

      {/* Payment Error */}
      <AnimatePresence>
        {paymentError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-2xl bg-red-50 border-2 border-red-200 p-5"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-red-900 mb-2">Payment Error</h3>
                <p className="text-sm text-red-800 whitespace-pre-line leading-relaxed mb-3">
                  {paymentError}
                </p>
                {errorDetails.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-red-300">
                    <p className="text-xs font-semibold text-red-900 mb-2">Technical Details:</p>
                    <ul className="text-xs text-red-700 space-y-1">
                      {errorDetails.map((detail, idx) => (
                        <li key={idx} className="font-mono bg-red-100/50 px-2 py-1 rounded">
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="mt-3 pt-3 border-t border-red-300">
                  <p className="text-xs text-red-800">
                    Need help? Contact us at{' '}
                    <a href="mailto:hello@shalean.co.za" className="underline font-semibold hover:text-red-900">
                      hello@shalean.co.za
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between gap-3 mt-8 pt-6 border-t">
        <Button 
          variant="outline" 
          onClick={handleBack} 
          size="lg" 
          disabled={isSubmitting} 
          className={cn(
            "rounded-full px-6 font-semibold",
            "focus:ring-2 focus:ring-primary/30 focus:outline-none",
            "transition-all duration-200"
          )}
          type="button"
        >
          <span className="sm:hidden">Back</span>
          <span className="hidden sm:inline">Back to Contact</span>
        </Button>
        
        <Button 
          onClick={() => {
            console.log('=== PAYSTACK BUTTON CLICKED ===');
            console.log('Config:', {
              ...paystackConfig,
              publicKey: paystackConfig.publicKey ? 'pk_***' : 'MISSING',
            });
            
            logBookingStep('PAYMENT_BUTTON_CLICKED', {
              config: {
                ...paystackConfig,
                publicKey: paystackConfig.publicKey ? 'pk_***' : 'MISSING',
              },
              pricingDetails,
              paystackHookLoaded: !!PaystackHook,
              emailProvided: !!state.email
            }, paymentReference);
            
            // Check if pricing is loaded
            if (!pricingDetails || pricingDetails.total <= 0) {
              console.error('=== PRICING NOT READY ===');
              console.error('pricingDetails:', pricingDetails);
              console.error('========================');
              
              const errorContext = captureErrorContext('PRICING_NOT_READY', new Error('Pricing not loaded'), {
                paymentReference,
                pricingDetails,
                state
              });
              
              setPaymentError('Pricing information is still loading. Please wait a moment and try again.');
              return;
            }

            console.log('=== PAYMENT BUTTON VALIDATION ===');
            console.log('pricingDetails valid:', pricingDetails);
            console.log('Total:', pricingDetails.total);
            console.log('=================================');

            // Check if Paystack is loaded
            if (!PaystackHook) {
              const errorContext = captureErrorContext('PAYSTACK_NOT_LOADED', new Error('Paystack hook not loaded'), {
                paymentReference,
                paystackHookLoaded: false
              });
              setPaymentError('Payment system is still loading. Please wait a moment and try again.');
              return;
            }
            
            if (!process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY) {
              const errorContext = captureErrorContext('PAYSTACK_NOT_CONFIGURED', new Error('Paystack public key missing'), {
                paymentReference,
                hasPublicKey: false
              });
              setPaymentError('Payment service is not configured. Please contact support.');
              return;
            }
            if (!state.email) {
              const errorContext = captureErrorContext('EMAIL_MISSING', new Error('Customer email not provided'), {
                paymentReference,
                state
              });
              setPaymentError('Email is required for payment. Please go back and enter your email.');
              return;
            }
            setPaymentError(null);
            console.log('Calling initializePayment with callbacks...');
            console.log('Callbacks configured:', {
              onSuccess: typeof onPaymentSuccess,
              onClose: typeof onPaymentClose,
            });
            
            logBookingStep('PAYMENT_INITIALIZATION', {
              callbacksConfigured: {
                onSuccess: typeof onPaymentSuccess,
                onClose: typeof onPaymentClose,
              },
              amount: pricingDetails.total,
              currency: 'ZAR'
            }, paymentReference);
            
            // Call initializePayment with config object containing callbacks
            initializePayment({
              onSuccess: onPaymentSuccess,
              onClose: onPaymentClose,
            });
          }}
          size="lg" 
          disabled={isSubmitting || !pricingDetails || pricingDetails.total <= 0} 
          className={cn(
            "rounded-full px-8 py-3 font-semibold shadow-lg flex-1 sm:flex-none sm:min-w-[220px]",
            "bg-primary hover:bg-primary/90 text-white",
            "focus:ring-2 focus:ring-primary/30 focus:outline-none",
            "transition-all duration-200",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
          type="button"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span className="sm:hidden">Processing...</span>
              <span className="hidden sm:inline">Processing Payment...</span>
            </>
          ) : !pricingDetails ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Loading pricing...</span>
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              <span className="sm:hidden">Pay R{total}</span>
              <span className="hidden sm:inline">Confirm & Pay R{total}</span>
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}

