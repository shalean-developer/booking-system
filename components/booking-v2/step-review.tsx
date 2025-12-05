'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBookingV2 } from '@/lib/useBookingV2';
import { useBookingPath } from '@/lib/useBookingPath';
import { calcTotalSync, PRICING } from '@/lib/pricing';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Clock, Home, User, Mail, Phone, FileText, Loader2, CreditCard, AlertCircle, Shield, Star, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Cleaner } from '@/types/booking';
import Image from 'next/image';
import { usePaystackPayment } from 'react-paystack';
import { generateUniqueBookingId } from '@/lib/booking-id';

export function StepReview() {
  const router = useRouter();
  const { state, updateField } = useBookingV2();
  const { getSelectPath, getDetailsPath, getSchedulePath, getContactPath, getConfirmationPath } = useBookingPath();
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [selectedCleaner, setSelectedCleaner] = useState<Cleaner | null>(null);
  const [isLoadingCleaner, setIsLoadingCleaner] = useState(false);
  const [showCustomTip, setShowCustomTip] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentReference, setPaymentReference] = useState<string | null>(null);
  const [discountCode, setDiscountCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [isValidatingDiscount, setIsValidatingDiscount] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    amount: number;
    description?: string;
  } | null>(null);

  const editButtonClass = 'h-auto px-3 py-1 text-sm font-semibold text-primary hover:text-primary/80 hover:bg-primary/5';

  const displayAmount = useCallback((value: number) => value.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 2 }), []);

  const handleEditService = useCallback(() => {
    router.push(getSelectPath);
  }, [router, getSelectPath]);

  const handleEditHome = useCallback(() => {
    if (state.service) {
      router.push(getDetailsPath(state.service));
    } else {
      router.push(getSelectPath);
    }
  }, [router, state.service, getDetailsPath, getSelectPath]);

  const handleEditSchedule = useCallback(() => {
    if (state.service) {
      router.push(getSchedulePath(state.service));
    } else {
      router.push(getSelectPath);
    }
  }, [router, state.service, getSchedulePath, getSelectPath]);

  const handleEditContact = useCallback(() => {
    if (state.service) {
      router.push(getContactPath(state.service));
    } else {
      router.push(getSelectPath);
    }
  }, [router, state.service, getContactPath, getSelectPath]);

  const handleEditCleaner = useCallback(() => {
    if (state.service) {
      router.push(getSchedulePath(state.service));
    } else {
      router.push(getSelectPath);
    }
  }, [router, state.service, getSchedulePath, getSelectPath]);

  const pricingDetails = useMemo(() => {
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

  const extrasDisplay = useMemo(() => {
    return state.extras.map((extra) => {
      const quantity = state.extrasQuantities[extra] || 1;
      const unitPrice = PRICING.extras[extra as keyof typeof PRICING.extras] || 0;
      const total = unitPrice * quantity;
      return { name: extra, quantity, total };
    });
  }, [state.extras, state.extrasQuantities]);

  const baseAndRoomsTotal = useMemo(() => {
    if (!state.service) return 0;
    const servicePricing = PRICING.services[state.service];
    if (!servicePricing) return 0;
    const base = servicePricing.base;
    const beds = (state.bedrooms || 0) * servicePricing.bedroom;
    const baths = (state.bathrooms || 0) * servicePricing.bathroom;
    return base + beds + baths;
  }, [state.service, state.bedrooms, state.bathrooms]);

  const extrasTotal = useMemo(() => {
    return extrasDisplay.reduce((sum, extra) => sum + extra.total, 0);
  }, [extrasDisplay]);

  const tipAmount = state.tipAmount || 0;
  const discount = discountAmount || 0;

  const total = pricingDetails.total + tipAmount - discount;

  // Paystack payment configuration
  const paystackPublicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '';
  const isPaystackConfigured = !!paystackPublicKey;

  // Generate payment reference
  const paymentRef = useMemo(() => {
    return generateUniqueBookingId([]);
  }, []);

  // Paystack payment configuration
  const paystackConfig = useMemo(() => ({
    reference: paymentRef,
    email: state.email || '',
    amount: Math.round(total * 100), // Convert to kobo (cents)
    publicKey: paystackPublicKey,
    currency: 'ZAR',
    metadata: {
      custom_fields: [
        {
          display_name: 'Booking Service',
          variable_name: 'booking_service',
          value: state.service || '',
        },
        {
          display_name: 'Customer Name',
          variable_name: 'customer_name',
          value: `${state.firstName || ''} ${state.lastName || ''}`.trim(),
        },
        {
          display_name: 'Customer Phone',
          variable_name: 'customer_phone',
          value: state.phone || '',
        },
      ],
    },
  }), [paymentRef, state.email, total, paystackPublicKey, state.service, state.firstName, state.lastName, state.phone]);

  // Initialize Paystack payment hook
  const initializePayment = usePaystackPayment(paystackConfig);

  // Show custom tip input if amount doesn't match predefined values
  useEffect(() => {
    if (tipAmount > 0 && ![0, 25, 50, 75, 100].includes(tipAmount)) {
      setShowCustomTip(true);
    }
  }, [tipAmount]);

  useEffect(() => {
    if (state.cleaner_id && !state.requires_team && state.cleaner_id !== 'manual') {
      console.log('🔄 Fetching cleaner:', {
        cleaner_id: state.cleaner_id,
        requires_team: state.requires_team,
      });
      
      setIsLoadingCleaner(true);
      setSelectedCleaner(null);
      
      fetch(`/api/cleaners?id=${state.cleaner_id}`)
        .then(async (res) => {
          console.log('📡 API Response status:', res.status, res.statusText);
          const data = await res.json();
          console.log('📦 API Response data:', data);
          
          if (res.ok && data.ok && data.cleaner) {
            console.log('✅ Cleaner found:', data.cleaner);
            setSelectedCleaner(data.cleaner);
          } else {
            console.warn('⚠️ Cleaner not found or error:', {
              resOk: res.ok,
              dataOk: data.ok,
              hasCleaner: !!data.cleaner,
              error: data.error,
              fullData: data,
            });
            setSelectedCleaner(null);
          }
        })
        .catch((error) => {
          console.error('❌ Failed to fetch cleaner:', error);
          setSelectedCleaner(null);
        })
        .finally(() => {
          console.log('🏁 Loading complete');
          setIsLoadingCleaner(false);
        });
    } else {
      console.log('⏭️ Skipping cleaner fetch:', {
        hasCleanerId: !!state.cleaner_id,
        requires_team: state.requires_team,
        cleaner_id: state.cleaner_id,
      });
      setSelectedCleaner(null);
      setIsLoadingCleaner(false);
    }
  }, [state.cleaner_id, state.requires_team]);

  const handleBack = useCallback(() => {
    if (state.service) {
      router.push(getContactPath(state.service));
    }
  }, [router, state.service, getContactPath]);

  // Handle payment success
  const handlePaymentSuccess = useCallback(async (reference: string) => {
    console.log('✅ Payment successful, reference:', reference);
    setIsProcessingPayment(true);
    setPaymentReference(reference);
    setPaymentError(null);

    try {
      // Verify payment with backend
      const verifyResponse = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference }),
      });

      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok || !verifyData.ok) {
        console.error('❌ Payment verification failed:', verifyData);
        setPaymentError(verifyData.error || 'Payment verification failed. Please contact support if you were charged.');
        setIsProcessingPayment(false);
        return;
      }

      console.log('✅ Payment verified, creating booking...');

      // Create booking with payment reference
      const bookingPayload = {
        ...state,
        paymentReference: reference,
        totalAmount: total, // Includes tip, excludes discount
        serviceFee: pricingDetails.serviceFee,
        frequencyDiscount: pricingDetails.frequencyDiscount,
        tipAmount: tipAmount,
        discountCode: appliedDiscount?.code || null,
        discountAmount: discount || 0,
      };

      const bookingResponse = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingPayload),
      });

      const bookingData = await bookingResponse.json();

      if (bookingResponse.ok && bookingData.ok) {
        console.log('✅ Booking created successfully:', bookingData.bookingId);
        
        // Redirect to confirmation page
        const confirmationUrl = getConfirmationPath(bookingData.bookingId);
        console.log('✅ Redirecting to confirmation:', confirmationUrl);
        
        // Store booking reference before redirect
        sessionStorage.setItem('last_booking_ref', bookingData.bookingId);
        sessionStorage.setItem('payment_complete', 'true');
        
        // Redirect to confirmation page
        window.location.href = confirmationUrl;
      } else {
        console.error('❌ Booking creation failed:', bookingData);
        setPaymentError(bookingData.error || 'Failed to create booking. Please contact support.');
        setIsProcessingPayment(false);
      }
    } catch (error) {
      console.error('❌ Error processing payment:', error);
      setPaymentError('An error occurred while processing your booking. Please contact support if you were charged.');
      setIsProcessingPayment(false);
    }
  }, [state, pricingDetails, total, tipAmount, discount, appliedDiscount, getConfirmationPath]);

  // Handle discount code validation
  const handleApplyDiscount = useCallback(async () => {
    if (!discountCode.trim()) return;

    setIsValidatingDiscount(true);
    setDiscountError(null);

    try {
      let response: Response;
      try {
        response = await fetch('/api/discount-codes/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: discountCode.trim(),
            service_type: state.service,
            subtotal: pricingDetails.total,
          }),
        });
      } catch (fetchError: any) {
        // Network error (connection failed, CORS, etc.)
        console.error('Network error validating discount code:', fetchError);
        setDiscountError('Network error. Please check your connection and try again.');
        setDiscountAmount(0);
        setAppliedDiscount(null);
        setIsValidatingDiscount(false);
        return;
      }

      // Check content type first to avoid JSON parsing errors
      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');

      // Check if response is OK
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          if (isJson) {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } else {
            const text = await response.text();
            if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
              errorMessage = 'API endpoint not found. Please restart the dev server or contact support.';
            } else {
              errorMessage = text || errorMessage;
            }
          }
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage;
        }
        setDiscountError(errorMessage);
        setDiscountAmount(0);
        setAppliedDiscount(null);
        setIsValidatingDiscount(false);
        return;
      }

      // Verify it's JSON before parsing
      if (!isJson) {
        const text = await response.text();
        if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
          setDiscountError('API endpoint not found. Please restart the dev server.');
        } else {
          setDiscountError('Invalid response from server. Please try again.');
        }
        setDiscountAmount(0);
        setAppliedDiscount(null);
        setIsValidatingDiscount(false);
        return;
      }

      // Parse JSON response
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('JSON parsing error:', jsonError);
        setDiscountError('Invalid response from server. Please try again.');
        setDiscountAmount(0);
        setAppliedDiscount(null);
        setIsValidatingDiscount(false);
        return;
      }

      if (data.ok && data.discount) {
        setDiscountAmount(data.discount.discount_amount);
        setAppliedDiscount({
          code: data.discount.code,
          amount: data.discount.discount_amount,
          description: data.discount.description,
        });
        setDiscountError(null);
      } else {
        setDiscountError(data.error || 'Invalid discount code');
        setDiscountAmount(0);
        setAppliedDiscount(null);
      }
    } catch (error: any) {
      console.error('Error validating discount code:', error);
      setDiscountError(error.message || 'Failed to validate discount code. Please try again.');
      setDiscountAmount(0);
      setAppliedDiscount(null);
    } finally {
      setIsValidatingDiscount(false);
    }
  }, [discountCode, state.service, pricingDetails.total]);

  const handleRemoveDiscount = useCallback(() => {
    setDiscountCode('');
    setDiscountAmount(0);
    setAppliedDiscount(null);
    setDiscountError(null);
  }, []);

  // Handle payment close (user closed popup)
  const handlePaymentClose = useCallback(() => {
    console.log('Payment popup closed');
    setIsProcessingPayment(false);
    // Don't show error if user just closed the popup
  }, []);

  // Initialize payment when button is clicked
  const handleSubmit = useCallback(() => {
    if (!state.service || !state.date || !state.time || !state.email || !state.firstName || !state.lastName) {
      setPaymentError('Please complete all required fields');
      return;
    }

    if (!isPaystackConfigured) {
      setPaymentError('Payment service is not configured. Please contact support.');
      return;
    }

    if (!state.email) {
      setPaymentError('Email is required for payment');
      return;
    }

    setPaymentError(null);
    setIsProcessingPayment(true);

    // Initialize Paystack payment
    initializePayment({
      onSuccess: (reference) => {
        handlePaymentSuccess(reference.reference);
      },
      onClose: handlePaymentClose,
    });
  }, [state, isPaystackConfigured, initializePayment, handlePaymentSuccess, handlePaymentClose]);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100 max-w-[576px] mx-auto"
      >
        <div className="mb-8 space-y-3">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            Review your booking
          </h2>
          <p className="text-sm md:text-base text-gray-600">
            Please review all details before confirming your booking.
          </p>
        </div>

        <div className="space-y-6">
          {(state.cleaner_id || state.selected_team) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-xl bg-slate-50/70 p-5 md:p-6 border border-slate-200/60 shadow-sm"
            >
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">
                    {state.requires_team ? 'Team' : 'Cleaner'}
                  </h3>
                </div>
                <Button type="button" variant="ghost" className={editButtonClass} onClick={handleEditCleaner}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {state.requires_team ? (
                  <div className="space-y-3">
                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                      <p className="text-xs font-semibold text-blue-900 mb-1">
                        {state.selected_team} Selected
                      </p>
                      <p className="text-xs text-blue-700">
                        Our admin team will assign specific cleaners.
                      </p>
                      {tipAmount > 0 && (
                        <div className="mt-2 pt-2 border-t border-blue-300">
                          <p className="text-xs text-blue-800">
                            <span className="font-semibold">Tip:</span> R{tipAmount.toFixed(2)}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tipAmount" className="text-xs font-semibold text-gray-900">
                        Add a tip (optional)
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">R</span>
                        <Input
                          id="tipAmount"
                          type="number"
                          min="0"
                          step="10"
                          placeholder="0"
                          value={tipAmount || ''}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            updateField('tipAmount', value);
                          }}
                          className={cn(
                            'h-10 rounded-lg border-2 pl-8 transition-all',
                            'focus:ring-2 focus:ring-primary/30 focus:border-primary',
                            'hover:border-gray-300'
                          )}
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        Show your appreciation with a tip
                      </p>
                    </div>
                  </div>
                ) : isLoadingCleaner ? (
                  <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin text-green-700" />
                      <p className="text-xs text-green-700">Loading...</p>
                    </div>
                  </div>
                ) : selectedCleaner ? (
                  <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                    {/* Black Header Section */}
                    <div className="bg-gray-900 px-4 py-4 flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {selectedCleaner.photo_url ? (
                          <Image
                            src={selectedCleaner.photo_url}
                            alt={selectedCleaner.name || 'Cleaner'}
                            width={56}
                            height={56}
                            className="w-14 h-14 rounded-full object-cover border-2 border-white/20"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center border-2 border-white/20">
                            <User className="h-7 w-7 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white/80 mb-1">An upfront tip for</p>
                        <p className="text-lg font-bold text-white truncate">
                          {selectedCleaner.name || 'Cleaner'}
                        </p>
                      </div>
                    </div>
                    
                    {/* White Tip Section */}
                    <div className="bg-white p-4">
                      <Label className="text-sm font-medium text-gray-700 mb-3 block">
                        Tip amount
                      </Label>
                      
                      {/* Predefined Tip Amounts */}
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        {[0, 25, 50, 75, 100].map((amount) => (
                          <button
                            key={amount}
                            type="button"
                            onClick={() => {
                              updateField('tipAmount', amount);
                              setShowCustomTip(false);
                            }}
                            className={cn(
                              'w-14 h-14 rounded-full border-2 transition-all flex items-center justify-center text-sm font-medium',
                              tipAmount === amount && !showCustomTip
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-gray-300 text-gray-700 hover:border-gray-400'
                            )}
                          >
                            R{amount}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            setShowCustomTip(true);
                            if (!tipAmount || [0, 25, 50, 75, 100].includes(tipAmount)) {
                              updateField('tipAmount', 0);
                            }
                          }}
                          className={cn(
                            'text-sm font-medium transition-colors px-2',
                            showCustomTip
                              ? 'text-primary'
                              : 'text-primary hover:text-primary/80'
                          )}
                        >
                          Custom
                          <br />
                          amount
                        </button>
                      </div>
                      
                      {/* Custom Amount Input - Always visible at bottom */}
                      <div className="mt-3">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">R</span>
                          <Input
                            id="tipAmount"
                            type="number"
                            min="0"
                            step="10"
                            placeholder="0"
                            value={tipAmount || ''}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0;
                              updateField('tipAmount', value);
                              if (value > 0 && ![0, 25, 50, 75, 100].includes(value)) {
                                setShowCustomTip(true);
                              }
                            }}
                            className={cn(
                              'h-10 rounded-lg border-2 pl-8 transition-all bg-gray-50',
                              'focus:ring-2 focus:ring-primary/30 focus:border-primary focus:bg-white',
                              'hover:border-gray-300'
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : state.cleaner_id === 'manual' ? (
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                    <p className="text-xs font-semibold text-amber-900 mb-1">
                      Manual Assignment
                    </p>
                    <p className="text-xs text-amber-700">
                      Best available cleaner will be assigned.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                    <p className="text-xs font-semibold text-slate-900 mb-1">
                      Cleaner Selected
                    </p>
                    <p className="text-xs text-slate-600 mb-2">
                      Professional cleaner assigned
                    </p>
                    {state.cleaner_id && (
                      <div className="mt-2 pt-2 border-t border-slate-300">
                        <p className="text-xs text-slate-500">
                          <strong>Debug Info:</strong>
                        </p>
                        <p className="text-xs text-slate-500">
                          Cleaner ID: {state.cleaner_id}
                        </p>
                        <p className="text-xs text-slate-500">
                          Loading: {isLoadingCleaner ? 'Yes' : 'No'}
                        </p>
                        <p className="text-xs text-slate-500">
                          Has Cleaner Data: {selectedCleaner ? 'Yes' : 'No'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-xl bg-slate-50/70 p-5 md:p-6 border border-slate-200/60 shadow-sm"
          >
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Home className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Service & Property</h3>
              </div>
              <Button type="button" variant="ghost" className={editButtonClass} onClick={handleEditService}>
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 px-3 bg-white/60 rounded-lg">
                <span className="text-sm text-slate-700 font-medium">Service Type</span>
                <Badge variant="secondary" className="font-semibold">{state.service}</Badge>
              </div>
              <div className="flex items-center justify-between py-2 px-3 bg-white/60 rounded-lg">
                <span className="text-sm text-slate-700 font-medium">Bedrooms</span>
                <span className="text-sm font-semibold text-gray-900">{state.bedrooms}</span>
              </div>
              <div className="flex items-center justify-between py-2 px-3 bg-white/60 rounded-lg">
                <span className="text-sm text-slate-700 font-medium">Bathrooms</span>
                <span className="text-sm font-semibold text-gray-900">{state.bathrooms}</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="rounded-xl bg-slate-50/70 p-5 md:p-6 border border-slate-200/60 shadow-sm"
          >
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Schedule</h3>
              </div>
              <Button type="button" variant="ghost" className={editButtonClass} onClick={handleEditSchedule}>
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-4 py-3 px-4 bg-white/80 rounded-xl shadow-sm">
                <Calendar className="h-5 w-5 text-indigo-600 flex-shrink-0" />
                <div>
                  <span className="text-xs text-slate-600 font-medium block mb-1">Date</span>
                  <span className="text-sm font-bold text-gray-900">
                    {state.date && format(new Date(state.date), 'EEE, MMM d, yyyy')}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4 py-3 px-4 bg-white/80 rounded-xl shadow-sm">
                <Clock className="h-5 w-5 text-indigo-600 flex-shrink-0" />
                <div>
                  <span className="text-xs text-slate-600 font-medium block mb-1">Time</span>
                  <span className="text-sm font-bold text-gray-900">{state.time}</span>
                </div>
              </div>
              {state.frequency !== 'one-time' && (
                <div className="flex items-center gap-4 py-3 px-4 bg-white/80 rounded-xl shadow-sm">
                  <Badge variant="outline" className="font-semibold">
                    {state.frequency.replace('-', ' ')}
                  </Badge>
                </div>
              )}
            </div>
          </motion.div>

          {(extrasDisplay.length > 0 || state.notes) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className="rounded-xl bg-slate-50/70 p-5 md:p-6 border border-slate-200/60 shadow-sm"
            >
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Star className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">Extras & Notes</h3>
                </div>
                <Button type="button" variant="ghost" className={editButtonClass} onClick={handleEditHome}>
                  <Pencil className="h-4 w-4" />
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
                  <div className="text-xs text-slate-700 leading-relaxed bg-white/60 rounded-lg p-3">
                    {state.notes}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="rounded-xl bg-slate-50/70 p-5 md:p-6 border border-slate-200/60 shadow-sm"
          >
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Contact & Address</h3>
              </div>
              <Button type="button" variant="ghost" className={editButtonClass} onClick={handleEditContact}>
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 py-1.5 px-2 bg-white/60 rounded-lg">
                  <User className="h-3 w-3 text-primary flex-shrink-0" />
                  <span className="text-xs text-slate-700 font-medium">
                    {state.firstName} {state.lastName}
                  </span>
                </div>
                <div className="flex items-center gap-2 py-1.5 px-2 bg-white/60 rounded-lg">
                  <Mail className="h-3 w-3 text-primary flex-shrink-0" />
                  <span className="text-xs text-slate-700 font-medium">{state.email}</span>
                </div>
                <div className="flex items-center gap-2 py-1.5 px-2 bg-white/60 rounded-lg">
                  <Phone className="h-3 w-3 text-primary flex-shrink-0" />
                  <span className="text-xs text-slate-700 font-medium">{state.phone}</span>
                </div>
              </div>
              <div className="text-xs text-slate-700 bg-white/60 rounded-lg p-2.5">
                <p className="font-medium">{state.address.line1}</p>
                <p className="text-slate-600">{state.address.suburb}, {state.address.city}</p>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="rounded-2xl border-2 border-primary/40 bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 p-6 md:p-8 shadow-xl mt-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-xl md:text-2xl font-bold text-gray-900 block mb-2">Total Amount</span>
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <Shield className="h-5 w-5 text-primary" />
                <span className="font-medium">Secure booking</span>
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
            {discount > 0 && (
              <div className="flex items-center justify-between text-green-600 font-semibold">
                <span>
                  Discount {appliedDiscount?.code && `(${appliedDiscount.code})`}
                </span>
                <span>-R{displayAmount(discount)}</span>
              </div>
            )}
            {tipAmount > 0 && (
              <div className="flex items-center justify-between text-purple-600 font-semibold">
                <span>Tip for cleaner</span>
                <span>+R{displayAmount(tipAmount)}</span>
              </div>
            )}
          </div>

          {/* Discount Code Input */}
          <div className="mt-4 pt-4 border-t border-primary/20">
            <div className="space-y-2">
              <Label htmlFor="discount-code" className="text-sm font-medium text-slate-700">
                Have a discount code?
              </Label>
              <div className="flex gap-2">
                <Input
                  id="discount-code"
                  type="text"
                  placeholder="Enter discount code"
                  value={discountCode}
                  onChange={(e) => {
                    setDiscountCode(e.target.value.toUpperCase());
                    setDiscountError(null);
                    if (appliedDiscount) {
                      setAppliedDiscount(null);
                      setDiscountAmount(0);
                    }
                  }}
                  className="flex-1"
                  disabled={isValidatingDiscount || isProcessingPayment}
                />
                <Button
                  onClick={handleApplyDiscount}
                  disabled={!discountCode || isValidatingDiscount || isProcessingPayment || !!appliedDiscount}
                  variant="outline"
                  size="sm"
                >
                  {isValidatingDiscount ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Apply'
                  )}
                </Button>
                {appliedDiscount && (
                  <Button
                    onClick={handleRemoveDiscount}
                    variant="ghost"
                    size="sm"
                    disabled={isProcessingPayment}
                  >
                    Remove
                  </Button>
                )}
              </div>
              {discountError && (
                <p className="text-red-600 text-xs mt-1">{discountError}</p>
              )}
              {appliedDiscount && (
                <p className="text-green-600 text-xs mt-1">
                  ✓ Discount applied: {appliedDiscount.description || appliedDiscount.code}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-base font-bold text-slate-900 mt-4 pt-4 border-t border-primary/20">
            <span>Amount due today</span>
            <span>R{displayAmount(total)}</span>
          </div>
        </motion.div>

        {paymentError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-red-50 border-2 border-red-200 p-5 md:p-6"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-base font-bold text-red-900 mb-2">Error</h3>
                <p className="text-sm text-red-800">{paymentError}</p>
              </div>
            </div>
          </motion.div>
        )}

        {!isPaystackConfigured && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-amber-50 border-2 border-amber-200 p-5 md:p-6"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-base font-bold text-amber-900 mb-2">Payment Service Not Available</h3>
                <p className="text-sm text-amber-800">Payment processing is currently unavailable. Please contact support to complete your booking.</p>
              </div>
            </div>
          </motion.div>
        )}

        {isPaystackConfigured && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-2 text-xs text-slate-500 mt-4"
          >
            <Shield className="h-4 w-4" />
            <span>Secure payment powered by Paystack</span>
          </motion.div>
        )}

        <div className="flex flex-col sm:flex-row justify-between gap-4 mt-8 pt-6 border-t border-slate-200">
          <Button 
            variant="outline" 
            onClick={handleBack} 
            size="lg" 
            disabled={isProcessingPayment} 
            className={cn(
              "rounded-full px-6 py-3 font-semibold h-auto",
              "border-2 border-slate-300 hover:border-slate-400 hover:bg-slate-50",
              "focus:ring-2 focus:ring-primary/30 focus:outline-none",
              "transition-all duration-200",
              "w-full sm:w-auto"
            )}
            type="button"
          >
            Back
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isProcessingPayment || !state.service || !state.date || !state.time || !isPaystackConfigured} 
            size="lg" 
            className={cn(
              "rounded-full px-8 py-3 font-semibold shadow-lg w-full sm:w-auto justify-center",
              "bg-primary hover:bg-primary/90 text-white",
              "focus:ring-2 focus:ring-primary/30 focus:outline-none",
              "transition-all duration-200",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            type="button"
          >
            {isProcessingPayment ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span className="sm:hidden">Processing...</span>
                <span className="hidden sm:inline">Processing payment...</span>
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
      </motion.div>
    </div>
  );
}
