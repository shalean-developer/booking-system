'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, X, Loader2 } from 'lucide-react';
import { LoadingSpinner } from './loading-spinner';
import { toast } from 'sonner';
import { devLog } from '@/lib/dev-logger';

const modifyPlanSchema = z.object({
  frequency: z.enum(['weekly', 'bi-weekly', 'monthly'], {
    required_error: 'Please select a frequency',
  }),
  preferredTime: z.string().min(1, 'Preferred time is required'),
  addressLine1: z.string().min(5, 'Address must be at least 5 characters').max(200, 'Address is too long'),
  addressSuburb: z.string().min(2, 'Suburb must be at least 2 characters').max(100, 'Suburb is too long'),
  addressCity: z.string().min(2, 'City must be at least 2 characters').max(100, 'City is too long'),
  endDate: z.string().optional().refine((val) => {
    if (!val) return true;
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, 'Invalid date format'),
});

type ModifyPlanFormValues = z.infer<typeof modifyPlanSchema>;

interface RecurringSchedule {
  id: string;
  service_type: string;
  frequency: 'weekly' | 'bi-weekly' | 'monthly';
  preferred_time: string;
  address_line1: string;
  address_suburb: string;
  address_city: string;
  start_date: string;
  end_date?: string | null;
  is_active: boolean;
}

interface ModifyPlanFormProps {
  scheduleId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ModifyPlanForm({ scheduleId, onSuccess, onCancel }: ModifyPlanFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [schedule, setSchedule] = useState<RecurringSchedule | null>(null);
  const [isActive, setIsActive] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<ModifyPlanFormValues>({
    resolver: zodResolver(modifyPlanSchema),
    defaultValues: {
      frequency: 'weekly',
      preferredTime: '',
      addressLine1: '',
      addressSuburb: '',
      addressCity: '',
      endDate: '',
    },
  });

  const frequency = watch('frequency');

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast.error('Please log in to modify plans');
          return;
        }

        const response = await fetch(`/api/dashboard/recurring-schedules/${scheduleId}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        const data = await response.json();

        if (!response.ok || !data.ok || !data.schedule) {
          throw new Error(data.error || 'Failed to load schedule');
        }

        const sched = data.schedule;
        setSchedule(sched);
        setIsActive(sched.is_active);
        
        // Reset form with schedule data
        reset({
          frequency: sched.frequency,
          preferredTime: sched.preferred_time || '',
          addressLine1: sched.address_line1 || '',
          addressSuburb: sched.address_suburb || '',
          addressCity: sched.address_city || '',
          endDate: sched.end_date ? sched.end_date.split('T')[0] : '',
        });
      } catch (error: unknown) {
        devLog.error('Error fetching schedule:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load schedule';
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchedule();
  }, [scheduleId, reset]);

  const onSubmit = async (values: ModifyPlanFormValues) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in to modify plans');
        return;
      }

      const updateData: any = {
        frequency: values.frequency,
        preferred_time: values.preferredTime,
        address_line1: values.addressLine1,
        address_suburb: values.addressSuburb,
        address_city: values.addressCity,
        is_active: isActive,
        end_date: values.endDate || null,
      };

      const response = await fetch(`/api/dashboard/recurring-schedules/${scheduleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Failed to update schedule');
      }

      toast.success('Plan updated successfully');
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/dashboard/plans');
      }
    } catch (error: unknown) {
      devLog.error('Error updating schedule:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update plan';
      toast.error(errorMessage);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <LoadingSpinner size="lg" text="Loading plan details..." />
        </CardContent>
      </Card>
    );
  }

  if (!schedule) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-red-600">Schedule not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Modify Cleaning Plan</CardTitle>
        <p className="text-sm text-gray-600 mt-1">{schedule.service_type}</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Frequency */}
          <div className="space-y-2">
            <Label htmlFor="frequency">Frequency *</Label>
            <Select 
              value={frequency} 
              onValueChange={(value: 'weekly' | 'bi-weekly' | 'monthly') => setValue('frequency', value)}
            >
              <SelectTrigger id="frequency" aria-invalid={!!errors.frequency}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
            {errors.frequency && (
              <p className="text-xs text-red-600">{errors.frequency.message}</p>
            )}
          </div>

          {/* Preferred Time */}
          <div className="space-y-2">
            <Label htmlFor="preferredTime">Preferred Time *</Label>
            <Input
              id="preferredTime"
              type="time"
              {...register('preferredTime')}
              aria-invalid={!!errors.preferredTime}
            />
            {errors.preferredTime && (
              <p className="text-xs text-red-600">{errors.preferredTime.message}</p>
            )}
          </div>

          {/* Address */}
          <div className="space-y-4">
            <Label>Service Address</Label>
            <div className="space-y-2">
              <div className="space-y-2">
                <Input
                  placeholder="Street address"
                  {...register('addressLine1')}
                  aria-invalid={!!errors.addressLine1}
                />
                {errors.addressLine1 && (
                  <p className="text-xs text-red-600">{errors.addressLine1.message}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Input
                    placeholder="Suburb"
                    {...register('addressSuburb')}
                    aria-invalid={!!errors.addressSuburb}
                  />
                  {errors.addressSuburb && (
                    <p className="text-xs text-red-600">{errors.addressSuburb.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Input
                    placeholder="City"
                    {...register('addressCity')}
                    aria-invalid={!!errors.addressCity}
                  />
                  {errors.addressCity && (
                    <p className="text-xs text-red-600">{errors.addressCity.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <Label htmlFor="isActive" className="cursor-pointer">
              Plan is active
            </Label>
          </div>

          {/* End Date (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="endDate">End Date (Optional)</Label>
            <Input
              id="endDate"
              type="date"
              {...register('endDate')}
              min={new Date().toISOString().split('T')[0]}
              aria-invalid={!!errors.endDate}
            />
            {errors.endDate && (
              <p className="text-xs text-red-600">{errors.endDate.message}</p>
            )}
            <p className="text-xs text-gray-500">
              Leave empty for ongoing plan. Setting an end date will deactivate the plan on that date.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
                className="flex-1"
                aria-label="Cancel plan modification"
              >
                <X className="h-4 w-4 mr-2" aria-hidden="true" />
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-teal-500 to-blue-500"
              aria-label="Save plan changes"
              aria-busy={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                  <span aria-live="polite">Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" aria-hidden="true" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
