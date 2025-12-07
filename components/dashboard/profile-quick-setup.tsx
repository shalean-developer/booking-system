'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase-client';
import { toast } from 'sonner';
import { devLog } from '@/lib/dev-logger';
import { Loader2 } from 'lucide-react';

const profileSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(120, 'Name is too long'),
  phone: z
    .string()
    .min(7, 'Enter a valid phone number')
    .max(20, 'Phone number is too long')
    .transform((v) => v.replace(/\s+/g, '')),
  addressLine1: z.string().min(3, 'Street address is required'),
  addressSuburb: z.string().min(2, 'Suburb is required'),
  addressCity: z.string().min(2, 'City is required'),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileQuickSetupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: {
    id?: string;
    email?: string;
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    addressLine1?: string | null;
    addressSuburb?: string | null;
    addressCity?: string | null;
  } | null;
  onUpdated: (customer: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    addressLine1: string | null;
    addressSuburb: string | null;
    addressCity: string | null;
  }) => void;
}

export function ProfileQuickSetup({ open, onOpenChange, customer, onUpdated }: ProfileQuickSetupProps) {
  const defaultFullName = useMemo(() => {
    if (!customer) return '';
    if (customer.firstName || customer.lastName) {
      return [customer.firstName, customer.lastName].filter(Boolean).join(' ').trim();
    }
    return '';
  }, [customer]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: defaultFullName,
      phone: customer?.phone || '',
      addressLine1: customer?.addressLine1 || '',
      addressSuburb: customer?.addressSuburb || '',
      addressCity: customer?.addressCity || '',
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        fullName: defaultFullName,
        phone: customer?.phone || '',
        addressLine1: customer?.addressLine1 || '',
        addressSuburb: customer?.addressSuburb || '',
        addressCity: customer?.addressCity || '',
      });
    }
  }, [open, reset, defaultFullName, customer]);

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        toast.error('Please sign in again to update your profile.');
        return;
      }

      const response = await fetch('/api/dashboard/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });

      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || 'Could not update profile');
      }

      toast.success('Profile updated');
      onUpdated(payload.customer);
      onOpenChange(false);
    } catch (error: unknown) {
      devLog.error('Profile update failed', error);
      const errorMessage = error instanceof Error ? error.message : 'Unable to update profile right now.';
      toast.error(errorMessage);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[95vh] overflow-y-auto rounded-t-3xl p-6 sm:max-w-lg sm:rounded-xl sm:right-4 sm:left-auto sm:bottom-4">
        <SheetHeader className="text-left">
          <SheetTitle className="text-xl font-bold text-gray-900">Complete your profile</SheetTitle>
          <SheetDescription className="text-sm text-gray-600">
            A few quick details help us prepare your team and contact you when it’s go time.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" placeholder="e.g., Thabo Mokoena" {...register('fullName')} />
            {errors.fullName && <p className="text-xs text-red-600">{errors.fullName.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone number</Label>
            <Input id="phone" type="tel" placeholder="+27 71 234 5678" {...register('phone')} />
            <p className="text-xs text-gray-500">We’ll send updates and cleaner arrival alerts here.</p>
            {errors.phone && <p className="text-xs text-red-600">{errors.phone.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="addressLine1">Street address</Label>
            <Input id="addressLine1" placeholder="House number and street" {...register('addressLine1')} />
            {errors.addressLine1 && <p className="text-xs text-red-600">{errors.addressLine1.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="addressSuburb">Suburb</Label>
              <Input id="addressSuburb" placeholder="Suburb" {...register('addressSuburb')} />
              {errors.addressSuburb && <p className="text-xs text-red-600">{errors.addressSuburb.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="addressCity">City</Label>
              <Input id="addressCity" placeholder="City" {...register('addressCity')} />
              {errors.addressCity && <p className="text-xs text-red-600">{errors.addressCity.message}</p>}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full rounded-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save details'
            )}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}


