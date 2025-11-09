'use client';

import { useMemo, useState, useEffect, useRef, type ReactNode } from 'react';
import Link from 'next/link';
import { useBooking } from '@/lib/useBooking';
import { calcTotalSync, calcTotalAsync, PRICING, getServicePricing, getCurrentPricing } from '@/lib/pricing';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Clock, Home, Receipt, User, X, ChevronRight, Percent, Check, Info, LifeBuoy } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export function BookingSummary() {
  const { state } = useBooking();
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const chipButtonRef = useRef<HTMLButtonElement>(null);
  
  // Diagnostic logging
  useEffect(() => {
    console.log('📋 BookingSummary rendered with state:', {
      bedrooms: state.bedrooms,
      bathrooms: state.bathrooms,
      extras: state.extras,
      extrasCount: state.extras.length,
      extrasQuantities: state.extrasQuantities,
    });
  }, [state.bedrooms, state.bathrooms, state.extras, state.extrasQuantities]);
  const [pricingDetails, setPricingDetails] = useState<{
    subtotal: number;
    serviceFee: number;
    frequencyDiscount: number;
    frequencyDiscountPercent: number;
    total: number;
  } | null>(null);
  const [extraPrices, setExtraPrices] = useState<{ [key: string]: number }>({});
  const [serviceFeeAmount, setServiceFeeAmount] = useState<number>(PRICING.serviceFee);

  // Get service-specific pricing (sync for display)
  const servicePricing = useMemo(() => getServicePricing(state.service), [state.service]);
  
  // Create stable string key for extras array to detect changes
  const extrasKey = useMemo(
    () => state.extras.map((extra) => `${extra}:${state.extrasQuantities[extra] ?? 1}`).join('|'),
    [state.extras, state.extrasQuantities]
  );

  // Single optimized effect for immediate price updates
  useEffect(() => {
    console.log('📊 Booking Summary - State changed:', {
      service: state.service,
      bedrooms: state.bedrooms,
      bathrooms: state.bathrooms,
      extras: state.extras,
      extrasLength: state.extras.length,
      extrasQuantities: state.extrasQuantities,
    });
    
    // Immediate synchronous calculation for instant display
    if (state.service) {
      const syncDetails = calcTotalSync(
        {
        service: state.service,
        bedrooms: state.bedrooms,
        bathrooms: state.bathrooms,
        extras: state.extras,
          extrasQuantities: state.extrasQuantities,
        },
        state.frequency
      );
      console.log('💰 Calculated total (sync):', syncDetails);
      setPricingDetails(syncDetails);
      setServiceFeeAmount(syncDetails.serviceFee);
    } else {
      console.log('⚠️ No service selected, setting total to 0');
      setPricingDetails({
        subtotal: 0,
        serviceFee: 0,
        frequencyDiscount: 0,
        frequencyDiscountPercent: 0,
        total: 0,
      });
      setServiceFeeAmount(PRICING.serviceFee);
    }

    // Then fetch detailed pricing asynchronously (no loading state shown)
    const fetchPricing = async () => {
      try {
        const pricing = await getCurrentPricing();
        setExtraPrices(pricing.extras);
        if (pricing.serviceFee != null) {
          setServiceFeeAmount(pricing.serviceFee);
        }

        const details = await calcTotalAsync(
          {
            service: state.service,
            bedrooms: state.bedrooms,
            bathrooms: state.bathrooms,
            extras: state.extras,
            extrasQuantities: state.extrasQuantities,
          },
          state.frequency
        );
        setPricingDetails(details);
        setServiceFeeAmount(details.serviceFee);
      } catch (error) {
        // Already have sync fallback displayed
        console.error('Failed to fetch pricing:', error);
      }
    };

    fetchPricing();
  }, [state.service, state.bedrooms, state.bathrooms, extrasKey, state.frequency]);

  const total = pricingDetails?.total || 0;

  const extrasDisplay = useMemo(() => {
    if (!state.extras || state.extras.length === 0) return [];
    const uniqueExtras = Array.from(new Set(state.extras));
    return uniqueExtras.map((extra) => {
      const quantity = state.extrasQuantities[extra] ?? 1;
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

  // Focus management - return focus to chip when slide-over closes
  useEffect(() => {
    if (!isSlideOverOpen && chipButtonRef.current) {
      chipButtonRef.current.focus();
    }
  }, [isSlideOverOpen]);

  // Handle ESC key to close slide-over
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSlideOverOpen) {
        setIsSlideOverOpen(false);
      }
    };
    
    if (isSlideOverOpen) {
      document.addEventListener('keydown', handleEsc);
      // Prevent body scroll when slide-over is open
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isSlideOverOpen]);

  const InfoTooltip = ({ children }: { children: ReactNode }) => (
    <span className="relative ml-1 group inline-flex">
      <button
        type="button"
        className="flex h-5 w-5 items-center justify-center rounded-full text-slate-400 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        aria-label="More information"
      >
        <Info className="h-4 w-4" />
      </button>
      <div className="absolute right-0 mt-2 hidden w-72 max-w-xs rounded-lg border border-primary/20 bg-white p-3 text-xs text-slate-600 shadow-lg group-hover:block group-focus-within:block group-hover:pointer-events-auto group-focus-within:pointer-events-auto">
        {children}
      </div>
    </span>
  );

  const HeaderWithInfo = ({
    icon: Icon,
    title,
    infoContent,
  }: {
    icon: typeof Home;
    title: string;
    infoContent?: ReactNode;
  }) => (
    <div className="mb-2 flex items-start justify-between gap-2">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <Icon className="h-4 w-4" />
        <span className="flex items-center gap-1">
          {title}
          {infoContent}
        </span>
      </h3>
    </div>
  );

  const SummaryContent = () => {
    return (
    <div className="space-y-6">

      {/* Service */}
      {state.service && (
        <div>
          <HeaderWithInfo
            icon={Home}
            title="Service Type"
            infoContent={
              <InfoTooltip>
                <p className="font-semibold text-primary mb-1">Service selection</p>
                <p>Pricing adjusts automatically when you change the cleaning type on Step 1 of the booking flow.</p>
              </InfoTooltip>
            }
          />
          <Badge variant="secondary" className="text-sm">
            {state.service}
          </Badge>
        </div>
      )}

      {/* Price Breakdown */}
      {servicePricing && (
        <div>
          <HeaderWithInfo
            icon={Receipt}
            title="Price Breakdown"
            infoContent={
              <InfoTooltip>
                <p className="font-semibold text-primary mb-1">How we calculate this</p>
                <p>Base price plus bedrooms, bathrooms and extras update here in real-time as you tweak your selections.</p>
              </InfoTooltip>
            }
          />
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Base Price</span>
              <span className="font-medium text-slate-900">R{servicePricing.base.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Bedrooms ({state.bedrooms})</span>
              <span className="font-medium text-slate-900">
                R{(state.bedrooms * servicePricing.bedroom).toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Bathrooms ({state.bathrooms})</span>
              <span className="font-medium text-slate-900">
                R{(state.bathrooms * servicePricing.bathroom).toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1 text-slate-600">
                Service Fee
                <InfoTooltip>
                  <p className="font-semibold text-primary mb-1">Why a service fee?</p>
                  <p>
                    This covers secure payments, customer support, and cleaner vetting so every visit runs smoothly.
                  </p>
                </InfoTooltip>
              </span>
              <span className="font-medium text-slate-900">
                R{serviceFeeAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Extras */}
      {extrasDisplay.length > 0 && (
        <div>
          <HeaderWithInfo
            icon={Check}
            title="Additional Services"
            infoContent={
              <InfoTooltip>
                <p className="font-semibold text-primary mb-1">Extras</p>
                <p>Each add-on extends the visit and adds to the total. Remove items on the previous step to adjust.</p>
              </InfoTooltip>
            }
          />
          <div className="space-y-1">
            {extrasDisplay.map(({ name, quantity, total }) => (
              <div key={name} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">
                  {name}
                  {quantity > 1 ? ` ×${quantity}` : ''}
                </span>
                <span className="font-medium text-slate-900">
                  R{total.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Date & Time */}
      {(state.date || state.time) && (
        <div>
          <HeaderWithInfo
            icon={Calendar}
            title="Schedule"
            infoContent={
              state.date && state.time ? (
                <InfoTooltip>
                  <p className="font-semibold text-primary mb-1">Arrival window</p>
                  <p>
                    You’ve selected {format(new Date(state.date), 'EEE, dd MMM')} at {state.time}. Expect a confirmation with the exact arrival window (±30 minutes).
                  </p>
                  <Link
                    href="/contact?topic=schedule-help"
                    className="mt-2 inline-flex items-center gap-2 text-primary hover:text-primary/80 font-semibold"
                  >
                    <LifeBuoy className="h-4 w-4" />
                    Can’t find a time that suits? Contact us.
                  </Link>
                </InfoTooltip>
              ) : undefined
            }
          />
          <div className="space-y-1 text-sm text-slate-600">
            {state.date && (
              <p className="flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                {format(new Date(state.date), 'PPP')}
              </p>
            )}
            {state.time && (
              <p className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                {state.time}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Selected Cleaner/Team */}
      {(state.cleaner_id || state.selected_team) && state.step >= 5 && (
        <div>
          <HeaderWithInfo
            icon={User}
            title={state.requires_team ? 'Your Team' : 'Your Cleaner'}
            infoContent={
              <InfoTooltip>
                <p className="font-semibold text-primary mb-1">Assignment</p>
                <p>We’ll confirm the professional assigned once the booking is locked in. You can request changes via support.</p>
              </InfoTooltip>
            }
          />
          {state.requires_team ? (
            <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">{state.selected_team}</p>
                <p className="text-xs text-slate-600">Admin will assign team members</p>
              </div>
            </div>
          ) : state.cleaner_id === 'manual' ? (
            <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <User className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">Manual Assignment</p>
                <p className="text-xs text-slate-600">We'll assign the best cleaner for you</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                <User className="w-5 h-5 text-slate-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">Cleaner Selected</p>
                <p className="text-xs text-slate-600">Professional cleaner assigned</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Address */}
      {state.address.line1 && (
        <div>
          <HeaderWithInfo
            icon={MapPin}
            title="Location"
            infoContent={
              <InfoTooltip>
                <p className="font-semibold text-primary mb-1">Service address</p>
                <p>We’ll use this address for the cleaner’s directions. Update it on the contact step if anything changes.</p>
              </InfoTooltip>
            }
          />
          <div className="text-sm text-slate-600">
            <p>{state.address.line1}</p>
            {state.address.suburb && <p>{state.address.suburb}</p>}
            {state.address.city && <p>{state.address.city}</p>}
          </div>
        </div>
      )}

      {/* Frequency */}
      {state.frequency && state.frequency !== 'one-time' && (
        <div>
          <HeaderWithInfo
            icon={Calendar}
            title="Frequency"
            infoContent={
              <InfoTooltip>
                <p className="font-semibold text-primary mb-1">Recurring plan</p>
                <p>Save more by keeping the same cadence—swap frequencies or cancel anytime from your dashboard.</p>
              </InfoTooltip>
            }
          />
          <Badge variant="secondary" className="capitalize">
            {state.frequency === 'bi-weekly' ? 'Bi-Weekly' : state.frequency}
          </Badge>
        </div>
      )}

      {/* Total with Breakdown */}
      <div className="border-t pt-4 space-y-2">
        {pricingDetails && (
          <>
            {/* Subtotal */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Subtotal</span>
              <span className="font-medium text-slate-900">R{pricingDetails.subtotal}</span>
            </div>

            {/* Frequency Discount */}
            {pricingDetails.frequencyDiscount > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-green-600 flex items-center gap-1">
                  <Percent className="h-3 w-3" />
                  {state.frequency === 'bi-weekly' ? 'Bi-Weekly' : state.frequency.charAt(0).toUpperCase() + state.frequency.slice(1)} Discount ({pricingDetails.frequencyDiscountPercent}%)
                </span>
                <span className="font-medium text-green-600">-R{pricingDetails.frequencyDiscount}</span>
              </div>
            )}
          </>
        )}

        {/* Total */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-slate-600" />
            <span className="text-lg font-semibold text-slate-900 flex items-center gap-1">
              Total
              <InfoTooltip>
                <p className="font-semibold text-primary mb-1">Estimated total</p>
                <p>Includes service fee and any discounts. Final charge happens after your cleaner confirms the appointment.</p>
              </InfoTooltip>
            </span>
          </div>
          <motion.span 
            key={`${state.service}-${total}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.15 }}
            className="text-2xl font-bold text-primary"
            aria-live="polite"
            aria-atomic="true"
            aria-label={`Total price: R${total}`}
          >
            R{total}
          </motion.span>
        </div>
        <p className="text-xs text-slate-500">Estimated cost based on your selections</p>
      </div>
    </div>
  );
  };
  
  return (
    <>
      {/* Desktop: Sticky Card */}
      <Card className="sticky top-6 hidden border border-slate-100 shadow-lg lg:block">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Booking Summary
          </CardTitle>
          <CardDescription className="flex items-center gap-2 text-xs text-slate-500">
            <Info className="h-4 w-4 text-primary" />
            Pricing updates as you adjust rooms, extras or schedule. Taxes and service fees included.
          </CardDescription>
        </CardHeader>
        <CardContent key={`summary-${state.bedrooms}-${state.bathrooms}-${extrasKey}`}>
          <SummaryContent />
          <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-xs text-slate-600">
            <p className="font-semibold text-primary mb-1 flex items-center gap-2">
              <Percent className="h-3.5 w-3.5" />
              Recurring discounts
            </p>
            <p>
              Switch to a weekly, bi-weekly or monthly plan later in the flow to save up to 15% on each visit.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Mobile: Price Chip */}
      <motion.button
        ref={chipButtonRef}
        onClick={() => setIsSlideOverOpen(true)}
        className={cn(
          "fixed bottom-4 right-4 z-50 lg:hidden",
          "inline-flex items-center gap-3 px-4 py-3 min-h-[44px]",
          "rounded-full bg-white shadow-lg border border-gray-100",
          "focus:outline-none focus:ring-2 focus:ring-primary/30",
          "transition-all hover:shadow-xl hover:scale-105"
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        aria-expanded={isSlideOverOpen}
        aria-controls="booking-summary-panel"
        aria-label="View booking summary"
      >
        <Receipt className="h-5 w-5 text-primary" />
        <motion.span 
          key={`mobile-${state.service}-${total}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="text-lg font-bold text-slate-900"
          aria-live="polite"
          aria-atomic="true"
        >
          R{total}
        </motion.span>
        <ChevronRight className="h-4 w-4 text-slate-400" />
      </motion.button>

      {/* Mobile: Slide-Over Panel */}
      <AnimatePresence>
        {isSlideOverOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 z-50 lg:hidden"
              onClick={() => setIsSlideOverOpen(false)}
              aria-hidden="true"
            />

            {/* Slide-Over Content */}
            <motion.div
              id="booking-summary-panel"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className={cn(
                "fixed inset-y-0 right-0 w-full max-w-md z-50 lg:hidden",
                "bg-white shadow-xl overflow-y-auto"
              )}
              role="dialog"
              aria-modal="true"
              aria-labelledby="slide-over-title"
            >
              {/* Header */}
              <div className="sticky top-0 z-10 bg-white border-b px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 
                    id="slide-over-title"
                    className="text-xl font-bold text-slate-900 flex items-center gap-2"
                  >
                    <Receipt className="h-5 w-5 text-primary" />
                    Booking Summary
                  </h2>
                  <button
                    onClick={() => setIsSlideOverOpen(false)}
                    className={cn(
                      "rounded-full p-2 hover:bg-slate-100",
                      "focus:outline-none focus:ring-2 focus:ring-primary/30",
                      "transition-colors"
                    )}
                    aria-label="Close booking summary"
                  >
                    <X className="h-5 w-5 text-slate-600" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6" key={`mobile-summary-${state.bedrooms}-${state.bathrooms}-${extrasKey}`}>
                <SummaryContent />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

