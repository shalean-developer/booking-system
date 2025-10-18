'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ServiceType, Customer, CustomerCheckResponse } from '@/types/booking';
import { useBooking } from '@/lib/useBooking';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { User, MapPin, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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

const contactSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  line1: z.string().min(5, 'Street address is required'),
  suburb: z.string().min(2, 'Suburb is required'),
  city: z.string().min(2, 'City is required'),
});

type ContactForm = z.infer<typeof contactSchema>;

export function StepContact() {
  const router = useRouter();
  const { state, setState, updateField } = useBooking();
  const [existingProfile, setExistingProfile] = useState<Customer | null>(null);
  const [isCheckingProfile, setIsCheckingProfile] = useState(false);
  const [showAutofillPrompt, setShowAutofillPrompt] = useState(false);

  const defaultValues = useMemo(() => ({
    firstName: state.firstName,
    lastName: state.lastName,
    email: state.email,
    phone: state.phone,
    line1: state.address.line1,
    suburb: state.address.suburb,
    city: state.address.city,
  }), [state.firstName, state.lastName, state.email, state.phone, state.address]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues,
  });

  const emailValue = watch('email');

  // Check for existing customer profile by email
  const checkCustomerProfile = useCallback(async (email: string) => {
    if (!email || email.length < 5) return;
    
    setIsCheckingProfile(true);
    try {
      const response = await fetch(`/api/customers?email=${encodeURIComponent(email)}`);
      const data: CustomerCheckResponse = await response.json();
      
      if (data.ok && data.exists && data.customer) {
        console.log('✅ Customer profile found:', data.customer);
        setExistingProfile(data.customer);
        setShowAutofillPrompt(true);
        // Store customer_id in booking state
        updateField('customer_id', data.customer.id);
      } else {
        setExistingProfile(null);
        setShowAutofillPrompt(false);
        updateField('customer_id', undefined);
      }
    } catch (error) {
      console.error('Error checking customer profile:', error);
      setExistingProfile(null);
      setShowAutofillPrompt(false);
    } finally {
      setIsCheckingProfile(false);
    }
  }, [updateField]);

  // Autofill form from existing profile
  const handleAutofill = useCallback(() => {
    if (!existingProfile) return;
    
    setValue('firstName', existingProfile.first_name);
    setValue('lastName', existingProfile.last_name);
    setValue('phone', existingProfile.phone || '');
    setValue('line1', existingProfile.address_line1 || '');
    setValue('suburb', existingProfile.address_suburb || '');
    setValue('city', existingProfile.address_city || '');
    
    setShowAutofillPrompt(false);
  }, [existingProfile, setValue]);

  // Dismiss autofill prompt
  const handleDismissAutofill = useCallback(() => {
    setShowAutofillPrompt(false);
  }, []);

  const handleBack = useCallback(() => {
    if (state.service) {
      const slug = serviceTypeToSlug(state.service);
      // Navigate immediately - step will be updated by the target page's useEffect
      router.push(`/booking/service/${slug}/schedule`);
    }
  }, [state.service, router]);

  const onSubmit = useCallback((data: ContactForm) => {
    setState({
      ...state,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      address: {
        line1: data.line1,
        suburb: data.suburb,
        city: data.city,
      },
    });
    
    if (state.service) {
      const slug = serviceTypeToSlug(state.service);
      // Navigate immediately - step will be updated by the target page's useEffect
      router.push(`/booking/service/${slug}/select-cleaner`);
    }
  }, [state, setState, router]);

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
          Contact & Address
        </h2>
        <p className="text-sm md:text-base text-gray-600">
          Where should we send confirmation and arrive for cleaning?
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Contact Information Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Contact Information</h3>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2">
            {/* First Name */}
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm font-semibold text-gray-900">
                First Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="firstName"
                placeholder="e.g., Thabo"
                {...register('firstName')}
                className={cn(
                  'h-11 rounded-xl border-2 transition-all',
                  'focus:ring-2 focus:ring-primary/30 focus:border-primary',
                  'hover:border-gray-300',
                  errors.firstName && 'border-red-500 ring-2 ring-red-500/20'
                )}
                aria-describedby={errors.firstName ? 'firstName-error' : undefined}
              />
              {errors.firstName && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  id="firstName-error"
                  className="text-xs text-red-500 flex items-center gap-1"
                >
                  <AlertCircle className="h-3 w-3" />
                  {errors.firstName.message}
                </motion.p>
              )}
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-sm font-semibold text-gray-900">
                Last Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lastName"
                placeholder="e.g., Mokoena"
                {...register('lastName')}
                className={cn(
                  'h-11 rounded-xl border-2 transition-all',
                  'focus:ring-2 focus:ring-primary/30 focus:border-primary',
                  'hover:border-gray-300',
                  errors.lastName && 'border-red-500 ring-2 ring-red-500/20'
                )}
                aria-describedby={errors.lastName ? 'lastName-error' : undefined}
              />
              {errors.lastName && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  id="lastName-error"
                  className="text-xs text-red-500 flex items-center gap-1"
                >
                  <AlertCircle className="h-3 w-3" />
                  {errors.lastName.message}
                </motion.p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-900">
                Email Address <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="e.g., thabo@example.com"
                  {...register('email')}
                  onBlur={(e) => checkCustomerProfile(e.target.value)}
                  className={cn(
                    'h-11 rounded-xl border-2 transition-all',
                    'focus:ring-2 focus:ring-primary/30 focus:border-primary',
                    'hover:border-gray-300',
                    errors.email && 'border-red-500 ring-2 ring-red-500/20'
                  )}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
                {isCheckingProfile && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  </div>
                )}
              </div>
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  id="email-error"
                  className="text-xs text-red-500 flex items-center gap-1"
                >
                  <AlertCircle className="h-3 w-3" />
                  {errors.email.message}
                </motion.p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-semibold text-gray-900">
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="e.g., 0821234567"
                {...register('phone')}
                className={cn(
                  'h-11 rounded-xl border-2 transition-all',
                  'focus:ring-2 focus:ring-primary/30 focus:border-primary',
                  'hover:border-gray-300',
                  errors.phone && 'border-red-500 ring-2 ring-red-500/20'
                )}
                aria-describedby={errors.phone ? 'phone-error' : undefined}
              />
              {errors.phone && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  id="phone-error"
                  className="text-xs text-red-500 flex items-center gap-1"
                >
                  <AlertCircle className="h-3 w-3" />
                  {errors.phone.message}
                </motion.p>
              )}
            </div>
          </div>
        </div>

        {/* Autofill Prompt */}
        <AnimatePresence>
          {showAutofillPrompt && existingProfile && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl border-2 border-green-200 bg-green-50 p-5"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-green-900 mb-1">
                    Welcome Back, {existingProfile.first_name}!
                  </h3>
                  <p className="text-sm text-green-700 mb-4">
                    We found your previous information. Would you like to use it?
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      type="button"
                      onClick={handleAutofill}
                      className={cn(
                        "rounded-full px-5 py-2 text-sm font-semibold",
                        "bg-green-600 hover:bg-green-700 text-white",
                        "focus:ring-2 focus:ring-green-600/30 focus:outline-none"
                      )}
                    >
                      Use Saved Information
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleDismissAutofill}
                      className={cn(
                        "rounded-full px-5 py-2 text-sm font-semibold",
                        "border-green-300 text-green-700 hover:bg-green-100",
                        "focus:ring-2 focus:ring-green-600/30 focus:outline-none"
                      )}
                    >
                      Enter New Details
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Service Address Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <MapPin className="h-4 w-4 text-primary" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Service Address</h3>
          </div>

          {/* Street Address */}
          <div className="space-y-2">
            <Label htmlFor="line1" className="text-sm font-semibold text-gray-900">
              Street Address <span className="text-red-500">*</span>
            </Label>
            <Input
              id="line1"
              placeholder="e.g., 123 Nelson Mandela Avenue"
              {...register('line1')}
              className={cn(
                'h-11 rounded-xl border-2 transition-all',
                'focus:ring-2 focus:ring-primary/30 focus:border-primary',
                'hover:border-gray-300',
                errors.line1 && 'border-red-500 ring-2 ring-red-500/20'
              )}
              aria-describedby={errors.line1 ? 'line1-error' : undefined}
            />
            {errors.line1 && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                id="line1-error"
                className="text-xs text-red-500 flex items-center gap-1"
              >
                <AlertCircle className="h-3 w-3" />
                {errors.line1.message}
              </motion.p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Suburb */}
            <div className="space-y-2">
              <Label htmlFor="suburb" className="text-sm font-semibold text-gray-900">
                Suburb <span className="text-red-500">*</span>
              </Label>
              <Input
                id="suburb"
                placeholder="e.g., Sandton"
                {...register('suburb')}
                className={cn(
                  'h-11 rounded-xl border-2 transition-all',
                  'focus:ring-2 focus:ring-primary/30 focus:border-primary',
                  'hover:border-gray-300',
                  errors.suburb && 'border-red-500 ring-2 ring-red-500/20'
                )}
                aria-describedby={errors.suburb ? 'suburb-error' : undefined}
              />
              {errors.suburb && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  id="suburb-error"
                  className="text-xs text-red-500 flex items-center gap-1"
                >
                  <AlertCircle className="h-3 w-3" />
                  {errors.suburb.message}
                </motion.p>
              )}
            </div>

            {/* City */}
            <div className="space-y-2">
              <Label htmlFor="city" className="text-sm font-semibold text-gray-900">
                City <span className="text-red-500">*</span>
              </Label>
              <Input
                id="city"
                placeholder="e.g., Johannesburg"
                {...register('city')}
                className={cn(
                  'h-11 rounded-xl border-2 transition-all',
                  'focus:ring-2 focus:ring-primary/30 focus:border-primary',
                  'hover:border-gray-300',
                  errors.city && 'border-red-500 ring-2 ring-red-500/20'
                )}
                aria-describedby={errors.city ? 'city-error' : undefined}
              />
              {errors.city && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  id="city-error"
                  className="text-xs text-red-500 flex items-center gap-1"
                >
                  <AlertCircle className="h-3 w-3" />
                  {errors.city.message}
                </motion.p>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between gap-3 mt-8 pt-6 border-t">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleBack} 
            size="lg" 
            className={cn(
              "rounded-full px-6 font-semibold",
              "focus:ring-2 focus:ring-primary/30 focus:outline-none",
              "transition-all duration-200"
            )}
          >
            <span className="sm:hidden">Back</span>
            <span className="hidden sm:inline">Back to Schedule</span>
          </Button>
          <Button 
            type="submit" 
            size="lg" 
            className={cn(
              "rounded-full px-8 py-3 font-semibold shadow-lg",
              "bg-primary hover:bg-primary/90 text-white",
              "focus:ring-2 focus:ring-primary/30 focus:outline-none",
              "transition-all duration-200"
            )}
          >
            <span className="sm:hidden">Continue</span>
            <span className="hidden sm:inline">Continue to Cleaner</span>
          </Button>
        </div>
      </form>
    </motion.div>
  );
}

