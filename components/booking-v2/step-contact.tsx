'use client';

import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useBookingV2 } from '@/lib/useBookingV2';
import { useBookingPath } from '@/lib/useBookingPath';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { User, MapPin, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AddressAutocomplete } from '@/components/address-autocomplete';

const CITIES = [
  'Cape Town',
  'Johannesburg',
  'Durban',
  'Pretoria',
  'Port Elizabeth',
  'East London',
  'Bloemfontein',
  'Nelspruit',
  'Polokwane',
  'Kimberley',
  'George',
  'Stellenbosch',
  'Paarl',
  'Somerset West',
  'Other',
];

const contactSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .refine((phone) => {
      const cleaned = phone.replace(/[\s-]/g, '');
      return cleaned.length >= 10 && (cleaned.startsWith('0') || cleaned.startsWith('+27') || cleaned.startsWith('27'));
    }, 'Please enter a valid South African phone number (e.g., 0821234567 or +27821234567)'),
  line1: z.string().min(5, 'Street address is required'),
  line2: z.string().optional(),
  suburb: z.string().min(2, 'Suburb is required'),
  city: z.string().min(2, 'City is required'),
});

type ContactForm = z.infer<typeof contactSchema>;

export function StepContact() {
  const router = useRouter();
  const { state, setState } = useBookingV2();
  const { getSchedulePath, getReviewPath } = useBookingPath();

  const defaultValues = useMemo(() => ({
    firstName: state.firstName,
    lastName: state.lastName,
    email: state.email,
    phone: state.phone,
    line1: state.address.line1,
    line2: state.address.line2 || '',
    suburb: state.address.suburb,
    city: state.address.city || 'Cape Town',
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

  const handleBack = useCallback(() => {
    if (state.service) {
      router.push(getSchedulePath(state.service));
    }
  }, [state.service, router, getSchedulePath]);

  const onSubmit = useCallback((data: ContactForm) => {
    setState((prevState) => ({
      ...prevState,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      address: {
        ...prevState.address,
        line1: data.line1,
        line2: data.line2 || '',
        suburb: data.suburb,
        city: data.city,
      },
    }));
    
    if (state.service) {
      router.push(getReviewPath(state.service));
    }
  }, [state.service, setState, router, getReviewPath]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100 max-w-[576px] mx-auto"
    >
      <div className="mb-8 space-y-5">
        <div className="space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            Contact & address
          </h2>
          <p className="text-sm md:text-base text-gray-600 max-w-2xl">
            We'll send booking updates to these details.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Contact Information</h3>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2">
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
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-900">
                Email Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="e.g., thabo@example.com"
                {...register('email')}
                className={cn(
                  'h-11 rounded-xl border-2 transition-all',
                  'focus:ring-2 focus:ring-primary/30 focus:border-primary',
                  'hover:border-gray-300',
                  errors.email && 'border-red-500 ring-2 ring-red-500/20'
                )}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
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

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-semibold text-gray-900">
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="0821234567 or +27821234567"
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

        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <MapPin className="h-4 w-4 text-primary" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Service Address</h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
            <div className="space-y-2">
              <Label htmlFor="line1" className="text-sm font-semibold text-gray-900">
                Street Address <span className="text-red-500">*</span>
              </Label>
              <AddressAutocomplete
                id="line1"
                value={watch('line1') || ''}
                onChange={(address) => {
                  setValue('line1', address.line1, { shouldValidate: true });
                  if (address.suburb) {
                    setValue('suburb', address.suburb, { shouldValidate: true });
                  }
                  if (address.city) {
                    setValue('city', address.city, { shouldValidate: true });
                  }
                }}
                onInputChange={(value) => {
                  setValue('line1', value, { shouldValidate: false });
                }}
                placeholder="e.g., 123 Nelson Mandela Avenue"
                className={cn(
                  'h-11 rounded-xl border-2 transition-all',
                  'focus:ring-2 focus:ring-primary/30 focus:border-primary',
                  'hover:border-gray-300',
                  errors.line1 && 'border-red-500 ring-2 ring-red-500/20'
                )}
                error={!!errors.line1}
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

            <div className="space-y-2">
              <Label htmlFor="line2" className="text-sm font-semibold text-gray-900">
                Apt / Unit
              </Label>
              <Input
                id="line2"
                placeholder="e.g., Apt 4B, Unit 12, Floor 3"
                {...register('line2')}
                className={cn(
                  'h-11 rounded-xl border-2 transition-all',
                  'focus:ring-2 focus:ring-primary/30 focus:border-primary',
                  'hover:border-gray-300',
                  errors.line2 && 'border-red-500 ring-2 ring-red-500/20'
                )}
                aria-describedby={errors.line2 ? 'line2-error' : undefined}
              />
              {errors.line2 && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  id="line2-error"
                  className="text-xs text-red-500 flex items-center gap-1"
                >
                  <AlertCircle className="h-3 w-3" />
                  {errors.line2.message}
                </motion.p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
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

            <div className="space-y-2">
              <Label htmlFor="city" className="text-sm font-semibold text-gray-900">
                City <span className="text-red-500">*</span>
              </Label>
              <Select
                value={watch('city') || 'Cape Town'}
                onValueChange={(value) => {
                  setValue('city', value, { shouldValidate: true });
                }}
              >
                <SelectTrigger
                  id="city"
                  className={cn(
                    'h-11 rounded-xl border-2 transition-all',
                    'focus:ring-2 focus:ring-primary/30 focus:border-primary',
                    'hover:border-gray-300',
                    errors.city && 'border-red-500 ring-2 ring-red-500/20'
                  )}
                  aria-describedby={errors.city ? 'city-error' : undefined}
                >
                  <SelectValue placeholder="Select a city" />
                </SelectTrigger>
                <SelectContent>
                  {CITIES.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

        <div className="mt-8 space-y-3 border-t pt-6">
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button 
              type="button"
              variant="ghost"
              onClick={handleBack}
              size="lg"
              className={cn(
                "rounded-full px-4 font-semibold text-slate-600 hover:text-primary",
                "focus:ring-2 focus:ring-primary/30 focus:outline-none",
                "transition-all duration-200 w-full sm:w-auto justify-center sm:justify-start"
              )}
            >
              Back to schedule
            </Button>
            <Button 
              type="submit" 
              size="lg" 
              className={cn(
                "rounded-full px-8 py-3 font-semibold shadow-lg w-full sm:w-auto justify-center",
                "bg-primary hover:bg-primary/90 text-white",
                "focus:ring-2 focus:ring-primary/30 focus:outline-none",
                "transition-all duration-200"
              )}
            >
              <span className="sm:hidden">Continue</span>
              <span className="hidden sm:inline">Continue to cleaner</span>
            </Button>
          </div>
        </div>
      </form>
    </motion.div>
  );
}

