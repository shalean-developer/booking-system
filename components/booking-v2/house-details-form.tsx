'use client';

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface HouseDetailsFormProps {
  bedrooms: number;
  bathrooms: number;
  onBedroomChange: (value: string) => void;
  onBathroomChange: (value: string) => void;
}

export function HouseDetailsForm({
  bedrooms,
  bathrooms,
  onBedroomChange,
  onBathroomChange,
}: HouseDetailsFormProps) {
  return (
    <section aria-labelledby="home-size">
      <h3 id="home-size" className="text-base font-semibold text-slate-900 mb-4">
        House details
      </h3>
      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="bedrooms" className="text-sm font-semibold text-gray-900">
            Bedrooms
          </Label>
          <Select value={bedrooms.toString()} onValueChange={onBedroomChange}>
            <SelectTrigger id="bedrooms" className="h-11">
              <SelectValue placeholder="" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Studio / 0 Bedrooms</SelectItem>
              <SelectItem value="1">1 Bedroom</SelectItem>
              <SelectItem value="2">2 Bedrooms</SelectItem>
              <SelectItem value="3">3 Bedrooms</SelectItem>
              <SelectItem value="4">4 Bedrooms</SelectItem>
              <SelectItem value="5">5+ Bedrooms</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bathrooms" className="text-sm font-semibold text-gray-900">
            Bathrooms
          </Label>
          <Select value={bathrooms.toString()} onValueChange={onBathroomChange}>
            <SelectTrigger id="bathrooms" className="h-11">
              <SelectValue placeholder="" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 Bathroom</SelectItem>
              <SelectItem value="2">2 Bathrooms</SelectItem>
              <SelectItem value="3">3 Bathrooms</SelectItem>
              <SelectItem value="4">4 Bathrooms</SelectItem>
              <SelectItem value="5">5+ Bathrooms</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </section>
  );
}

