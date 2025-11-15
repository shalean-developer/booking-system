'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import Link from 'next/link';
import { serviceTypeToSlug, generatePaymentReference, requiresTeam } from '@/lib/booking-utils';
import { validateBookingForPayment, validatePricing, validatePaymentConfig } from '@/lib/booking-validation';

export function StepReview() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rebookId = searchParams.get('rebookId');
  const { state, reset } = useBooking();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [previousBooking, setPreviousBooking] = useState<any | null>(null);
  const [errorDetails, setErrorDetails] = useState<string[]>([]);
  const [PaystackHook, setPaystackHook] = useState<any>(null);
  const [selectedCleaner, setSelectedCleaner] = useState<Cleaner | null>(null);
  const [isLoadingCleaner, setIsLoadingCleaner] = useState(false);

  const serviceSlug = useMemo(() => (state.service ? serviceTypeToSlug(state.service) : null), [state.service]);
  const editButtonClass = 'h-auto px-3 py-1 text-sm font-semibold text-primary hover:text-primary/80 hover:bg-primary/5';
  const displayAmount = useCallback((value: number) => value.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 2 }), []);

  const handleEditService = useCallback(() => {
    router.push('/booking/service/select');
  }, [router]);

  const handleEditHome = useCallback(() => {
    if (serviceSlug) {
      router.push(`/booking/service/${serviceSlug}/details`);
    } else {
      router.push('/booking/service/select');
    }
  }, [router, serviceSlug]);

  const handleEditSchedule = useCallback(() => {
    if (serviceSlug) {
      router.push(`/booking/service/${serviceSlug}/schedule`);
    } else {
      router.push('/booking/service/select');
    }
  }, [router, serviceSlug]);

  const handleEditContact = useCallback(() => {
    if (serviceSlug) {
      router.push(`/booking/service/${serviceSlug}/contact`);
    } else {
      router.push('/booking/service/select');
    }
  }, [router, serviceSlug]);

  const handleEditCleaner = useCallback(() => {
    if (serviceSlug) {
      router.push(`/booking/service/${serviceSlug}/select-cleaner`);
    } else {
      router.push('/booking/service/select');
    }
  }, [router, serviceSlug]);
  
  // Calculate immediate fallback pricing for instant display
  const fallbackPricing = useMemo(() => {
    return calcTotalSync(
      {
        service: state.service,
        bedrooms: state.bedrooms,
        bathrooms: state.bathrooms,
        extras: state.extras || [],
        extrasQuantities: state.extrasQuantities,
      },
      state.frequency || 'one-time'
    );
  }, [state.service, state.bedrooms, state.bathrooms, state.extras, state.extrasQuantities, state.frequency]);

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

  // TEMPORARILY COMMENTED OUT: Paystack functionality disabled
  /*
  // Dynamically import react-paystack on client side only
  useEffect(() => {
    let isMounted = true;
    import('react-paystack')
      .then((module) => {
        if (isMounted) {
          setPaystackHook(() => module.usePaystackPayment);
        }
      })
      .catch((error) => {
        console.error('Failed to load PaystackHook:', error);
        setPaymentError('Failed to load payment system. Please refresh the page.');
      });
    
    return () => {
      isMounted = false;
    };
  }, []);
  */

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
            return;
          }
        }
      } catch (err) {
        // Silently fail cache read, will fetch from database
      }

      // Cache miss or expired - fetch fresh pricing from database
      try {
        const details = await calcTotalAsync(
          {
            service: state.service,
            bedrooms: state.bedrooms,
            bathrooms: state.bathrooms,
            extras: state.extras || [],
            extrasQuantities: state.extrasQuantities,
          },
          state.frequency || 'one-time'
        );
        setPricingDetails(details);
        pricingDetailsRef.current = details;
      } catch (error) {
        // Fallback already set above, just ensure ref is updated
        // The calcTotalAsync function already handles errors and falls back to PRICING constants
        pricingDetailsRef.current = fallbackPricing;
      }
    };

    fetchPricing();
  }, [state.service, state.bedrooms, state.bathrooms, state.extras, state.extrasQuantities, state.frequency, fallbackPricing]);

  // Keep ref in sync with pricingDetails
  useEffect(() => {
    pricingDetailsRef.current = pricingDetails;
  }, [pricingDetails]);

  // Load previous booking info for banner when rebooking
  useEffect(() => {
    const loadPrev = async () => {
      if (!rebookId) return;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const resp = await fetch(`/api/dashboard/booking?id=${encodeURIComponent(rebookId)}`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        const json = await resp.json();
        if (resp.ok && json.ok) {
          setPreviousBooking(json.booking);
        }
      } catch {
        // ignore
      }
    };
    loadPrev();
  }, [rebookId]);

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
          setSelectedCleaner(null);
        } else if (cleaner) {
          setSelectedCleaner(cleaner as Cleaner);
        } else {
          setSelectedCleaner(null);
        }
      } catch (err) {
        setSelectedCleaner(null);
      } finally {
        setIsLoadingCleaner(false);
      }
    };

    fetchCleanerDetails();
  }, [state.cleaner_id, state.requires_team]);

  const total = pricingDetails?.total || 0;
  const extrasTotal = useMemo(() => {
    return state.extras.reduce((sum, extra) => {
      const quantity = state.extrasQuantities[extra] ?? 1;
      const unitPrice = PRICING.extras[extra as keyof typeof PRICING.extras] ?? 0;
      return sum + unitPrice * Math.max(quantity, 1);
    }, 0);
  }, [state.extras, state.extrasQuantities]);
  const extrasDisplay = useMemo(() => {
    if (!state.extras || state.extras.length === 0) return [];
    const uniqueExtras = Array.from(new Set(state.extras));
    return uniqueExtras.map((extra) => {
      const quantity = state.extrasQuantities[extra] ?? 1;
      const unitPrice = PRICING.extras[extra as keyof typeof PRICING.extras] ?? 0;
      const normalizedQuantity = Math.max(quantity, 1);
      return {
        name: extra,
        quantity: normalizedQuantity,
        unitPrice,
        total: unitPrice * normalizedQuantity,
      };
    });
  }, [state.extras, state.extrasQuantities]);
  const baseAndRoomsTotal = useMemo(() => Math.max(pricingDetails.subtotal - extrasTotal, 0), [pricingDetails.subtotal, extrasTotal]);

  // Generate fresh payment reference on each payment attempt (fixes error #2)
  const [paymentReference, setPaymentReference] = useState<string>(() => generatePaymentReference());
  
  // Lock pricing amount when payment button is clicked (fixes error #3)
  const [lockedPricing, setLockedPricing] = useState<typeof pricingDetails | null>(null);

  // Safety check: Reset loading state if payment was completed but we're still on this page
  useEffect(() => {
    // Check if payment was completed (redirect should have happened)
    const paymentComplete = sessionStorage.getItem('payment_complete');
    const redirectTarget = sessionStorage.getItem('redirect_target');
    
    // If payment was completed but we're still here, reset loading state
    // This handles cases where redirect failed or was delayed
    if (paymentComplete === 'true' && redirectTarget) {
      setIsSubmitting(false);
      setLockedPricing(null);
      
      // If redirect target exists, try redirecting again
      if (window.location.pathname !== '/booking/confirmation') {
        setTimeout(() => {
          window.location.replace(redirectTarget);
        }, 100);
      }
    }
  }, []);

  // TEMPORARILY COMMENTED OUT: Paystack payment success handler disabled
  /*
  // Paystack payment success handler - Save booking and send emails before redirecting
  const onPaymentSuccess = useCallback(async (reference: { reference: string }) => {
    // Use locked pricing to ensure amount consistency (fixes error #3)
    const currentPricing = lockedPricing || pricingDetailsRef.current;
    if (!currentPricing || currentPricing.total <= 0) {
      console.error('Pricing information not loaded');
      setPaymentError('Pricing information not loaded. Please refresh and try again.');
      setIsSubmitting(false);
      return;
    }

    // Validate booking state before saving
    const validation = validateBookingForPayment(state);
    if (!validation.isValid) {
      console.error('Booking validation failed:', validation.errors);
      setPaymentError(`Please complete all required fields: ${validation.errors.join(', ')}`);
      setIsSubmitting(false);
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

      // Call booking API to save booking and send emails
      let response;
      try {
        response = await fetch('/api/bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bookingPayload),
        });
      } catch (fetchError) {
        console.error('Fetch error calling booking API:', fetchError);
        throw new Error(`Failed to call booking API: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
      }

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Error parsing booking API response:', parseError);
        const text = await response.text();
        console.error('Response text:', text);
        throw new Error('Invalid response from booking API');
      }

      if (!data.ok) {
        console.error('Booking API returned error:', data.error);
        throw new Error(data.error || 'Failed to save booking');
      }

      // Store booking reference for confirmation page fallback (BEFORE redirect)
      sessionStorage.setItem('last_booking_ref', reference.reference);
      
      // Clear any pending booking from sessionStorage (no longer needed)
      sessionStorage.removeItem('pending_booking');
      
      // IMPORTANT: Use absolute URL to ensure correct routing
      const confirmationUrl = `${window.location.origin}/booking/confirmation?ref=${encodeURIComponent(reference.reference)}`;
      const relativeUrl = `/booking/confirmation?ref=${encodeURIComponent(reference.reference)}`;
      
      // CRITICAL: Double-check URL is correct before redirecting
      if (!confirmationUrl.includes('/booking/confirmation')) {
        console.error('Redirect URL is incorrect:', confirmationUrl);
        throw new Error('Invalid redirect URL');
      }
      
      // CRITICAL: Check if redirect is already in progress to prevent flickering
      const redirectInProgress = sessionStorage.getItem('redirect_in_progress');
      if (redirectInProgress === 'true') {
        return;
      }
      
      // CRITICAL: Set redirect flags IMMEDIATELY and synchronously
      // This must happen BEFORE any async operations or React state updates
      sessionStorage.setItem('redirect_in_progress', 'true');
      sessionStorage.setItem('payment_complete', 'true');
      sessionStorage.setItem('redirect_target', confirmationUrl);
      
      // Store redirect intent in sessionStorage (backup for confirmation page)
      sessionStorage.setItem('pending_redirect', JSON.stringify({
        url: relativeUrl,
        absoluteUrl: confirmationUrl,
        timestamp: Date.now(),
        bookingId: data.bookingId,
      }));
      
      // CRITICAL: Execute redirect IMMEDIATELY and SYNCHRONOUSLY
      // Do NOT call reset() or any other async operations before redirect
      // The redirect must happen NOW to prevent Fast Refresh from interfering
      
      // Safety timeout: Reset loading state if redirect doesn't happen within 3 seconds
      // This prevents the button from staying in loading state forever
      const redirectTimeout = setTimeout(() => {
        const currentPath = window.location.pathname;
        if (currentPath !== '/booking/confirmation' && !currentPath.startsWith('/booking/confirmation')) {
          setIsSubmitting(false);
          setLockedPricing(null);
          // Try redirect again
          window.location.replace(confirmationUrl);
        }
      }, 3000);
      
      // Use window.location.replace - this is synchronous and immediate
      window.location.replace(confirmationUrl);
      
      // Clear timeout if redirect succeeds (though we likely won't reach here)
      clearTimeout(redirectTimeout);
      
      // If we reach here, the redirect failed (shouldn't happen)
      console.error('Redirect did not execute, falling back to window.location.href');
      setIsSubmitting(false);
      window.location.href = confirmationUrl;
    } catch (error) {
      console.error('Error in payment success handler:', error);
      
      // Set error state but don't clear payment success
      let errorMessage = 'Payment was successful, but we couldn\'t save your booking. Please contact support.';
      if (error instanceof Error) {
        errorMessage = `Payment was successful, but we couldn't save your booking. Please contact support with payment reference: ${reference.reference}`;
      }
      setPaymentError(errorMessage);
      setIsSubmitting(false);
      
      // Store booking reference for manual recovery (fixes error #9)
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
      
      // Show retry button in error message
      setErrorDetails([
        `Payment Reference: ${reference.reference}`,
        'You can try again or contact support with this reference number.',
      ]);
    }
  }, [state, reset, router, lockedPricing]);
  */

  // TEMPORARILY COMMENTED OUT: Paystack payment close handler disabled
  /*
  // Paystack payment close handler
  const onPaymentClose = useCallback(() => {
    // Reset submitting state when payment popup closes (fixes error #15)
    setIsSubmitting(false);
    setLockedPricing(null);
    setPaymentError('Payment was cancelled. Please try again to complete your booking.');
    
    // Clear redirect flags since payment was cancelled
    // This prevents unwanted redirects if user navigates elsewhere
    sessionStorage.removeItem('redirect_target');
    sessionStorage.removeItem('redirect_in_progress');
    // Keep last_booking_ref in case they want to retry
  }, []);
  */

  // TEMPORARILY COMMENTED OUT: Paystack configuration disabled
  /*
  // Configure Paystack payment (callbacks passed separately to initializePayment)
  // Use locked pricing if available, otherwise use current pricing
  const paystackConfig = useMemo(() => {
    const pricingToUse = lockedPricing || pricingDetails;
    const amountToUse = pricingToUse?.total || total;
    
    return {
      reference: paymentReference,
      email: state.email,
      amount: amountToUse * 100, // Paystack uses kobo/cents
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
  }, [paymentReference, state.email, lockedPricing, pricingDetails, total, state.service, state.firstName, state.lastName]);

  // Initialize Paystack payment hook (only when loaded on client side)
  const initializePayment = PaystackHook ? PaystackHook(paystackConfig) : () => {};
  */

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
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Review & Confirm
        </h2>
        <p className="text-sm md:text-base text-gray-600">
          Review your booking details before payment.
        </p>
        {rebookId && (
          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 text-blue-800 p-3 text-sm">
            <p className="font-semibold">Rebooking previous booking</p>
            <p className="mt-1">ID: {rebookId}{previousBooking?.total_amount ? ` • Previous total: R${(previousBooking.total_amount/100).toFixed(2)}` : ''}</p>
          </div>
        )}
      </div>

      {/* Review Content - Visual Hierarchy Layout */}
      <div className="space-y-6 mb-8">
        {/* CRITICAL SECTIONS - Large, Prominent Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Service & Property - PRIMARY COLOR (Large) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 p-6 md:p-8 border-2 border-primary/30 shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 shadow-md">
                  <Home className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-gray-900">Service & Property</h3>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" className={editButtonClass} onClick={handleEditService}>
                  Edit
                </Button>
                <Button type="button" variant="ghost" className={editButtonClass} onClick={handleEditHome}>
                  Edit
                </Button>
              </div>
            </div>
            <div className="space-y-4">
              <Badge variant="secondary" className="text-base px-4 py-2 font-semibold bg-white/80">
                {state.service}
              </Badge>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col justify-center py-3 px-4 bg-white/70 rounded-xl shadow-sm">
                  <span className="text-xs text-slate-600 font-medium mb-1">Bedrooms</span>
                  <span className="text-2xl font-bold text-gray-900">{state.bedrooms}</span>
                </div>
                <div className="flex flex-col justify-center py-3 px-4 bg-white/70 rounded-xl shadow-sm">
                  <span className="text-xs text-slate-600 font-medium mb-1">Bathrooms</span>
                  <span className="text-2xl font-bold text-gray-900">{state.bathrooms}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Schedule - ACCENT COLOR (Large) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 p-6 md:p-8 border-2 border-indigo-300/40 shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-200/60 flex items-center justify-center flex-shrink-0 shadow-md">
                  <Calendar className="h-6 w-6 text-indigo-700" />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-gray-900">Schedule</h3>
              </div>
              <Button type="button" variant="ghost" className={editButtonClass} onClick={handleEditSchedule}>
                Edit
              </Button>
            </div>
            <div className="space-y-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-4 py-4 px-5 bg-white/80 rounded-xl shadow-sm">
                  <Calendar className="h-6 w-6 text-indigo-600 flex-shrink-0" />
                  <div>
                    <span className="text-xs text-slate-600 font-medium block mb-1">Date</span>
                    <span className="text-base font-bold text-gray-900">
                      {state.date && format(new Date(state.date), 'EEE, MMM d, yyyy')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4 py-4 px-5 bg-white/80 rounded-xl shadow-sm">
                  <Clock className="h-6 w-6 text-indigo-600 flex-shrink-0" />
                  <div>
                    <span className="text-xs text-slate-600 font-medium block mb-1">Time</span>
                    <span className="text-base font-bold text-gray-900">{state.time}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* SECONDARY SECTIONS - Smaller, Compact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Additional Services & Notes - Compact */}
          {(extrasDisplay.length > 0 || state.notes) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="rounded-xl bg-slate-50/70 p-4 md:p-5 border border-slate-200/60 shadow-sm"
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Star className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900">Extras & Notes</h3>
                </div>
                <Button type="button" variant="ghost" className="h-auto px-2 py-1 text-xs font-semibold text-primary hover:text-primary/80 hover:bg-primary/5" onClick={handleEditHome}>
                  Edit
                </Button>
              </div>
              <div className="space-y-2">
                {extrasDisplay.length > 0 && (
                  <div className="space-y-1.5">
                    {extrasDisplay.map(({ name, quantity, total }) => (
                      <div key={name} className="flex items-center justify-between text-xs py-1.5 px-2 bg-white/60 rounded-lg">
                        <span className="text-slate-700 font-medium">
                          {name}
                          {quantity > 1 ? ` ×${quantity}` : ''}
                        </span>
                        <span className="font-semibold text-gray-900">
                          +R{total.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {state.notes && (
                  <div className="text-xs text-slate-700 leading-relaxed bg-white/60 rounded-lg p-3 line-clamp-3">
                    {state.notes}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Contact & Address - Compact */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.25 }}
            className="rounded-xl bg-slate-50/70 p-4 md:p-5 border border-slate-200/60 shadow-sm"
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-sm font-bold text-gray-900">Contact & Address</h3>
              </div>
              <Button type="button" variant="ghost" className="h-auto px-2 py-1 text-xs font-semibold text-primary hover:text-primary/80 hover:bg-primary/5" onClick={handleEditContact}>
                Edit
              </Button>
            </div>
            <div className="space-y-2">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 py-1.5 px-2 bg-white/60 rounded-lg">
                  <User className="h-3 w-3 text-primary flex-shrink-0" />
                  <span className="text-xs text-slate-700 font-medium truncate">
                    {state.firstName} {state.lastName}
                  </span>
                </div>
                <div className="flex items-center gap-2 py-1.5 px-2 bg-white/60 rounded-lg">
                  <Mail className="h-3 w-3 text-primary flex-shrink-0" />
                  <span className="text-xs text-slate-700 font-medium truncate">{state.email}</span>
                </div>
                <div className="flex items-center gap-2 py-1.5 px-2 bg-white/60 rounded-lg">
                  <Phone className="h-3 w-3 text-primary flex-shrink-0" />
                  <span className="text-xs text-slate-700 font-medium">{state.phone}</span>
                </div>
              </div>
              <div className="text-xs text-slate-700 bg-white/60 rounded-lg p-2.5">
                <p className="font-medium truncate">{state.address.line1}</p>
                <p className="text-slate-600">{state.address.suburb}, {state.address.city}</p>
              </div>
            </div>
          </motion.div>

          {/* Cleaner/Team Assignment - Compact */}
          {(state.cleaner_id || state.selected_team) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="rounded-xl bg-slate-50/70 p-4 md:p-5 border border-slate-200/60 shadow-sm"
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900">
                    {state.requires_team ? 'Team' : 'Cleaner'}
                  </h3>
                </div>
                <Button type="button" variant="ghost" className="h-auto px-2 py-1 text-xs font-semibold text-primary hover:text-primary/80 hover:bg-primary/5" onClick={handleEditCleaner}>
                  Edit
                </Button>
              </div>
              <div className="space-y-2">
                {state.requires_team ? (
                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                    <p className="text-xs font-semibold text-blue-900 mb-1">
                      {state.selected_team} Selected
                    </p>
                    <p className="text-xs text-blue-700 leading-relaxed line-clamp-2">
                      Our admin team will assign specific cleaners.
                    </p>
                  </div>
                ) : state.cleaner_id === 'manual' ? (
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                    <p className="text-xs font-semibold text-amber-900 mb-1">
                      Manual Assignment
                    </p>
                    <p className="text-xs text-amber-700 leading-relaxed line-clamp-2">
                      Best available cleaner will be assigned.
                    </p>
                  </div>
                ) : isLoadingCleaner ? (
                  <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin text-green-700" />
                      <p className="text-xs text-green-700">Loading...</p>
                    </div>
                  </div>
                ) : selectedCleaner ? (
                  <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        {selectedCleaner.photo_url ? (
                          <Image
                            src={selectedCleaner.photo_url}
                            alt={selectedCleaner.name}
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-full object-cover border border-green-300"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center border border-green-300">
                            <User className="h-5 w-5 text-green-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-green-900 mb-1 truncate">
                          {selectedCleaner.name}
                        </p>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-2.5 h-2.5 ${
                                i < Math.floor(selectedCleaner.rating)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                          <span className="text-xs text-green-700 ml-1">
                            {selectedCleaner.rating}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                    <p className="text-xs font-semibold text-green-900 mb-1">
                      Cleaner Selected
                    </p>
                    <p className="text-xs text-green-700 leading-relaxed">
                      Assigned for this booking.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Total Amount Section - CRITICAL (Most Prominent) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.35 }}
        className="rounded-2xl border-2 border-primary/40 bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 p-6 md:p-8 shadow-xl"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-xl md:text-2xl font-bold text-gray-900 block mb-2">Total Amount</span>
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-medium">Secure payment</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-4xl md:text-5xl font-bold text-primary block leading-tight">R{displayAmount(total)}</span>
            <span className="text-sm text-slate-600 mt-2 block font-medium">All fees included</span>
          </div>
        </div>
        <div className="space-y-2 text-sm text-slate-700 mb-4 pb-4 border-b border-primary/20">
          <div className="flex items-center justify-between">
            <span>Service & rooms</span>
            <span className="font-semibold">R{displayAmount(baseAndRoomsTotal)}</span>
          </div>
          {extrasTotal > 0 && (
            <div className="flex items-center justify-between">
              <span>Extras</span>
              <span className="font-semibold">+R{displayAmount(extrasTotal)}</span>
            </div>
          )}
          {pricingDetails.serviceFee > 0 && (
            <div className="flex items-center justify-between">
              <span>Service fee</span>
              <span className="font-semibold">+R{displayAmount(pricingDetails.serviceFee)}</span>
            </div>
          )}
          {pricingDetails.frequencyDiscount > 0 && (
            <div className="flex items-center justify-between text-green-600 font-semibold">
              <span>
                {state.frequency !== 'one-time' 
                  ? `${state.frequency?.replace('-', ' ')} discount${pricingDetails.frequencyDiscountPercent ? ` (${pricingDetails.frequencyDiscountPercent}%)` : ''}`
                  : `Discount${pricingDetails.frequencyDiscountPercent ? ` (${pricingDetails.frequencyDiscountPercent}%)` : ''}`
                }
              </span>
              <span>-R{displayAmount(pricingDetails.frequencyDiscount)}</span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between text-base font-bold text-slate-900">
          <span>Amount due today</span>
          <span>R{displayAmount(total)}</span>
        </div>
      </motion.div>

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
                {/* Retry Button (fixes error #16) */}
                {errorDetails.length > 0 && errorDetails[0]?.includes('Payment Reference') && (
                  <div className="mt-4 pt-3 border-t border-red-300">
                    <Button
                      onClick={() => {
                        setPaymentError(null);
                        setErrorDetails([]);
                        setIsSubmitting(false);
                        // Clear locked pricing to allow retry
                        setLockedPricing(null);
                      }}
                      variant="outline"
                      className="border-red-300 text-red-700 hover:bg-red-100"
                    >
                      Try Again
                    </Button>
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
            // TEMPORARILY COMMENTED OUT: Payment functionality disabled
            setPaymentError('Payment is temporarily disabled');
            return;
            
            /*
            setPaymentError(null);

            // Comprehensive validation before payment (fixes errors #5, #6, #11, #12, #13)
            const bookingValidation = validateBookingForPayment(state);
            if (!bookingValidation.isValid) {
              console.error('❌ Booking validation failed:', bookingValidation.errors);
              setPaymentError(bookingValidation.errors[0] || 'Please complete all required fields');
              return;
            }

            // Validate pricing (fixes error #3)
            const pricingValidation = validatePricing(pricingDetails?.total || 0);
            if (!pricingValidation.isValid) {
              console.error('❌ Pricing validation failed:', pricingValidation.errors);
              setPaymentError(pricingValidation.errors[0] || 'Pricing information is not available');
              return;
            }

            // Validate payment configuration (fixes error #6, #10)
            const configValidation = validatePaymentConfig(
              state.email,
              process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
            );
            if (!configValidation.isValid) {
              console.error('❌ Payment config validation failed:', configValidation.errors);
              setPaymentError(configValidation.errors[0] || 'Payment configuration error');
              return;
            }

            // Safety check: PaystackHook should be loaded (button is disabled if not)
            if (!PaystackHook) {
              return;
            }

            // Set loading state immediately when payment button is clicked
            setIsSubmitting(true);
            setPaymentError(null);

            // Lock pricing amount before payment (fixes error #3)
            setLockedPricing(pricingDetails);
            
            // Generate fresh payment reference (fixes error #2)
            const freshReference = generatePaymentReference();
            setPaymentReference(freshReference);
            
            // CRITICAL: Set redirect flags BEFORE initializing payment
            // This ensures they're available even if Paystack does a server-side redirect
            const confirmationUrl = `${window.location.origin}/booking/confirmation?ref=${encodeURIComponent(freshReference)}`;
            sessionStorage.setItem('redirect_target', confirmationUrl);
            sessionStorage.setItem('last_booking_ref', freshReference);
            
            // Create payment config with fresh reference and locked pricing
            const paymentConfig = {
              ...paystackConfig,
              reference: freshReference,
              amount: (pricingDetails.total * 100), // Use locked pricing amount
            };
            
            // Initialize payment with fresh config
            try {
              // CRITICAL: Set up redirect prevention BEFORE payment popup opens
              // This prevents any external redirects (like Paystack callback URLs) from interfering
              const originalPushState = history.pushState;
              const originalReplaceState = history.replaceState;
              
              history.pushState = function(...args) {
                const url = args[2];
                if (typeof url === 'string' && url.includes('/dashboard/bookings')) {
                  const paymentComplete = sessionStorage.getItem('payment_complete');
                  if (paymentComplete === 'true') {
                    const redirectTarget = sessionStorage.getItem('redirect_target');
                    if (redirectTarget) {
                      window.location.replace(redirectTarget);
                      return;
                    }
                  }
                }
                return originalPushState.apply(history, args);
              };
              
              history.replaceState = function(...args) {
                const url = args[2];
                if (typeof url === 'string' && url.includes('/dashboard/bookings')) {
                  const paymentComplete = sessionStorage.getItem('payment_complete');
                  if (paymentComplete === 'true') {
                    const redirectTarget = sessionStorage.getItem('redirect_target');
                    if (redirectTarget) {
                      window.location.replace(redirectTarget);
                      return;
                    }
                  }
                }
                return originalReplaceState.apply(history, args);
              };
              
              const paymentHook = PaystackHook(paymentConfig);
              paymentHook({
                onSuccess: (ref: any) => {
                  // Restore original history methods
                  history.pushState = originalPushState;
                  history.replaceState = originalReplaceState;
                  onPaymentSuccess(ref);
                },
                onClose: () => {
                  // Restore original history methods
                  history.pushState = originalPushState;
                  history.replaceState = originalReplaceState;
                  onPaymentClose();
                },
              });
            } catch (paymentError) {
              console.error('Error initializing payment:', paymentError);
              setPaymentError('Failed to initialize payment. Please try again.');
              setIsSubmitting(false);
              setLockedPricing(null);
            }
            */
          }}
          size="lg" 
          disabled={true} 
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
              <span className="sm:hidden">Pay R{displayAmount(total)}</span>
              <span className="hidden sm:inline">Confirm & Pay R{displayAmount(total)}</span>
            </>
          )}
        </Button>
      </div>
      <p className="mt-4 text-xs text-slate-500">
        By confirming you agree to our{' '}
        <Link href="/terms" className="underline font-semibold hover:text-primary">
          terms & conditions
        </Link>
        .
      </p>
    </motion.div>
  );
}

