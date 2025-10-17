'use client';

import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { ServiceType } from '@/types/booking';
import { useBooking } from '@/lib/useBooking';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

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
  const { state, setState } = useBooking();

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
    formState: { errors },
  } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues,
  });

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
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle>Contact & Address</CardTitle>
        <CardDescription>Where should we send confirmation and arrive for cleaning?</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700">Contact Information</h3>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  {...register('firstName')}
                  className={errors.firstName ? 'border-red-500' : ''}
                />
                {errors.firstName && (
                  <p className="text-xs text-red-500">{errors.firstName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  {...register('lastName')}
                  className={errors.lastName ? 'border-red-500' : ''}
                />
                {errors.lastName && (
                  <p className="text-xs text-red-500">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  {...register('email')}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="0123456789"
                  {...register('phone')}
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && (
                  <p className="text-xs text-red-500">{errors.phone.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700">Service Address</h3>

            <div className="space-y-2">
              <Label htmlFor="line1">Street Address *</Label>
              <Input
                id="line1"
                placeholder="123 Main Street"
                {...register('line1')}
                className={errors.line1 ? 'border-red-500' : ''}
              />
              {errors.line1 && (
                <p className="text-xs text-red-500">{errors.line1.message}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="suburb">Suburb *</Label>
                <Input
                  id="suburb"
                  placeholder="Sandton"
                  {...register('suburb')}
                  className={errors.suburb ? 'border-red-500' : ''}
                />
                {errors.suburb && (
                  <p className="text-xs text-red-500">{errors.suburb.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  placeholder="Johannesburg"
                  {...register('city')}
                  className={errors.city ? 'border-red-500' : ''}
                />
                {errors.city && (
                  <p className="text-xs text-red-500">{errors.city.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between gap-3 pb-20 lg:pb-0">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleBack} 
              size="lg" 
              className="transition-all duration-150"
            >
              Back
            </Button>
            <Button type="submit" size="lg" className="transition-all duration-150">
              <span className="sm:hidden">Next</span>
              <span className="hidden sm:inline">Next: Select Cleaner</span>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

