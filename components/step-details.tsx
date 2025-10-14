'use client';

import { useBooking } from '@/lib/useBooking';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Minus, Plus } from 'lucide-react';
import { PRICING } from '@/lib/pricing';

const extrasList = Object.keys(PRICING.extras) as Array<keyof typeof PRICING.extras>;

export function StepDetails() {
  const { state, updateField, next, back } = useBooking();

  const handleBedroomChange = (delta: number) => {
    const newValue = Math.max(0, Math.min(10, state.bedrooms + delta));
    updateField('bedrooms', newValue);
  };

  const handleBathroomChange = (delta: number) => {
    const newValue = Math.max(0, Math.min(10, state.bathrooms + delta));
    updateField('bathrooms', newValue);
  };

  const toggleExtra = (extra: string) => {
    if (state.extras.includes(extra)) {
      updateField('extras', state.extras.filter((e) => e !== extra));
    } else {
      updateField('extras', [...state.extras, extra]);
    }
  };

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
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleBedroomChange(-1)}
                disabled={state.bedrooms === 0}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="min-w-[3rem] text-center text-2xl font-semibold">
                {state.bedrooms}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleBedroomChange(1)}
                disabled={state.bedrooms === 10}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-slate-500">+R{PRICING.perBedroom} per bedroom</p>
          </div>

          {/* Bathrooms */}
          <div className="space-y-2">
            <Label>Bathrooms</Label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleBathroomChange(-1)}
                disabled={state.bathrooms === 0}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="min-w-[3rem] text-center text-2xl font-semibold">
                {state.bathrooms}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleBathroomChange(1)}
                disabled={state.bathrooms === 10}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
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
          <Button variant="outline" onClick={back} size="lg">
            Back
          </Button>
          <Button onClick={next} size="lg">
            Next: Schedule
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

