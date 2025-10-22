'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, User, MapPin, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const customerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  line1: z.string().min(5, 'Street address is required'),
  suburb: z.string().min(2, 'Suburb is required'),
  city: z.string().min(2, 'City is required'),
  role: z.enum(['customer', 'admin']),
  auth_user_id: z.string().optional(),
});

type CustomerForm = z.infer<typeof customerSchema>;

interface CreateCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateCustomerDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateCustomerDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CustomerForm>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      line1: '',
      suburb: '',
      city: '',
      role: 'customer',
      auth_user_id: '',
    },
  });

  const roleValue = watch('role');

  const onSubmit = async (data: CustomerForm) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const payload: any = {
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
        address_line1: data.line1,
        address_suburb: data.suburb,
        address_city: data.city,
        role: data.role,
      };

      // Only include auth_user_id if provided
      if (data.auth_user_id && data.auth_user_id.trim()) {
        payload.auth_user_id = data.auth_user_id.trim();
      }

      console.log('Creating customer with payload:', payload);

      const response = await fetch('/api/admin/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      console.log('Response status:', response.status);
      console.log('Response content-type:', response.headers.get('content-type'));

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Expected JSON but got:', text.substring(0, 200));
        throw new Error(`Server returned ${response.status}: Expected JSON but got HTML. Check browser console for details.`);
      }

      const result = await response.json();
      console.log('Response data:', result);

      if (!response.ok || !result.ok) {
        throw new Error(result.error || `Failed to create customer (${response.status})`);
      }

      // Success!
      console.log('Customer created successfully');
      reset();
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      console.error('Error creating customer:', err);
      setError(err.message || 'Failed to create customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      setError(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Customer</DialogTitle>
          <DialogDescription>
            Add a new customer to the system. All fields are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}

          {/* Contact Information Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Contact Information</h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* First Name */}
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-semibold">
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="firstName"
                  placeholder="e.g., Thabo"
                  {...register('firstName')}
                  className={cn(
                    errors.firstName && 'border-red-500 ring-2 ring-red-500/20'
                  )}
                />
                {errors.firstName && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              {/* Last Name */}
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-semibold">
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="lastName"
                  placeholder="e.g., Mokoena"
                  {...register('lastName')}
                  className={cn(
                    errors.lastName && 'border-red-500 ring-2 ring-red-500/20'
                  )}
                />
                {errors.lastName && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="e.g., thabo@example.com"
                  {...register('email')}
                  className={cn(
                    errors.email && 'border-red-500 ring-2 ring-red-500/20'
                  )}
                />
                {errors.email && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-semibold">
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="e.g., 0821234567"
                  {...register('phone')}
                  className={cn(
                    errors.phone && 'border-red-500 ring-2 ring-red-500/20'
                  )}
                />
                {errors.phone && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.phone.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Address Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Address</h3>
            </div>

            <div className="space-y-4">
              {/* Street Address */}
              <div className="space-y-2">
                <Label htmlFor="line1" className="text-sm font-semibold">
                  Street Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="line1"
                  placeholder="e.g., 123 Main Street"
                  {...register('line1')}
                  className={cn(
                    errors.line1 && 'border-red-500 ring-2 ring-red-500/20'
                  )}
                />
                {errors.line1 && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.line1.message}
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Suburb */}
                <div className="space-y-2">
                  <Label htmlFor="suburb" className="text-sm font-semibold">
                    Suburb <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="suburb"
                    placeholder="e.g., Sandton"
                    {...register('suburb')}
                    className={cn(
                      errors.suburb && 'border-red-500 ring-2 ring-red-500/20'
                    )}
                  />
                  {errors.suburb && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.suburb.message}
                    </p>
                  )}
                </div>

                {/* City */}
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm font-semibold">
                    City <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="city"
                    placeholder="e.g., Johannesburg"
                    {...register('city')}
                    className={cn(
                      errors.city && 'border-red-500 ring-2 ring-red-500/20'
                    )}
                  />
                  {errors.city && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.city.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Role & Auth Section */}
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Role Selector */}
              <div className="space-y-2">
                <Label htmlFor="role" className="text-sm font-semibold">
                  Role <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={roleValue}
                  onValueChange={(value) => setValue('role', value as 'customer' | 'admin')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                {errors.role && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.role.message}
                  </p>
                )}
              </div>

              {/* Auth User ID (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="auth_user_id" className="text-sm font-semibold">
                  Auth User ID <span className="text-gray-400">(Optional)</span>
                </Label>
                <Input
                  id="auth_user_id"
                  placeholder="UUID of auth user"
                  {...register('auth_user_id')}
                  className={cn(
                    errors.auth_user_id && 'border-red-500 ring-2 ring-red-500/20'
                  )}
                />
                {errors.auth_user_id && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.auth_user_id.message}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Link this customer to an existing auth account
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Customer'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

