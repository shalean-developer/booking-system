'use client';

import { useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import type { ServiceType } from '@/types/booking';
import { useBooking } from '@/lib/useBooking';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PRICING } from '@/lib/pricing';

const extrasList = Object.keys(PRICING.extras) as Array<keyof typeof PRICING.extras>;

// Helper function to convert ServiceType to URL slug
function serviceTypeToSlug(serviceType: ServiceType): string {
  // Handle "Move In/Out" special case first
  if (serviceType === 'Move In/Out') {
    return 'move-in-out';
  }
  
  return serviceType
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export function StepDetails() {
  const { state, updateField, next, back } = useBooking();
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const handleBack = useCallback(() => {
    back();
    // Navigate back to service select if we have a slug, otherwise use main booking page
    if (window.location.pathname.includes('/booking/service/') && slug) {
      router.push('/booking/service/select');
    }
  }, [back, router, slug]);

  const handleNext = useCallback(() => {
    next();
    // Navigate to schedule page if we have a slug, otherwise use main booking page
    if (window.location.pathname.includes('/booking/service/') && slug) {
      router.push(`/booking/service/${slug}/schedule`);
    }
  }, [next, router, slug]);

  const handleBedroomChange = useCallback((value: string) => {
    const newValue = parseInt(value);
    updateField('bedrooms', newValue);
  }, [updateField]);

  const handleBathroomChange = useCallback((value: string) => {
    const newValue = parseInt(value);
    updateField('bathrooms', newValue);
  }, [updateField]);

  const toggleExtra = useCallback((extra: string) => {
    if (state.extras.includes(extra)) {
      updateField('extras', state.extras.filter((e) => e !== extra));
    } else {
      updateField('extras', [...state.extras, extra]);
    }
  }, [state.extras, updateField]);

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle>Home Details</CardTitle>
        <CardDescription>Tell us about your space and any extras you need</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Bedrooms & Bathrooms */}
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Bedrooms */}
          <div className="space-y-2">
            <Label>Bedrooms</Label>
            <Select value={state.bedrooms.toString()} onValueChange={handleBedroomChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select bedrooms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0 Bedrooms</SelectItem>
                <SelectItem value="1">1 Bedroom</SelectItem>
                <SelectItem value="2">2 Bedrooms</SelectItem>
                <SelectItem value="3">3 Bedrooms</SelectItem>
                <SelectItem value="4">4 Bedrooms</SelectItem>
                <SelectItem value="5">5+ Bedrooms</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">+R{PRICING.perBedroom} per bedroom</p>
          </div>

          {/* Bathrooms */}
          <div className="space-y-2">
            <Label>Bathrooms</Label>
            <Select value={state.bathrooms.toString()} onValueChange={handleBathroomChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select bathrooms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Bathroom</SelectItem>
                <SelectItem value="2">2 Bathrooms</SelectItem>
                <SelectItem value="3">3 Bathrooms</SelectItem>
                <SelectItem value="4">4 Bathrooms</SelectItem>
                <SelectItem value="5">5+ Bathrooms</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">+R{PRICING.perBathroom} per bathroom</p>
          </div>
        </div>

        {/* Extras */}
        <div className="space-y-3">
          <Label>Additional Services</Label>
          <div className="grid gap-3 sm:grid-cols-2">
            {extrasList.map((extra) => (
              <div
                key={extra}
                className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-slate-50"
              >
                <Checkbox
                  id={extra}
                  checked={state.extras.includes(extra)}
                  onCheckedChange={() => toggleExtra(extra)}
                />
                <label
                  htmlFor={extra}
                  className="flex flex-1 cursor-pointer items-center justify-between text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  <span>{extra}</span>
                  <span className="text-xs text-slate-600">+R{PRICING.extras[extra]}</span>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Special Instructions */}
        <div className="space-y-2">
          <Label htmlFor="notes">Special Instructions (Optional)</Label>
          <Textarea
            id="notes"
            placeholder="Any specific requirements or areas of focus..."
            value={state.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            rows={4}
          />
        </div>

        {/* Navigation */}
        <div className="flex justify-between gap-3">
          <Button 
            variant="outline" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleBack();
            }} 
            size="lg" 
            className="transition-all duration-150"
            type="button"
          >
            Back
          </Button>
          <Button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleNext();
            }} 
            size="lg" 
            className="transition-all duration-150"
            type="button"
          >
            Next: Schedule
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

