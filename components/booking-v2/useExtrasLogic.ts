'use client';

import { useCallback, useEffect, useMemo } from 'react';
import type { ServiceType } from '@/types/booking';
import {
  fallbackAllExtrasList,
  fallbackStandardAndAirbnbExtras,
  fallbackDeepAndMoveExtras,
  fallbackQuantityExtras,
  DEFAULT_QUANTITY,
  MAX_QUANTITY,
} from './booking-constants';

interface UseExtrasLogicProps {
  service: ServiceType | null;
  extras: string[];
  extrasQuantities: Record<string, number>;
  updateField: (field: 'extras' | 'extrasQuantities', value: any) => void;
  allExtrasList?: string[];
  standardAndAirbnbExtras?: string[];
  deepAndMoveExtras?: string[];
  quantityExtras?: Set<string> | string[];
}

export function useExtrasLogic({
  service,
  extras,
  extrasQuantities,
  updateField,
  allExtrasList = fallbackAllExtrasList,
  standardAndAirbnbExtras = fallbackStandardAndAirbnbExtras,
  deepAndMoveExtras = fallbackDeepAndMoveExtras,
  quantityExtras,
}: UseExtrasLogicProps) {
  // Use provided quantityExtras or fallback to the constant
  const quantityExtrasSet = useMemo(() => {
    if (quantityExtras) {
      return quantityExtras instanceof Set ? quantityExtras : new Set(quantityExtras);
    }
    return fallbackQuantityExtras;
  }, [quantityExtras]);
  const allowedExtras = useMemo(() => {
    switch (service) {
      case 'Carpet':
        // For Carpet service, only show Mattress Cleaning and Couch Cleaning
        return ['Mattress Cleaning', 'Couch Cleaning'].filter(extra => 
          allExtrasList.includes(extra)
        );
      case 'Deep':
      case 'Move In/Out':
        return deepAndMoveExtras;
      case 'Standard':
      case 'Airbnb':
        return standardAndAirbnbExtras;
      default:
        return allExtrasList;
    }
  }, [service, allExtrasList, standardAndAirbnbExtras, deepAndMoveExtras]);

  // Migrate old extras and filter by allowed extras
  useEffect(() => {
    if (!service) return;
    
    // Migrate old "Laundry" and "Ironing" to "Laundry & Ironing"
    const hasLaundry = extras.includes('Laundry');
    const hasIroning = extras.includes('Ironing');
    const hasLaundryIroning = extras.includes('Laundry & Ironing');
    
    let updatedExtras = [...extras];
    let updatedQuantities = { ...extrasQuantities };
    let needsUpdate = false;
    
    // If user has either Laundry or Ironing (but not the combined), migrate to combined
    if ((hasLaundry || hasIroning) && !hasLaundryIroning) {
      // Remove old extras
      updatedExtras = updatedExtras.filter(extra => extra !== 'Laundry' && extra !== 'Ironing');
      // Add combined extra
      if (!updatedExtras.includes('Laundry & Ironing')) {
        updatedExtras.push('Laundry & Ironing');
      }
      // Combine quantities (if both existed, take the max, otherwise use the one that exists)
      const laundryQty = extrasQuantities?.['Laundry'] ?? 1;
      const ironingQty = extrasQuantities?.['Ironing'] ?? 1;
      updatedQuantities['Laundry & Ironing'] = Math.max(laundryQty, ironingQty);
      // Remove old quantity entries
      delete updatedQuantities['Laundry'];
      delete updatedQuantities['Ironing'];
      needsUpdate = true;
    } else if ((hasLaundry || hasIroning) && hasLaundryIroning) {
      // If user has both old and new, remove old ones
      updatedExtras = updatedExtras.filter(extra => extra !== 'Laundry' && extra !== 'Ironing');
      delete updatedQuantities['Laundry'];
      delete updatedQuantities['Ironing'];
      needsUpdate = true;
    }
    
    const allowedSet = new Set(allowedExtras);
    const filteredExtras = updatedExtras.filter((extra) => allowedSet.has(extra));
    if (filteredExtras.length !== updatedExtras.length || needsUpdate) {
      updateField('extras', filteredExtras);
    }

    const filteredQuantities = Object.entries(updatedQuantities).reduce<Record<string, number>>((acc, [extra, qty]) => {
      if (allowedSet.has(extra) && filteredExtras.includes(extra)) {
        acc[extra] = qty;
      }
      return acc;
    }, {});

    if (Object.keys(filteredQuantities).length !== Object.keys(updatedQuantities).length || needsUpdate) {
      updateField('extrasQuantities', filteredQuantities);
    }
  }, [allowedExtras, service, extras, extrasQuantities, updateField]);

  // Ensure quantity extras have valid quantities
  useEffect(() => {
    if (!service) return;
    
    const updates: Record<string, number> = {};
    let shouldUpdate = false;

    extras.forEach((extra) => {
      if (!quantityExtrasSet.has(extra)) {
        return;
      }
      const currentQty = extrasQuantities[extra];
      if (!currentQty || currentQty < DEFAULT_QUANTITY) {
        updates[extra] = DEFAULT_QUANTITY;
        shouldUpdate = true;
      }
    });

    if (shouldUpdate) {
      updateField('extrasQuantities', {
        ...extrasQuantities,
        ...updates,
      });
    }
  }, [service, extras, extrasQuantities, updateField, quantityExtrasSet]);

  const toggleExtra = useCallback((extra: string) => {
    const isCurrentlySelected = extras.includes(extra);

    if (isCurrentlySelected) {
      const newExtras = extras.filter((e) => e !== extra);
      const { [extra]: _removed, ...rest } = extrasQuantities;
      updateField('extras', newExtras);
      updateField('extrasQuantities', rest);
    } else {
      const newExtras = [...extras, extra];
      const initialQty = quantityExtrasSet.has(extra) ? DEFAULT_QUANTITY : 1;
      updateField('extras', newExtras);
      updateField('extrasQuantities', {
        ...extrasQuantities,
        [extra]: initialQty,
      });
    }
  }, [extras, extrasQuantities, updateField, quantityExtrasSet]);

  const adjustQuantity = useCallback((extra: string, delta: number) => {
    if (!quantityExtrasSet.has(extra)) return;
    if (!extras.includes(extra)) {
      toggleExtra(extra);
      return;
    }

    const currentQty = extrasQuantities[extra] ?? DEFAULT_QUANTITY;
    const nextQty = Math.min(MAX_QUANTITY, Math.max(DEFAULT_QUANTITY, currentQty + delta));
    if (nextQty === currentQty) return;

    updateField('extrasQuantities', {
      ...extrasQuantities,
      [extra]: nextQty,
    });
  }, [extras, extrasQuantities, toggleExtra, updateField, quantityExtrasSet]);

  return {
    allowedExtras,
    toggleExtra,
    adjustQuantity,
  };
}

