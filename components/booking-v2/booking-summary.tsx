'use client';

import { useMemo, useEffect, useState } from 'react';
import { useBookingV2 } from '@/lib/useBookingV2';
import { useBookingFormData } from '@/lib/useBookingFormData';
import { calcTotalSync, calcTotalAsync, PRICING, getServicePricing, getCurrentPricing } from '@/lib/pricing';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { motion } from 'framer-motion';
import { Calendar, Receipt, User, Percent, Star, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import type { Cleaner } from '@/types/booking';
import Image from 'next/image';

function roundToHalfHour(hours: number) {
  return Math.round(hours * 2) / 2;
}

function formatHoursRange(hours: number) {
  const safe = Math.max(1, hours);
  const base = roundToHalfHour(safe);
  const min = Math.max(1, roundToHalfHour(base * 0.9));
  const max = Math.max(min, roundToHalfHour(base * 1.1));
  const fmt = (h: number) => (Number.isInteger(h) ? `${h}` : `${h}`);
  return `${fmt(min)}–${fmt(max)} hrs`;
}

export function BookingSummaryV2() {
  const { state } = useBookingV2();
  const { data: formData } = useBookingFormData();
  const [pricingDetails, setPricingDetails] = useState<{
    subtotal: number;
    serviceFee: number;
    frequencyDiscount: number;
    frequencyDiscountPercent: number;
    total: number;
  } | null>(null);
  const [extraPrices, setExtraPrices] = useState<{ [key: string]: number }>({});
  const [serviceFeeAmount, setServiceFeeAmount] = useState<number>(PRICING.serviceFee);
  const [surgePricingInfo, setSurgePricingInfo] = useState<{
    active: boolean;
    percentage: number | null;
    amount: number;
  } | null>(null);
  const [selectedCleaner, setSelectedCleaner] = useState<Cleaner | null>(null);
  const [isLoadingCleaner, setIsLoadingCleaner] = useState(false);


  // Get service-specific pricing (sync for display)
  const servicePricing = useMemo(() => getServicePricing(state.service), [state.service]);

  // Check surge pricing when date and service are available
  useEffect(() => {
    if (state.service && state.date && (state.service === 'Standard' || state.service === 'Airbnb')) {
      const checkSurgePricing = async () => {
        try {
          const response = await fetch(
            `/api/bookings/availability?service_type=${encodeURIComponent(state.service!)}&date=${state.date}`
          );
          const data = await response.json();
          
          if (data.ok && data.surge_pricing_active && data.surge_percentage && pricingDetails) {
            const surgeAmount = pricingDetails.total * (data.surge_percentage / 100);
            setSurgePricingInfo({
              active: true,
              percentage: data.surge_percentage,
              amount: surgeAmount,
            });
          } else {
            setSurgePricingInfo(null);
          }
        } catch (error) {
          console.error('Error checking surge pricing:', error);
          setSurgePricingInfo(null);
        }
      };

      checkSurgePricing();
    } else {
      setSurgePricingInfo(null);
    }
  }, [state.service, state.date, pricingDetails]);

  // Create stable string key for extras array to detect changes
  const extrasKey = useMemo(
    () => (state.extras || []).map((extra) => `${extra}:${state.extrasQuantities?.[extra] ?? 1}`).join('|'),
    [state.extras, state.extrasQuantities]
  );

  // Calculate pricing synchronously for immediate display
  useEffect(() => {
    if (state.service) {
      const equipmentCharge = formData?.equipment?.charge || PRICING.equipmentCharge || 500;
      const syncDetails = calcTotalSync(
        {
          service: state.service,
          bedrooms: state.bedrooms || 0,
          bathrooms: state.bathrooms || 0,
          extras: state.extras || [],
          extrasQuantities: state.extrasQuantities || {},
          carpetDetails: state.carpetDetails,
          provideEquipment: state.provideEquipment,
          equipmentCharge: equipmentCharge,
        },
        state.frequency || 'one-time'
      );
      setPricingDetails(syncDetails);
      setServiceFeeAmount(syncDetails.serviceFee);
    } else {
      setPricingDetails({
        subtotal: 0,
        serviceFee: 0,
        frequencyDiscount: 0,
        frequencyDiscountPercent: 0,
        total: 0,
      });
      setServiceFeeAmount(PRICING.serviceFee);
    }

    // Fetch detailed pricing asynchronously (updates in background)
    const fetchPricing = async () => {
      try {
        const pricing = await getCurrentPricing();
        setExtraPrices(pricing.extras);
        if (pricing.serviceFee != null) {
          setServiceFeeAmount(pricing.serviceFee);
        }

        if (state.service) {
          // Use async calculation for more accurate database pricing
          const equipmentCharge = formData?.equipment?.charge || PRICING.equipmentCharge || 500;
          const details = await calcTotalAsync(
            {
              service: state.service,
              bedrooms: state.bedrooms || 0,
              bathrooms: state.bathrooms || 0,
              extras: state.extras || [],
              extrasQuantities: state.extrasQuantities || {},
              carpetDetails: state.carpetDetails,
              provideEquipment: state.provideEquipment,
              equipmentCharge: equipmentCharge,
            },
            state.frequency || 'one-time'
          );
          setPricingDetails(details);
          setServiceFeeAmount(details.serviceFee);
        }
      } catch (error) {
        // Already have sync fallback displayed
        console.error('Failed to fetch pricing:', error);
      }
    };

    fetchPricing();
  }, [state.service, state.bedrooms, state.bathrooms, extrasKey, state.frequency, state.extrasQuantities, state.provideEquipment, formData?.equipment?.charge]);

  // Use stored cleaner data if available, otherwise fetch
  useEffect(() => {
    if (state.cleaner_id && !state.requires_team) {
      // First check if we have the cleaner data already stored
      if (state.selectedCleaner && state.selectedCleaner.id === state.cleaner_id) {
        setSelectedCleaner({
          id: state.selectedCleaner.id,
          name: state.selectedCleaner.name,
          photo_url: state.selectedCleaner.photo_url,
          rating: state.selectedCleaner.rating,
          areas: [],
          bio: null,
          years_experience: state.selectedCleaner.years_experience ?? null,
          specialties: null,
          phone: null,
          email: null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        setIsLoadingCleaner(false);
        return;
      }
      
      // If not stored, fetch it (fallback for edge cases)
      setIsLoadingCleaner(true);
      fetch(`/api/cleaners?id=${state.cleaner_id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.ok && data.cleaner) {
            setSelectedCleaner({
              id: data.cleaner.id,
              name: data.cleaner.name,
              photo_url: data.cleaner.photo_url,
              rating: data.cleaner.rating,
              areas: [],
              bio: null,
              years_experience: data.cleaner.years_experience ?? null,
              specialties: null,
              phone: null,
              email: null,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }
        })
        .catch(() => {})
        .finally(() => setIsLoadingCleaner(false));
    } else {
      setSelectedCleaner(null);
      setIsLoadingCleaner(false);
    }
  }, [state.cleaner_id, state.requires_team, state.selectedCleaner]);

  const total = pricingDetails?.total || 0;
  const discountAmount = state.discountAmount || 0;
  const finalTotal = Math.max(0, total + (state.tipAmount || 0) - discountAmount);

  const extrasDisplay = useMemo(() => {
    if (!state.extras || state.extras.length === 0) return [];
    const uniqueExtras = Array.from(new Set(state.extras));
    return uniqueExtras.map((extra) => {
      const quantity = state.extrasQuantities?.[extra] ?? 1;
      const unitPrice = extraPrices[extra] ?? PRICING.extras[extra as keyof typeof PRICING.extras] ?? 0;
      const normalizedQuantity = Math.max(quantity, 1);
      return {
        name: extra,
        quantity: normalizedQuantity,
        unitPrice,
        total: unitPrice * normalizedQuantity,
      };
    });
  }, [state.extras, state.extrasQuantities, extraPrices]);

  // Calculate total extras amount
  const extrasTotal = useMemo(() => {
    return extrasDisplay.reduce((sum, item) => sum + item.total, 0);
  }, [extrasDisplay]);

  const equipmentCharge = useMemo(() => {
    return formData?.equipment?.charge || PRICING.equipmentCharge || 500;
  }, [formData?.equipment?.charge]);

  const basePrice = useMemo(() => {
    return servicePricing?.base ?? 0;
  }, [servicePricing]);

  const roomsPrice = useMemo(() => {
    if (!servicePricing || !state.service) return 0;

    if (state.service === 'Carpet' && state.carpetDetails) {
      const fitted = state.carpetDetails.hasFittedCarpets ? (state.carpetDetails.numberOfRooms || 0) * 300 : 0;
      const loose = state.carpetDetails.hasLooseCarpets ? (state.carpetDetails.numberOfLooseCarpets || 0) * 200 : 0;
      const moveFee = state.carpetDetails.roomStatus === 'hasProperty' ? 250 : 0;
      return fitted + loose + moveFee;
    }

    return (state.bedrooms || 0) * servicePricing.bedroom + (state.bathrooms || 0) * servicePricing.bathroom;
  }, [servicePricing, state.service, state.bedrooms, state.bathrooms, state.carpetDetails]);

  const serviceTotal = useMemo(() => {
    return basePrice + roomsPrice;
  }, [basePrice, roomsPrice]);

  const estimatedDurationHours = useMemo(() => {
    if (!state.service) return null;

    // Service baselines (simple heuristic)
    let hours =
      state.service === 'Standard' ? 2.0 :
      state.service === 'Airbnb' ? 2.5 :
      state.service === 'Deep' ? 4.0 :
      state.service === 'Move In/Out' ? 4.5 :
      state.service === 'Carpet' ? 2.0 :
      2.5;

    if (state.service === 'Carpet' && state.carpetDetails) {
      // Add time by carpet items if present
      if (state.carpetDetails.hasFittedCarpets) {
        hours += (state.carpetDetails.numberOfRooms || 0) * 0.5;
      }
      if (state.carpetDetails.hasLooseCarpets) {
        hours += (state.carpetDetails.numberOfLooseCarpets || 0) * 0.25;
      }
      if (state.carpetDetails.roomStatus === 'hasProperty') {
        hours += 0.5;
      }
    } else {
      // Beds/Baths additions (non-carpet services)
      hours += (state.bedrooms || 0) * 0.5;
      hours += (state.bathrooms || 0) * 0.75;
    }

    // Extras add time (quantity-aware)
    const qty = state.extrasQuantities || {};
    const uniqueExtras = Array.from(new Set(state.extras || []));
    const extrasUnits = uniqueExtras.reduce((sum, extra) => {
      const q = Math.max(1, qty[extra] ?? 1);
      return sum + q;
    }, 0);
    hours += extrasUnits * 0.25;

    // Equipment option adds a small overhead
    if (state.provideEquipment && (state.service === 'Standard' || state.service === 'Airbnb')) {
      hours += 0.25;
    }

    // Clamp to a reasonable range
    return Math.min(12, Math.max(1.5, roundToHalfHour(hours)));
  }, [
    state.service,
    state.bedrooms,
    state.bathrooms,
    state.extras,
    state.extrasQuantities,
    state.carpetDetails,
    state.provideEquipment,
  ]);

  const showPromo = !!state.discountCode && (state.discountAmount || 0) > 0;
  const showEquipment = state.service === 'Standard' || state.service === 'Airbnb';
  const cleanersLabel = state.requires_team
    ? state.selected_team
      ? `Team booking (${state.selected_team})`
      : 'Team booking'
    : '1 cleaner';

  return (
    <Card className="border border-slate-200 shadow-lg bg-white">
      <CardContent className="pt-6 pr-3">
        {!state.service ? (
          <div className="text-center py-8">
            <p className="text-sm text-slate-600">Select a service to see booking summary</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Primary (minimal) */}
            <div className="space-y-4">
              {/* Service */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-2">Service</h3>
                <Badge variant="secondary" className="text-sm">
                  {state.service}
                </Badge>
              </div>

                {/* Cleaners */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">Cleaners</h3>
                  <p className="text-sm text-slate-600">{cleanersLabel}</p>
                </div>

                {/* Equipment */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">Equipment</h3>
                  <p className="text-sm text-slate-600">
                    {showEquipment
                      ? state.provideEquipment
                        ? `Provided by us — R${equipmentCharge.toFixed(2)}`
                        : 'Customer provides'
                      : 'Not applicable'}
                  </p>
                </div>

              {/* Date & Time */}
              {(state.date || state.time) && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">Schedule</h3>
                  <p className="text-sm text-slate-600 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {state.date && format(new Date(state.date), 'PPP')}
                    {state.date && state.time && ' @ '}
                    {state.time && state.time}
                  </p>
                </div>
              )}

              {/* Address */}
              {(state.address?.line1 || state.address?.suburb || state.address?.city) && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">Address</h3>
                  <p className="text-sm text-slate-600">
                    {[state.address.line1, state.address.suburb, state.address.city].filter(Boolean).join(', ')}
                  </p>
                </div>
              )}

                {/* Base + Rooms + Service total */}
                {servicePricing && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-2">Service pricing</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Base</span>
                        <span className="font-medium text-slate-900">R{basePrice.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">
                          Rooms
                          {state.service === 'Carpet'
                            ? ''
                            : ` (${state.bedrooms || 0} bed, ${state.bathrooms || 0} bath)`}
                        </span>
                        <span className="font-medium text-slate-900">R{roomsPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm border-t pt-2">
                        <span className="text-slate-700 font-semibold">Service total</span>
                        <span className="font-semibold text-slate-900">R{serviceTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}

              {/* Extras (Add-ons) */}
              {extrasDisplay.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">Add-ons</h3>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">
                      Extras ({extrasDisplay.reduce((sum, e) => sum + (e.quantity || 1), 0)})
                    </span>
                    <span className="font-medium text-slate-900">R{extrasTotal.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Promo / discount */}
              {showPromo && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">Promo</h3>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">
                      {state.discountCode}
                      {state.discountDescription ? ` — ${state.discountDescription}` : ''}
                    </span>
                    <span className="font-medium text-green-600">
                      -R{(state.discountAmount || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* Estimated duration */}
              {estimatedDurationHours != null && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">Estimated duration</h3>
                  <p className="text-sm text-slate-600">
                    Est. {formatHoursRange(estimatedDurationHours)}
                  </p>
                </div>
              )}
            </div>

            {/* Total (minimal) */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-slate-600" />
                  <span className="text-lg font-semibold text-slate-900">Total</span>
                </div>
                <motion.span
                  key={`${state.service}-${finalTotal}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.15 }}
                  className="text-2xl font-bold text-primary"
                  aria-live="polite"
                  aria-atomic="true"
                  aria-label={`Total price: R${finalTotal}`}
                >
                  R{finalTotal.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </motion.span>
              </div>
            </div>

            {/* View details (collapsed) */}
            <Accordion type="single" collapsible className="border-t pt-2">
              <AccordionItem value="details" className="border-b-0">
                <AccordionTrigger className="py-3 text-sm text-slate-700 hover:no-underline">
                  View details
                </AccordionTrigger>
                <AccordionContent className="pt-2">
                  <div className="space-y-6">
                    {/* Carpet Details - Show when Carpet service is selected */}
                    {state.service === 'Carpet' && state.carpetDetails && (
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900 mb-3">Carpet Details</h3>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">Carpet Type</span>
                            <span className="font-medium text-slate-900 text-right">
                              {state.carpetDetails.hasFittedCarpets && state.carpetDetails.hasLooseCarpets
                                ? 'Fitted & Loose'
                                : state.carpetDetails.hasFittedCarpets
                                ? 'Fitted Carpets'
                                : state.carpetDetails.hasLooseCarpets
                                ? 'Loose Carpets/Rugs'
                                : 'Not specified'}
                            </span>
                          </div>
                          {state.carpetDetails.hasFittedCarpets && state.carpetDetails.numberOfRooms > 0 && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-600">Rooms with Fitted Carpets</span>
                              <span className="font-medium text-slate-900">
                                {state.carpetDetails.numberOfRooms}{' '}
                                {state.carpetDetails.numberOfRooms === 1 ? 'Room' : 'Rooms'}
                              </span>
                            </div>
                          )}
                          {state.carpetDetails.hasLooseCarpets && state.carpetDetails.numberOfLooseCarpets > 0 && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-600">Loose Carpets/Rugs</span>
                              <span className="font-medium text-slate-900">
                                {state.carpetDetails.numberOfLooseCarpets}{' '}
                                {state.carpetDetails.numberOfLooseCarpets === 1 ? 'Item' : 'Items'}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">Room Status</span>
                            <span className="font-medium text-slate-900">
                              {state.carpetDetails.roomStatus === 'empty' ? 'Empty' : 'Has Property'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Price Breakdown */}
                    {servicePricing && (
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900 mb-3">Price Breakdown</h3>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">Base Price</span>
                            <span className="font-medium text-slate-900">R{servicePricing.base.toFixed(2)}</span>
                          </div>
                          {state.service !== 'Carpet' && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-600">
                                Bedrooms & Bathrooms ({state.bedrooms || 0} bed, {state.bathrooms || 0} bath)
                              </span>
                              <span className="font-medium text-slate-900">
                                R
                                {(
                                  (state.bedrooms || 0) * servicePricing.bedroom +
                                  (state.bathrooms || 0) * servicePricing.bathroom
                                ).toFixed(2)}
                              </span>
                            </div>
                          )}
                          {state.service === 'Carpet' && state.carpetDetails && (
                            <>
                              {state.carpetDetails.hasFittedCarpets && state.carpetDetails.numberOfRooms > 0 && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-slate-600">
                                    Fitted Carpets ({state.carpetDetails.numberOfRooms}{' '}
                                    {state.carpetDetails.numberOfRooms === 1 ? 'room' : 'rooms'} × R300)
                                  </span>
                                  <span className="font-medium text-slate-900">
                                    R{(state.carpetDetails.numberOfRooms * 300).toFixed(2)}
                                  </span>
                                </div>
                              )}
                              {state.carpetDetails.hasLooseCarpets && state.carpetDetails.numberOfLooseCarpets > 0 && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-slate-600">
                                    Loose Carpets/Rugs ({state.carpetDetails.numberOfLooseCarpets}{' '}
                                    {state.carpetDetails.numberOfLooseCarpets === 1 ? 'item' : 'items'} × R200)
                                  </span>
                                  <span className="font-medium text-slate-900">
                                    R{(state.carpetDetails.numberOfLooseCarpets * 200).toFixed(2)}
                                  </span>
                                </div>
                              )}
                              {state.carpetDetails.roomStatus === 'hasProperty' && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-slate-600">Property Move Fee (Extra Person)</span>
                                  <span className="font-medium text-slate-900">R250.00</span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Equipment & Supplies */}
                    {state.provideEquipment && (state.service === 'Standard' || state.service === 'Airbnb') && (
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900 mb-2">Equipment & Supplies</h3>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">Equipment & Supplies</span>
                            <span className="font-medium text-slate-900">
                              R{(formData?.equipment?.charge || PRICING.equipmentCharge || 500).toFixed(2)}
                            </span>
                          </div>
                          {formData?.equipment?.items && formData.equipment.items.length > 0 && (
                            <div className="mt-2 pl-2 border-l-2 border-blue-200">
                              <p className="text-xs text-slate-600 mb-1">Included items:</p>
                              <ul className="space-y-1">
                                {formData.equipment.items.map((item, index) => (
                                  <li key={index} className="text-xs text-slate-600 flex items-center gap-1">
                                    <span className="text-blue-600">•</span>
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Frequency */}
                    {state.frequency && state.frequency !== 'one-time' && (
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900 mb-2">Frequency</h3>
                        <Badge variant="secondary" className="capitalize">
                          {state.frequency === 'bi-weekly' ? 'Bi-Weekly' : state.frequency}
                        </Badge>
                      </div>
                    )}

                    {/* Selected Cleaner/Team */}
                    {(state.cleaner_id || state.selected_team) && (
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900 mb-3">Cleaner</h3>
                        {state.requires_team ? (
                          <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <User className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-900">{state.selected_team}</p>
                              <p className="text-xs text-slate-600">Admin will assign team members</p>
                            </div>
                          </div>
                        ) : isLoadingCleaner ? (
                          <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                              <Loader2 className="h-5 w-5 text-slate-400 animate-spin" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-900">Loading cleaner...</p>
                              <p className="text-xs text-slate-600">Please wait</p>
                            </div>
                          </div>
                        ) : selectedCleaner ? (
                          <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex-shrink-0">
                              {selectedCleaner.photo_url ? (
                                <Image
                                  src={selectedCleaner.photo_url}
                                  alt={selectedCleaner.name}
                                  width={40}
                                  height={40}
                                  className="w-10 h-10 rounded-full object-cover border border-green-300"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center border border-green-300">
                                  <User className="h-5 w-5 text-green-600" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-900 truncate">{selectedCleaner.name}</p>
                              <div className="flex items-center gap-1 mt-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-3 h-3 ${
                                      i < Math.floor(selectedCleaner.rating)
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                                <span className="text-xs text-slate-600 ml-1">{selectedCleaner.rating}</span>
                              </div>
                            </div>
                          </div>
                        ) : state.cleaner_id === 'manual' ? (
                          <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                              <User className="h-5 w-5 text-amber-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-900">Manual Assignment</p>
                              <p className="text-xs text-slate-600">We'll assign the best cleaner for you</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                              <User className="h-5 w-5 text-slate-400" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-900">Cleaner Selected</p>
                              <p className="text-xs text-slate-600">Professional cleaner assigned</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Breakdown */}
                    {pricingDetails && (
                      <div className="border-t pt-4 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Subtotal</span>
                          <span className="font-medium text-slate-900">
                            R
                            {pricingDetails.subtotal.toLocaleString('en-ZA', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Service Fee</span>
                          <span className="font-medium text-slate-900">R{serviceFeeAmount.toFixed(2)}</span>
                        </div>

                        {pricingDetails.frequencyDiscount > 0 && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-green-600 flex items-center gap-1">
                              <Percent className="h-3 w-3" />
                              {state.frequency === 'bi-weekly'
                                ? 'Bi-Weekly'
                                : state.frequency?.charAt(0).toUpperCase() + state.frequency?.slice(1)}{' '}
                              Discount ({pricingDetails.frequencyDiscountPercent}%)
                            </span>
                            <span className="font-medium text-green-600">
                              -R
                              {pricingDetails.frequencyDiscount.toLocaleString('en-ZA', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        )}

                        {showPromo && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">Promo</span>
                            <span className="font-medium text-green-600">-R{(state.discountAmount || 0).toFixed(2)}</span>
                          </div>
                        )}

                        {(state.tipAmount || 0) > 0 && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">Tip</span>
                            <span className="font-medium text-slate-900">R{(state.tipAmount || 0).toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

