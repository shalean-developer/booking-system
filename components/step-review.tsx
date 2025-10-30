'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { ServiceType, PaystackVerificationResponse } from '@/types/booking';
import { useBooking } from '@/lib/useBooking';
import { calcTotal, calcTotalAsync, calcTotalSync, PRICING } from '@/lib/pricing';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Clock, Home, User, Mail, Phone, FileText, Loader2, CreditCard, AlertCircle, Shield, Star, Award } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase-client';
import type { Cleaner } from '@/types/booking';
import Image from 'next/image';

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
  const [selectedCleaner, setSelectedCleaner] = useState<Cleaner | null>(null);
  const [isLoadingCleaner, setIsLoadingCleaner] = useState(false);
  
  // Calculate immediate fallback pricing for instant display
  const fallbackPricing = useMemo(() => {
    return calcTotalSync(
      {
        service: state.service,
        bedrooms: state.bedrooms,
        bathrooms: state.bathrooms,
        extras: state.extras || [],
      },
      state.frequency || 'one-time'
    );
  }, [state.service, state.bedrooms, state.bathrooms, state.extras, state.frequency]);

  // Initialize pricingDetails state immediately with fallback (no delay)
  // This ensures price displays instantly instead of "Calculating Pricing..."
  const [pricingDetails, setPricingDetails] = useState<{
    subtotal: number;
    serviceFee: number;
    frequencyDiscount: number;
    frequencyDiscountPercent: number;
    total: number;
  }>(fallbackPricing);
  
  const pricingDetailsRef = useRef(pricingDetails);

  // Dynamically import react-paystack on client side only
  useEffect(() => {
    import('react-paystack').then((module) => {
      setPaystackHook(() => module.usePaystackPayment);
    });
  }, []);

  // Update pricing: show fallback immediately, then update with cache/database if available
  useEffect(() => {
    // Set fallback immediately for instant display (no delay)
    setPricingDetails(fallbackPricing);
    pricingDetailsRef.current = fallbackPricing;

    const fetchPricing = async () => {
      // Check for cached pricing from schedule step (optimization)
      try {
        const cached = sessionStorage.getItem('cached_pricing');
        if (cached) {
          const cachedData = JSON.parse(cached);
          // Use cache if it's less than 5 minutes old
          const cacheAge = Date.now() - (cachedData.timestamp || 0);
          if (cacheAge < 5 * 60 * 1000) {
            // Cache is fresh, use it to override fallback
            const cachedPricing = {
              subtotal: cachedData.subtotal,
              serviceFee: cachedData.serviceFee,
              frequencyDiscount: cachedData.frequencyDiscount,
              frequencyDiscountPercent: cachedData.frequencyDiscountPercent,
              total: cachedData.total,
            };
            setPricingDetails(cachedPricing);
            pricingDetailsRef.current = cachedPricing;
            console.log('=== PRICING LOADED FROM CACHE ===');
            console.log('Pricing details:', JSON.stringify(cachedData, null, 2));
            console.log('Total amount:', cachedData.total);
            console.log('Cache age:', Math.round(cacheAge / 1000), 'seconds');
            console.log('==================================');
            return;
          }
        }
      } catch (err) {
        console.warn('Failed to read cached pricing:', err);
      }

      // Cache miss or expired - fetch fresh pricing from database
      try {
        const details = await calcTotalAsync(
          {
            service: state.service,
            bedrooms: state.bedrooms,
            bathrooms: state.bathrooms,
            extras: state.extras || [],
          },
          state.frequency || 'one-time'
        );
        // Update with database pricing (may differ from fallback)
        setPricingDetails(details);
        pricingDetailsRef.current = details;
        console.log('=== PRICING UPDATED FROM DATABASE ===');
        console.log('Pricing details:', JSON.stringify(details, null, 2));
        console.log('Total amount:', details.total);
        console.log('====================================');
      } catch (error) {
        console.error('Failed to fetch pricing from database, using fallback:', error);
        // Fallback already set above, just ensure ref is updated
        pricingDetailsRef.current = fallbackPricing;
      }
    };

    fetchPricing();
  }, [state.service, state.bedrooms, state.bathrooms, state.extras, state.frequency, fallbackPricing]);

  // Keep ref in sync with pricingDetails
  useEffect(() => {
    pricingDetailsRef.current = pricingDetails;
  }, [pricingDetails]);

  // Fetch cleaner details when cleaner_id is available
  useEffect(() => {
    const fetchCleanerDetails = async () => {
      // Only fetch if cleaner_id exists and is not 'manual' or a team booking
      if (!state.cleaner_id || state.cleaner_id === 'manual' || state.requires_team) {
        setSelectedCleaner(null);
        return;
      }

      try {
        setIsLoadingCleaner(true);
        const { data: cleaner, error } = await supabase
          .from('cleaners')
          .select('id, name, photo_url, rating, years_experience, bio')
          .eq('id', state.cleaner_id)
          .eq('is_active', true)
          .maybeSingle();

        if (error) {
          console.error('Error fetching cleaner details:', error);
          setSelectedCleaner(null);
        } else if (cleaner) {
          setSelectedCleaner(cleaner as Cleaner);
        } else {
          setSelectedCleaner(null);
        }
      } catch (err) {
        console.error('Error fetching cleaner:', err);
        setSelectedCleaner(null);
      } finally {
        setIsLoadingCleaner(false);
      }
    };

    fetchCleanerDetails();
  }, [state.cleaner_id, state.requires_team]);

  const total = pricingDetails?.total || 0;

  // Generate unique payment reference for each render
  const [paymentReference] = useState(
    () => `BK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  );

  // Paystack payment success handler - Save booking and send emails before redirecting
  const onPaymentSuccess = useCallback(async (reference: any) => {
    console.log('=== PAYMENT SUCCESS HANDLER CALLED ===');
    console.log('Payment reference received:', reference);
    
    console.log('🟦 [StepReview] PAYMENT_SUCCESS_RECEIVED:', reference);
    
    // Validate pricing is loaded
    const currentPricing = pricingDetailsRef.current;
    if (!currentPricing || currentPricing.total <= 0) {
      console.error('❌ Pricing not loaded or invalid:', currentPricing);
      setPaymentError('Pricing information not loaded. Please refresh and try again.');
      return;
    }

    // Set submitting state to show loading UI
    setIsSubmitting(true);
    setPaymentError(null);

    try {
      // Prepare booking payload
      const bookingPayload = {
        ...state,
        paymentReference: reference.reference,
        totalAmount: currentPricing.total,
        serviceFee: currentPricing.serviceFee,
        frequencyDiscount: currentPricing.frequencyDiscount,
      };

      console.log('💾 Saving booking to database...');
      console.log('🟦 [StepReview] SAVING_BOOKING:', { 
        paymentReference: reference.reference,
        totalAmount: currentPricing.total
      });

      // Call booking API to save booking and send emails
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingPayload),
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || 'Failed to save booking');
      }

      console.log('✅ Booking saved successfully');
      console.log('🟦 [StepReview] BOOKING_SAVED:', { 
        bookingId: data.bookingId,
        ref: reference.reference 
      });

      // Store booking reference for confirmation page fallback
      sessionStorage.setItem('last_booking_ref', reference.reference);
      
      // Clear any pending booking from sessionStorage (no longer needed)
      sessionStorage.removeItem('pending_booking');
      
      // Clear booking state (after successful save)
      reset();
      
      // Redirect to confirmation page with booking reference
      // Use replace to prevent back navigation to review page
      console.log('🚀 Redirecting to confirmation page...');
      console.log('🟦 [StepReview] REDIRECT_TO_CONFIRMATION:', { 
        target: '/booking/confirmation', 
        ref: reference.reference 
      });
      
      router.replace(`/booking/confirmation?ref=${reference.reference}`);
    } catch (error) {
      console.error('❌ Failed to save booking:', error);
      console.error('🟥 [StepReview] BOOKING_SAVE_FAILED:', {
        paymentReference: reference.reference,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Set error state but don't clear payment success
      let errorMessage = 'Payment was successful, but we couldn\'t save your booking. Please contact support.';
      if (error instanceof Error) {
        errorMessage = `Payment was successful, but we couldn't save your booking. Please contact support with payment reference: ${reference.reference}`;
      }
      setPaymentError(errorMessage);
      setIsSubmitting(false);
      
      // Store booking reference for manual recovery
      sessionStorage.setItem('last_booking_ref', reference.reference);
      sessionStorage.setItem('pending_booking', JSON.stringify({
        paymentReference: reference.reference,
        bookingState: {
          ...state,
          paymentReference: reference.reference,
          totalAmount: currentPricing.total,
          serviceFee: currentPricing.serviceFee,
          frequencyDiscount: currentPricing.frequencyDiscount,
        },
        timestamp: Date.now(),
      }));
    }
  }, [state, reset, router]);

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
      <div className="space-y-6 mb-8">
        {/* Service Type Section */}
        <div className="rounded-xl bg-slate-50/50 p-5 md:p-6 border border-slate-200 hover:border-slate-300 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Home className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-base md:text-lg font-bold text-gray-900">Service Type</h3>
          </div>
          <Badge variant="secondary" className="text-sm px-3 py-1.5 font-medium">
            {state.service}
          </Badge>
        </div>

        {/* Home Details Section */}
        <div className="rounded-xl bg-slate-50/50 p-5 md:p-6 border border-slate-200 hover:border-slate-300 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Home className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-base md:text-lg font-bold text-gray-900">Home Details</h3>
          </div>
          <div className="grid gap-3 text-sm">
            <div className="flex justify-between items-center py-1.5 px-2 bg-white/50 rounded-lg">
              <span className="text-slate-700 font-medium">Bedrooms</span>
              <span className="font-bold text-gray-900 text-base">{state.bedrooms}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 px-2 bg-white/50 rounded-lg">
              <span className="text-slate-700 font-medium">Bathrooms</span>
              <span className="font-bold text-gray-900 text-base">{state.bathrooms}</span>
            </div>
          </div>
        </div>

        {/* Additional Services Section */}
        {state.extras.length > 0 && (
          <div className="rounded-xl bg-slate-50/50 p-5 md:p-6 border border-slate-200 hover:border-slate-300 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Star className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-base md:text-lg font-bold text-gray-900">Additional Services</h3>
            </div>
            <div className="space-y-2.5">
              {state.extras.map((extra) => (
                <div key={extra} className="flex items-center justify-between text-sm py-2 px-3 bg-white/50 rounded-lg">
                  <span className="text-slate-700 font-medium">{extra}</span>
                  <span className="font-bold text-gray-900">
                    +R{PRICING.extras[extra as keyof typeof PRICING.extras]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Special Instructions Section */}
        {state.notes && (
          <div className="rounded-xl bg-slate-50/50 p-5 md:p-6 border border-slate-200 hover:border-slate-300 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-base md:text-lg font-bold text-gray-900">Special Instructions</h3>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed bg-white/50 rounded-lg p-4">{state.notes}</p>
          </div>
        )}

        {/* Schedule Section */}
        <div className="rounded-xl bg-slate-50/50 p-5 md:p-6 border border-slate-200 hover:border-slate-300 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-base md:text-lg font-bold text-gray-900">Schedule</h3>
          </div>
          <div className="grid gap-3 text-sm">
            <div className="flex items-center gap-3 py-2 px-3 bg-white/50 rounded-lg">
              <Calendar className="h-5 w-5 text-primary flex-shrink-0" />
              <span className="text-slate-700 font-medium">
                {state.date && format(new Date(state.date), 'EEEE, MMMM d, yyyy')}
              </span>
            </div>
            <div className="flex items-center gap-3 py-2 px-3 bg-white/50 rounded-lg">
              <Clock className="h-5 w-5 text-primary flex-shrink-0" />
              <span className="text-slate-700 font-bold text-base">{state.time}</span>
            </div>
          </div>
        </div>

        {/* Contact Information Section */}
        <div className="rounded-xl bg-slate-50/50 p-5 md:p-6 border border-slate-200 hover:border-slate-300 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-base md:text-lg font-bold text-gray-900">Contact Information</h3>
          </div>
          <div className="grid gap-2.5 text-sm">
            <div className="flex items-center gap-3 py-2 px-3 bg-white/50 rounded-lg">
              <User className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="text-slate-700 font-medium">
                {state.firstName} {state.lastName}
              </span>
            </div>
            <div className="flex items-center gap-3 py-2 px-3 bg-white/50 rounded-lg">
              <Mail className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="text-slate-700 font-medium">{state.email}</span>
            </div>
            <div className="flex items-center gap-3 py-2 px-3 bg-white/50 rounded-lg">
              <Phone className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="text-slate-700 font-medium">{state.phone}</span>
            </div>
          </div>
        </div>

        {/* Service Address Section */}
        <div className="rounded-xl bg-slate-50/50 p-5 md:p-6 border border-slate-200 hover:border-slate-300 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-base md:text-lg font-bold text-gray-900">Service Address</h3>
          </div>
          <div className="text-sm text-slate-700 space-y-1.5 bg-white/50 rounded-lg p-4">
            <p className="font-medium">{state.address.line1}</p>
            <p>{state.address.suburb}</p>
            <p>{state.address.city}</p>
          </div>
        </div>

        {/* Cleaner/Team Assignment Section */}
        {(state.cleaner_id || state.selected_team) && (
          <div className="rounded-xl bg-slate-50/50 p-5 md:p-6 border border-slate-200 hover:border-slate-300 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-base md:text-lg font-bold text-gray-900">
                {state.requires_team ? 'Team Assignment' : 'Cleaner Assignment'}
              </h3>
            </div>
            {state.requires_team ? (
              <div className="rounded-xl bg-blue-50 border-2 border-blue-200 p-4">
                <p className="text-sm font-semibold text-blue-900 mb-1">
                  {state.selected_team} Selected
                </p>
                <p className="text-xs text-blue-700 leading-relaxed">
                  Our admin team will assign specific cleaners to {state.selected_team} and contact you within 24 hours to confirm the team composition.
                </p>
              </div>
            ) : state.cleaner_id === 'manual' ? (
              <div className="rounded-xl bg-amber-50 border-2 border-amber-200 p-4">
                <p className="text-sm font-semibold text-amber-900 mb-1">
                  Manual Assignment Requested
                </p>
                <p className="text-xs text-amber-700 leading-relaxed">
                  Our team will assign the best available cleaner for you and contact you within 24 hours to confirm.
                </p>
              </div>
            ) : isLoadingCleaner ? (
              <div className="rounded-xl bg-green-50 border-2 border-green-200 p-4">
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-green-700" />
                  <p className="text-xs text-green-700">Loading cleaner details...</p>
                </div>
              </div>
            ) : selectedCleaner ? (
              <div className="rounded-xl bg-green-50 border-2 border-green-200 p-4">
                <div className="flex items-start gap-4">
                  {/* Cleaner Photo */}
                  <div className="flex-shrink-0">
                    {selectedCleaner.photo_url ? (
                      <Image
                        src={selectedCleaner.photo_url}
                        alt={selectedCleaner.name}
                        width={60}
                        height={60}
                        className="w-[60px] h-[60px] rounded-full object-cover border-2 border-green-300"
                      />
                    ) : (
                      <div className="w-[60px] h-[60px] rounded-full bg-green-200 flex items-center justify-center border-2 border-green-300">
                        <User className="h-8 w-8 text-green-600" />
                      </div>
                    )}
                  </div>
                  
                  {/* Cleaner Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-green-900 mb-1">
                      {selectedCleaner.name}
                    </p>
                    
                    {/* Rating */}
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < Math.floor(selectedCleaner.rating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="text-xs text-green-700 ml-1">
                        ({selectedCleaner.rating})
                      </span>
                    </div>

                    {/* Experience */}
                    {selectedCleaner.years_experience && (
                      <div className="flex items-center gap-1 text-xs text-green-700 mb-1">
                        <Award className="w-3 h-3" />
                        <span>{selectedCleaner.years_experience} years experience</span>
                      </div>
                    )}

                    {/* Bio Preview */}
                    {selectedCleaner.bio && (
                      <p className="text-xs text-green-700 line-clamp-2 mt-1">
                        {selectedCleaner.bio}
                      </p>
                    )}
                  </div>
                </div>
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
      <div className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-6 md:p-8 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-lg md:text-xl font-bold text-gray-900 block mb-1">Total Amount</span>
            <div className="flex items-center gap-2 text-xs md:text-sm text-slate-600">
              <Shield className="h-4 w-4 text-primary" />
              <span>Secure payment powered by Paystack</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-3xl md:text-4xl font-bold text-primary block leading-tight">R{total}</span>
            <span className="text-xs text-slate-500 mt-1 block">Includes all fees</span>
          </div>
        </div>
      </div>

      {/* Payment Error */}
      <AnimatePresence>
        {paymentError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-2xl bg-red-50 border-2 border-red-200 p-5 md:p-6 mb-6"
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
                    <a href="mailto:hello@shalean.com" className="underline font-semibold hover:text-red-900">
                      hello@shalean.com
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 mt-8 pt-6 border-t border-slate-200">
        <Button 
          variant="outline" 
          onClick={handleBack} 
          size="lg" 
          disabled={isSubmitting} 
          className={cn(
            "rounded-full px-6 py-3 font-semibold h-auto",
            "border-2 border-slate-300 hover:border-slate-400 hover:bg-slate-50",
            "focus:ring-2 focus:ring-primary/30 focus:outline-none",
            "transition-all duration-200",
            "w-full sm:w-auto"
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
            
            console.log('🟦 [StepReview] PAYMENT_BUTTON_CLICKED:', {
              config: {
                ...paystackConfig,
                publicKey: paystackConfig.publicKey ? 'pk_***' : 'MISSING',
              },
              pricingDetails,
              paystackHookLoaded: !!PaystackHook,
              emailProvided: !!state.email
            });
            
            // Check if pricing is loaded
            if (!pricingDetails || pricingDetails.total <= 0) {
              console.error('=== PRICING NOT READY ===');
              console.error('pricingDetails:', pricingDetails);
              console.error('========================');
              
              console.log('🟥 [StepReview] PRICING_NOT_READY:', {
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
              console.log('🟥 [StepReview] PAYSTACK_NOT_LOADED:', {
                paymentReference,
                paystackHookLoaded: false
              });
              setPaymentError('Payment system is still loading. Please wait a moment and try again.');
              return;
            }
            
            if (!process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY) {
              console.log('🟥 [StepReview] PAYSTACK_NOT_CONFIGURED:', {
                paymentReference,
                hasPublicKey: false
              });
              setPaymentError('Payment service is not configured. Please contact support.');
              return;
            }
            if (!state.email) {
              console.log('🟥 [StepReview] EMAIL_MISSING:', {
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
            
            console.log('🟦 [StepReview] PAYMENT_INITIALIZATION:', {
              callbacksConfigured: {
                onSuccess: typeof onPaymentSuccess,
                onClose: typeof onPaymentClose,
              },
              amount: pricingDetails.total,
              currency: 'ZAR'
            });
            
            // Call initializePayment with config object containing callbacks
            initializePayment({
              onSuccess: onPaymentSuccess,
              onClose: onPaymentClose,
            });
          }}
          size="lg" 
          disabled={isSubmitting || !pricingDetails || pricingDetails.total <= 0} 
          className={cn(
            "rounded-full px-8 py-3.5 font-bold text-base shadow-xl hover:shadow-2xl",
            "bg-primary hover:bg-primary/90 text-white",
            "focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:outline-none",
            "transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
            "w-full sm:w-auto sm:min-w-[240px]"
          )}
          type="button"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span className="sm:hidden">Completing...</span>
              <span className="hidden sm:inline">Completing your booking...</span>
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

