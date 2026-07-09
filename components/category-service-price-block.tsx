'use client';

import { useMemo, useState } from 'react';
import { InstantPrice } from '@/components/InstantPrice';
import { HREF_TO_CORE_SERVICE } from '@/lib/category-service-href-map';
import type { InstantPricingInput } from '@/hooks/useInstantPricing';
import { getMarketingInstantPriceInputDefaults } from '@/lib/booking/marketing-instant-price-defaults';

type CategoryServicePriceBlockProps = {
  href: string;
  /** When href is not mapped or pricing is non-numeric marketing copy, show this. */
  fallbackPricing: string;
};

export function CategoryServicePriceBlock({ href, fallbackPricing }: CategoryServicePriceBlockProps) {
  const apiService = HREF_TO_CORE_SERVICE[href];
  const slot = useMemo(() => getMarketingInstantPriceInputDefaults(), []);
  const [bedrooms, setBedrooms] = useState(2);
  const [bathrooms, setBathrooms] = useState(1);

  const instantInput: InstantPricingInput | null = useMemo(() => {
    if (!apiService) return null;
    return {
      service: apiService,
      bedrooms,
      bathrooms,
      extraRooms: 0,
      extras: [],
      date: slot.date,
      time: slot.time,
      pricingMode: 'premium',
      address: { suburb: 'Cape Town', city: 'Cape Town' },
    };
  }, [apiService, bedrooms, bathrooms, slot.date, slot.time]);

  if (!apiService) {
    return (
      <div className="text-right">
        <div className="text-sm text-gray-500">Starting at</div>
        <div className="text-2xl font-bold text-primary">{fallbackPricing}</div>
      </div>
    );
  }

  return (
    <div className="text-right space-y-2 min-w-[8rem]">
      <InstantPrice input={instantInput} className="items-end text-right" />
      <div className="flex flex-wrap gap-2 justify-end text-xs text-gray-600">
        <label className="inline-flex items-center gap-1">
          <span className="text-gray-500">Beds</span>
          <select
            className="rounded border border-gray-200 bg-white px-1.5 py-0.5 text-gray-900"
            value={bedrooms}
            onChange={(e) => setBedrooms(Number(e.target.value))}
            aria-label="Bedrooms for estimate"
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label className="inline-flex items-center gap-1">
          <span className="text-gray-500">Baths</span>
          <select
            className="rounded border border-gray-200 bg-white px-1.5 py-0.5 text-gray-900"
            value={bathrooms}
            onChange={(e) => setBathrooms(Number(e.target.value))}
            aria-label="Bathrooms for estimate"
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
