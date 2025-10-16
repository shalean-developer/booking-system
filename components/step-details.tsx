'use client';

import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { ServiceType } from '@/types/booking';
import { useBooking } from '@/lib/useBooking';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PRICING, getServicePricing, calcTotal } from '@/lib/pricing';
import { Receipt } from 'lucide-react';

const extrasList = Object.keys(PRICING.extras) as Array<keyof typeof PRICING.extras>;

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

export function StepDetails() {
  const router = useRouter();
  const { state, updateField } = useBooking();

  // Get service-specific pricing
  const servicePricing = useMemo(() => getServicePricing(state.service), [state.service]);

  // Calculate total price
  const total = useMemo(() => calcTotal({
    service: state.service,
    bedrooms: state.bedrooms,
    bathrooms: state.bathrooms,
    extras: state.extras,
  }), [state.service, state.bedrooms, state.bathrooms, state.extras]);

  const handleBack = useCallback(() => {
    // Navigate immediately - step will be updated by the target page's useEffect
    router.push('/booking/service/select');
  }, [router]);

  const handleNext = useCallback(() => {
    if (state.service) {
      const slug = serviceTypeToSlug(state.service);
      // Navigate immediately - step will be updated by the target page's useEffect
      router.push(`/booking/service/${slug}/schedule`);
    }
  }, [state.service, router]);

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
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      {/* Left Column - Form */}
      <div className="space-y-6">
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
                {servicePricing && (
                  <p className="text-xs text-slate-600">
                    Price per bedroom: R{servicePricing.bedroom}
                  </p>
                )}
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
                {servicePricing && (
                  <p className="text-xs text-slate-600">
                    Price per bathroom: R{servicePricing.bathroom}
                  </p>
                )}
              </div>
            </div>

            {/* Extras */}
            <div className="space-y-3">
              <Label>Additional Services (Optional)</Label>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {extrasList.map((extra) => {
                  const isSelected = state.extras.includes(extra);
                  return (
                    <button
                      key={extra}
                      onClick={() => toggleExtra(extra)}
                      type="button"
                      className={`flex flex-col items-center gap-2 sm:gap-3 rounded-lg border-2 p-3 sm:p-4 text-center transition-all min-h-[100px] ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isSelected ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {isSelected ? '✓' : '+'}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{extra}</div>
                        <div className="text-xs text-gray-600 mt-1">R{PRICING.extras[extra]}</div>
                      </div>
                    </button>
                  );
                })}
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
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between gap-3 pb-20 lg:pb-0">
          <Button 
            variant="outline" 
            onClick={handleBack} 
            size="lg" 
            className="transition-all duration-150"
            type="button"
          >
            Back
          </Button>
          <Button 
            onClick={handleNext} 
            size="lg" 
            className="transition-all duration-150"
            type="button"
          >
            <span className="sm:hidden">Next</span>
            <span className="hidden sm:inline">Next: Schedule</span>
          </Button>
        </div>
      </div>

      {/* Right Column - Live Price Preview */}
      <div className="lg:sticky lg:top-6 lg:h-fit">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              Live Price Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Service Summary */}
              {state.service && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-slate-700">Service</h3>
                  <Badge variant="secondary" className="text-sm">
                    {state.service}
                  </Badge>
                </div>
              )}

              {/* Price Breakdown */}
              {servicePricing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Base Price</span>
                    <span className="font-medium">R{servicePricing.base}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Bedrooms ({state.bedrooms})</span>
                    <span className="font-medium">R{(state.bedrooms * servicePricing.bedroom).toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Bathrooms ({state.bathrooms})</span>
                    <span className="font-medium">R{(state.bathrooms * servicePricing.bathroom).toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Extras */}
              {state.extras.length > 0 && (
                <div className="border-t pt-3">
                  <h3 className="mb-2 text-sm font-semibold text-slate-700">
                    Additional Services
                  </h3>
                  <div className="space-y-2">
                    {state.extras.map((extra) => (
                      <div key={extra} className="flex justify-between text-sm">
                        <span className="text-slate-600">{extra}</span>
                        <span className="font-medium">R{PRICING.extras[extra as keyof typeof PRICING.extras]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex items-baseline justify-between">
                  <div className="text-sm font-semibold text-slate-700">Total Price</div>
                  <div className="text-3xl font-bold text-primary">R{total.toFixed(2)}</div>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  💡 This is an estimate. Final price may vary based on specific requirements.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

