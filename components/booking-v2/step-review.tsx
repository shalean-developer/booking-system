'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, MapPin, Calendar, Clock, CheckCircle2, ArrowLeft, ShieldCheck, Edit2, Mail, Phone, Home, PlusCircle, LucideIcon, Loader2, AlertCircle, Waves } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBookingV2 } from '@/lib/useBookingV2';
import { useBookingPath } from '@/lib/useBookingPath';
import { calcTotalSync, PRICING } from '@/lib/pricing';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Cleaner } from '@/types/booking';
import { usePaystackPayment } from 'react-paystack';
import { generateUniqueBookingId } from '@/lib/booking-id';
import { AddressAutocomplete } from '@/components/address-autocomplete';

// --- Types ---

type TipOption = 'R0' | 'R25' | 'R50' | 'R75' | 'R100' | 'Custom';

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  suburb: string;
  city: string;
  tip: TipOption;
  customTip: string;
  discountCode: string;
}

// --- Helpers ---

const StepIndicator = ({
  currentStep
}: {
  currentStep: number;
}) => {
  const steps = [{
    id: 1,
    label: 'Details'
  }, {
    id: 2,
    label: 'Worker'
  }, {
    id: 3,
    label: 'Submit'
  }];
  return <div className="flex items-center justify-center space-x-3">
      {steps.map((step, idx) => <React.Fragment key={step.id}>
          <div className="flex flex-col items-center">
            <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors", currentStep >= step.id ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500")}>
              {currentStep > step.id ? <CheckCircle2 className="w-4 h-4" /> : step.id}
            </div>
            <span className={cn("text-[10px] mt-1.5 font-medium uppercase tracking-wider", currentStep >= step.id ? "text-blue-600" : "text-gray-400")}>
              {step.label}
            </span>
          </div>
          {idx < steps.length - 1 && <div className={cn("h-px w-12", currentStep > step.id ? "bg-blue-600" : "bg-gray-200")} />}
        </React.Fragment>)}
    </div>;
};

const Footer = () => <footer className="bg-slate-900 text-white mt-20 h-20 flex items-center">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
      <div className="flex flex-col md:flex-row justify-between items-center text-slate-500 text-xs">
        <p>© 2026 Shalean Cleaning Services. All rights reserved.</p>
        <div className="flex space-x-6 mt-4 md:mt-0">
          <a href="#" className="hover:text-slate-300">Privacy Policy</a>
          <a href="#" className="hover:text-slate-300">Terms of Service</a>
        </div>
      </div>
    </div>
  </footer>;

const SectionHeader = ({
  title,
  onEdit
}: {
  title: string;
  onEdit?: () => void;
}) => <div className="flex items-center justify-between mb-6">
    <h2 className="text-xl font-bold text-gray-800">{title}</h2>
    {onEdit && <button onClick={onEdit} className="text-blue-500 hover:text-blue-700 transition-colors p-1">
        <Edit2 size={18} />
      </button>}
  </div>;

const InputWrapper = ({
  label,
  icon: Icon,
  required,
  children
}: {
  label: string;
  icon: LucideIcon;
  required?: boolean;
  children: React.ReactNode;
}) => <div className="space-y-2">
    <label className="text-sm font-semibold text-gray-700 block">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10">
        <Icon size={18} />
      </div>
      {children}
    </div>
  </div>;

// @component: StepReview (formerly BookingReviewForm)
export function StepReview() {
  const router = useRouter();
  const { state, setState, updateField } = useBookingV2();
  const { getSelectPath, getDetailsPath, getSchedulePath, getConfirmationPath } = useBookingPath();
  
  const [form, setForm] = useState<FormState>({
    firstName: state.firstName || '',
    lastName: state.lastName || '',
    email: state.email || '',
    phone: state.phone || '',
    address: state.address?.line1 || '',
    suburb: state.address?.suburb || '',
    city: state.address?.city || 'Cape Town',
    tip: 'R0',
    customTip: '',
    discountCode: ''
  });

  const [selectedCleaner, setSelectedCleaner] = useState<Cleaner | null>(null);
  const [isLoadingCleaner, setIsLoadingCleaner] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [isValidatingDiscount, setIsValidatingDiscount] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    amount: number;
    description?: string;
  } | null>(null);

  const tipOptions: TipOption[] = ['R0', 'R25', 'R50', 'R75', 'R100', 'Custom'];

  // Load cleaner info
  useEffect(() => {
    if (state.cleaner_id && !state.requires_team && state.cleaner_id !== 'manual') {
      setIsLoadingCleaner(true);
      setSelectedCleaner(null);
      
      fetch(`/api/cleaners?id=${state.cleaner_id}`)
        .then(async (res) => {
          const data = await res.json();
          if (res.ok && data.ok && data.cleaner) {
            setSelectedCleaner(data.cleaner);
          }
        })
        .catch(() => {
          setSelectedCleaner(null);
        })
        .finally(() => {
          setIsLoadingCleaner(false);
        });
    } else {
      setSelectedCleaner(null);
      setIsLoadingCleaner(false);
    }
  }, [state.cleaner_id, state.requires_team]);

  // Sync form with state
  useEffect(() => {
    setForm(prev => ({
      ...prev,
      firstName: state.firstName || prev.firstName,
      lastName: state.lastName || prev.lastName,
      email: state.email || prev.email,
      phone: state.phone || prev.phone,
      address: state.address?.line1 || prev.address,
      suburb: state.address?.suburb || prev.suburb,
      city: state.address?.city || prev.city,
    }));
  }, [state.firstName, state.lastName, state.email, state.phone, state.address]);

  // Calculate pricing
  const pricingDetails = useMemo(() => {
    if (!state.service) {
      return {
        subtotal: 0,
        serviceFee: 0,
        frequencyDiscount: 0,
        frequencyDiscountPercent: 0,
        total: 0,
      };
    }
    try {
      return calcTotalSync(
        {
          service: state.service,
          bedrooms: state.bedrooms,
          bathrooms: state.bathrooms,
          extras: state.extras || [],
          extrasQuantities: state.extrasQuantities,
          carpetDetails: state.carpetDetails,
          numberOfCleaners: state.numberOfCleaners,
        },
        state.frequency || 'one-time'
      );
    } catch (error) {
      console.error('Error calculating pricing:', error);
      return {
        subtotal: 0,
        serviceFee: 0,
        frequencyDiscount: 0,
        frequencyDiscountPercent: 0,
        total: 0,
      };
    }
  }, [
    state.service,
    state.bedrooms,
    state.bathrooms,
    state.extras,
    state.extrasQuantities,
    state.frequency,
    state.carpetDetails,
    state.numberOfCleaners,
  ]);

  const tipAmount = useMemo(() => {
    if (form.tip === 'Custom') {
      return parseFloat(form.customTip.replace(/[^0-9.]/g, '')) || 0;
    }
    return parseFloat(form.tip.replace(/[^0-9.]/g, '')) || 0;
  }, [form.tip, form.customTip]);

  const discount = (state.discountAmount || 0) || discountAmount;
  const total = (pricingDetails?.total || 0) + tipAmount - discount;

  // Paystack payment configuration
  const paystackPublicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '';
  const isPaystackConfigured = !!paystackPublicKey;
  const paymentRef = useMemo(() => generateUniqueBookingId([]), []);

  const paystackConfig = useMemo(() => ({
    reference: paymentRef,
    email: form.email || state.email || '',
    amount: Math.max(0, Math.round(total * 100)),
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
          value: `${form.firstName || ''} ${form.lastName || ''}`.trim(),
        },
        {
          display_name: 'Customer Phone',
          variable_name: 'customer_phone',
          value: form.phone || state.phone || '',
        },
      ],
    },
  }), [paymentRef, form.email, state.email, total, paystackPublicKey, state.service, form.firstName, form.lastName, form.phone, state.phone]);

  const initializePayment = usePaystackPayment(paystackConfig);

  // Handle payment success
  const handlePaymentSuccess = useCallback(async (reference: string) => {
    setIsProcessingPayment(true);
    setPaymentError(null);

    // Save contact info to state
    setState((prevState) => ({
      ...prevState,
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone,
      address: {
        ...prevState.address,
        line1: form.address,
        suburb: form.suburb,
        city: form.city,
      },
      tipAmount: tipAmount,
    }));

    try {
      const verifyResponse = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference }),
      });

      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok || !verifyData.ok) {
        setPaymentError(verifyData.error || 'Payment verification failed. Please contact support if you were charged.');
        setIsProcessingPayment(false);
        return;
      }

      const bookingPayload = {
        ...state,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        address: {
          ...(state.address || {}),
          line1: form.address,
          suburb: form.suburb,
          city: form.city,
        },
        paymentReference: reference,
        totalAmount: total,
        serviceFee: pricingDetails?.serviceFee || 0,
        frequencyDiscount: pricingDetails?.frequencyDiscount || 0,
        tipAmount: tipAmount,
        discountCode: form.discountCode || null,
        discountAmount: discount || 0,
      };

      const bookingResponse = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingPayload),
      });

      const bookingData = await bookingResponse.json();

      if (bookingResponse.ok && bookingData.ok) {
        const confirmationUrl = getConfirmationPath(bookingData.bookingId);
        sessionStorage.setItem('last_booking_ref', bookingData.bookingId);
        sessionStorage.setItem('payment_complete', 'true');
        window.location.href = confirmationUrl;
      } else {
        setPaymentError(bookingData.error || 'Failed to create booking. Please contact support.');
        setIsProcessingPayment(false);
      }
    } catch (error) {
      setPaymentError('An error occurred while processing your booking. Please contact support if you were charged.');
      setIsProcessingPayment(false);
    }
  }, [state, form, pricingDetails, total, tipAmount, discount, getConfirmationPath, setState]);

  // Handle discount code validation
  const handleApplyDiscount = useCallback(async () => {
    if (!form.discountCode.trim()) return;

    setIsValidatingDiscount(true);
    setDiscountError(null);

    try {
      const response = await fetch('/api/discount-codes/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.discountCode.trim(),
          service_type: state.service,
          subtotal: pricingDetails?.total || 0,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to validate discount code' }));
        setDiscountError(errorData.error || 'Failed to validate discount code');
        setDiscountAmount(0);
        setAppliedDiscount(null);
        return;
      }

      const data = await response.json();

      if (data.ok && data.discount) {
        setDiscountAmount(data.discount.discount_amount);
        setAppliedDiscount({
          code: data.discount.code,
          amount: data.discount.discount_amount,
          description: data.discount.description,
        });
        updateField('discountCode', data.discount.code);
        updateField('discountAmount', data.discount.discount_amount);
        setDiscountError(null);
      } else {
        setDiscountError(data.error || 'Invalid discount code');
        setDiscountAmount(0);
        setAppliedDiscount(null);
      }
    } catch (error: any) {
      setDiscountError(error?.message || 'Network error. Please check your connection and try again.');
      setDiscountAmount(0);
      setAppliedDiscount(null);
    } finally {
      setIsValidatingDiscount(false);
    }
  }, [form.discountCode, state.service, pricingDetails?.total, updateField]);

  // Handle payment submission
  const handleSubmit = useCallback(() => {
    if (!form.firstName || !form.lastName || !form.email || !form.phone || !form.address) {
      setPaymentError('Please complete all required contact fields');
      return;
    }

    if (!isPaystackConfigured) {
      setPaymentError('Payment service is not configured. Please contact support.');
      return;
    }

    setPaymentError(null);
    setIsProcessingPayment(true);

    if (!isPaystackConfigured || total <= 0) {
      setPaymentError('Payment service is not available. Please contact support.');
      setIsProcessingPayment(false);
      return;
    }

    try {
      initializePayment({
        onSuccess: (reference) => {
          handlePaymentSuccess(reference.reference);
        },
        onClose: () => {
          setIsProcessingPayment(false);
        },
      });
    } catch (error) {
      console.error('Payment initialization error:', error);
      setPaymentError('Failed to initialize payment. Please try again.');
      setIsProcessingPayment(false);
    }
  }, [form, isPaystackConfigured, initializePayment, handlePaymentSuccess, total]);

  const displayAmount = useCallback((value: number) => value.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 2 }), []);

  const handleBack = useCallback(() => {
    if (state.service) {
      router.push(getSchedulePath(state.service));
    }
  }, [router, state.service, getSchedulePath]);

  const handleEditService = useCallback(() => {
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

  // Calculate estimated duration
  const estimatedDuration = useMemo(() => {
    if (!state.service) return '—';
    let hours = state.service === 'Standard' ? 2.0 : state.service === 'Airbnb' ? 2.5 : state.service === 'Deep' ? 4.0 : state.service === 'Move In/Out' ? 4.5 : 2.0;
    hours += (state.bedrooms || 0) * 0.5;
    hours += (state.bathrooms || 0) * 0.75;
    hours += (state.extras?.length || 0) * 0.25;
    const roundHalf = (v: number) => Math.round(v * 2) / 2;
    const base = Math.min(12, Math.max(1.5, roundHalf(hours)));
    const min = Math.max(1, roundHalf(base * 0.9));
    const max = Math.max(min, roundHalf(base * 1.1));
    return `${min}–${max} hours`;
  }, [state.service, state.bedrooms, state.bathrooms, state.extras]);

  // @return
  return <div className="min-h-screen bg-[#F9FAFB] font-sans text-slate-900">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Waves className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">Shalean</span>
          </div>

          {/* Stepper - Between logo and navlinks */}
          <div className="hidden md:flex items-center justify-center flex-1 px-8">
            <StepIndicator currentStep={3} />
          </div>

          <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
            <a href="#" className="hover:text-blue-600">Services</a>
            <a href="#" className="hover:text-blue-600">Pricing</a>
            <a href="#" className="hover:text-blue-600">Help Center</a>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-colors">
              Book Now
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-3xl mx-auto">

        <div className="space-y-4 mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Review Your Booking</h1>
          <p className="text-gray-500">Please review your booking details before confirming.</p>
        </div>

        {paymentError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm text-red-800">{paymentError}</p>
            </div>
          </div>
        )}

        <div className="space-y-8">
          {/* Cleaner Section */}
          {(state.cleaner_id || state.selected_team) && (
            <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <SectionHeader title="Cleaner" onEdit={handleEditSchedule} />
              {isLoadingCleaner ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </div>
              ) : selectedCleaner ? (
                <>
                  <div className="bg-blue-600 text-white rounded-xl p-6 mb-6">
                    <p className="text-sm opacity-90 mb-1">An upfront tip for</p>
                    <h3 className="text-xl font-bold">{selectedCleaner.name || 'Cleaner'}</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <label className="text-sm font-semibold text-gray-700">Tip amount</label>
                    <div className="flex flex-wrap gap-3">
                      {tipOptions.map(opt => <button 
                        key={opt} 
                        type="button"
                        onClick={() => setForm({
                          ...form,
                          tip: opt
                        })} 
                        className={`px-5 py-2 rounded-full border text-sm font-medium transition-all duration-200 ${form.tip === opt ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'}`}>
                          {opt}
                        </button>)}
                    </div>
                    {form.tip === 'Custom' && <motion.div 
                      initial={{ opacity: 0, y: -10 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      className="mt-4">
                        <input 
                          type="text" 
                          placeholder="Enter custom amount" 
                          className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" 
                          value={form.customTip} 
                          onChange={e => setForm({
                            ...form,
                            customTip: e.target.value
                          })} 
                        />
                      </motion.div>}
                  </div>
                </>
              ) : state.requires_team ? (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <p className="text-sm font-semibold text-blue-900 mb-1">{state.selected_team} Selected</p>
                  <p className="text-xs text-blue-700">Our admin team will assign specific cleaners.</p>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                  <p className="text-sm font-semibold text-gray-900">Cleaner will be assigned</p>
                </div>
              )}
            </section>
          )}

          {/* Contact & Address Section */}
          <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <SectionHeader title="Contact & Address" />
            <div className="grid md:grid-cols-2 gap-6">
              <InputWrapper label="First Name" icon={User} required>
                <input 
                  type="text" 
                  placeholder="e.g., Thabo" 
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={form.firstName} 
                  onChange={e => setForm({
                    ...form,
                    firstName: e.target.value
                  })} 
                />
              </InputWrapper>
              <InputWrapper label="Last Name" icon={User} required>
                <input 
                  type="text" 
                  placeholder="e.g., Mokoena" 
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={form.lastName} 
                  onChange={e => setForm({
                    ...form,
                    lastName: e.target.value
                  })} 
                />
              </InputWrapper>
              <InputWrapper label="Email Address" icon={Mail} required>
                <input 
                  type="email" 
                  placeholder="e.g., thabo@example.com" 
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={form.email} 
                  onChange={e => setForm({
                    ...form,
                    email: e.target.value
                  })} 
                />
              </InputWrapper>
              <InputWrapper label="Phone Number" icon={Phone} required>
                <input 
                  type="tel" 
                  placeholder="0821234567 or +27821234567" 
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={form.phone} 
                  onChange={e => setForm({
                    ...form,
                    phone: e.target.value
                  })} 
                />
              </InputWrapper>
              <div className="md:col-span-2">
                <InputWrapper label="Address" icon={MapPin} required>
                  <AddressAutocomplete
                    value={form.address}
                    onChange={(address) => {
                      setForm({
                        ...form,
                        address: address.line1,
                        suburb: address.suburb || form.suburb,
                        city: address.city || form.city,
                      });
                    }}
                    onInputChange={(value) => {
                      setForm({
                        ...form,
                        address: value,
                      });
                    }}
                    placeholder="Search for address"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </InputWrapper>
              </div>
            </div>
          </section>

          {/* What You're Booking Section */}
          <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <SectionHeader title="What You're Booking" onEdit={handleEditService} />
            
            <div className="space-y-8">
              {/* Service */}
              <div>
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                  <div className="bg-blue-50 p-1.5 rounded-lg">
                    <CheckCircle2 size={16} />
                  </div>
                  <span className="text-sm font-semibold uppercase tracking-wider">Service</span>
                </div>
                <p className="text-lg font-bold text-gray-800">{state.service || 'Not selected'}</p>
              </div>

              {/* Property Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                   <div className="flex items-center gap-2 text-blue-600 mb-2">
                    <div className="bg-blue-50 p-1.5 rounded-lg">
                      <Home size={16} />
                    </div>
                    <span className="text-sm font-semibold uppercase tracking-wider">Property Details</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Bedrooms:</p>
                  <p className="text-gray-800 font-bold">{state.bedrooms || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Bathrooms:</p>
                  <p className="text-gray-800 font-bold">{state.bathrooms || 1}</p>
                </div>
              </div>

              {/* Additional Services */}
              {state.extras && state.extras.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-blue-600 mb-3">
                    <div className="bg-blue-50 p-1.5 rounded-lg">
                      <PlusCircle size={16} />
                    </div>
                    <span className="text-sm font-semibold uppercase tracking-wider">Additional Services</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {state.extras.map((extra, idx) => (
                      <div key={idx} className="inline-block px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-sm font-medium border border-blue-100">
                        {extra}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Service Options */}
              <div>
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                  <div className="bg-blue-50 p-1.5 rounded-lg">
                    <Clock size={16} />
                  </div>
                  <span className="text-sm font-semibold uppercase tracking-wider">Service Options</span>
                </div>
                <p className="text-gray-600 text-sm flex items-center gap-2">
                   Estimated duration: <span className="font-bold text-gray-800">{estimatedDuration}</span>
                </p>
              </div>

              {/* Schedule */}
              {state.date && state.time && (
                <div>
                  <div className="flex items-center gap-2 text-blue-600 mb-3">
                    <div className="bg-blue-50 p-1.5 rounded-lg">
                      <Calendar size={16} />
                    </div>
                    <span className="text-sm font-semibold uppercase tracking-wider">Schedule</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100 col-span-2 md:col-span-1">
                      <span className="text-sm text-gray-500">Date</span>
                      <span className="text-sm font-bold text-gray-800">{format(new Date(state.date), 'EEE, MMM d, yyyy')}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100 col-span-2 md:col-span-1">
                      <span className="text-sm text-gray-500">Time</span>
                      <span className="text-sm font-bold text-gray-800">{state.time}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Payment Section */}
          <section className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Total Amount</h3>
                  <p className="text-xs text-gray-400">All fees included</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-blue-600">R{displayAmount(total)}</p>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-gray-50">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Service & rooms</span>
                  <span className="font-bold text-gray-800">R{displayAmount((pricingDetails?.total || 0) - (pricingDetails?.serviceFee || 0))}</span>
                </div>
                {(pricingDetails?.serviceFee || 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Service fee</span>
                    <span className="font-bold text-gray-800">+R{displayAmount(pricingDetails?.serviceFee || 0)}</span>
                  </div>
                )}
                {tipAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tip</span>
                    <span className="font-bold text-gray-800">+R{displayAmount(tipAmount)}</span>
                  </div>
                )}
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount {appliedDiscount?.code && `(${appliedDiscount.code})`}</span>
                    <span className="font-bold">-R{displayAmount(discount)}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-800">Have a discount code?</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Enter discount code" 
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50" 
                    value={form.discountCode} 
                    onChange={e => setForm({
                      ...form,
                      discountCode: e.target.value
                    })} 
                  />
                  <button 
                    onClick={handleApplyDiscount}
                    disabled={isValidatingDiscount || !!appliedDiscount}
                    className="px-6 py-2 bg-gray-100 text-gray-600 font-bold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {isValidatingDiscount ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                  </button>
                </div>
                {discountError && (
                  <p className="text-xs text-red-600">{discountError}</p>
                )}
                {appliedDiscount && (
                  <p className="text-xs text-green-600">✓ Discount applied: {appliedDiscount.description || appliedDiscount.code}</p>
                )}
              </div>

              {isPaystackConfigured && (
                <div className="flex items-center justify-center gap-2 py-2">
                  <ShieldCheck size={16} className="text-gray-400" />
                  <span className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Secure payment powered by Paystack</span>
                </div>
              )}

              <button 
                onClick={handleSubmit}
                disabled={isProcessingPayment || !isPaystackConfigured || !form.firstName || !form.lastName || !form.email || !form.phone || !form.address}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0">
                {isProcessingPayment ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin inline-block mr-2" />
                    Processing payment...
                  </>
                ) : (
                  'Confirm & Pay'
                )}
              </button>
            </div>
          </section>

          <button 
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-500 font-bold hover:text-gray-700 transition-colors mb-12">
            <ArrowLeft size={18} />
            Back
          </button>
        </div>
        </div>
      </main>

      <Footer />
    </div>;
};
