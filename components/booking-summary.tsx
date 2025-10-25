'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { useBooking } from '@/lib/useBooking';
import { calcTotal, calcTotalAsync, PRICING, getServicePricing, getCurrentPricing } from '@/lib/pricing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Clock, Home, Receipt, User, X, ChevronRight, Percent } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export function BookingSummary() {
  const { state } = useBooking();
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const chipButtonRef = useRef<HTMLButtonElement>(null);
  const [pricingDetails, setPricingDetails] = useState<{
    subtotal: number;
    serviceFee: number;
    frequencyDiscount: number;
    frequencyDiscountPercent: number;
    total: number;
  } | null>(null);
  const [extraPrices, setExtraPrices] = useState<{ [key: string]: number }>({});

  // Get service-specific pricing (sync for display)
  const servicePricing = useMemo(() => getServicePricing(state.service), [state.service]);

  // Fetch detailed pricing with fees and discounts
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        // Get current pricing for extras
        const pricing = await getCurrentPricing();
        setExtraPrices(pricing.extras);

        // Calculate total with service fee and frequency discount
        const details = await calcTotalAsync(
          {
            service: state.service,
            bedrooms: state.bedrooms,
            bathrooms: state.bathrooms,
            extras: state.extras,
          },
          state.frequency
        );
        setPricingDetails(details);
      } catch (error) {
        console.error('Failed to fetch pricing:', error);
        // Fallback to simple calculation
        const total = calcTotal({
          service: state.service,
          bedrooms: state.bedrooms,
          bathrooms: state.bathrooms,
          extras: state.extras,
        });
        setPricingDetails({
          subtotal: total,
          serviceFee: 0,
          frequencyDiscount: 0,
          frequencyDiscountPercent: 0,
          total,
        });
      }
    };

    fetchPricing();
  }, [state.service, state.bedrooms, state.bathrooms, state.extras, state.frequency]);

  const total = pricingDetails?.total || 0;

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

  const SummaryContent = () => (
    <div className="space-y-6">
      {/* Service */}
      {state.service && (
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Home className="h-4 w-4" />
            Service Type
          </h3>
          <Badge variant="secondary" className="text-sm">
            {state.service}
          </Badge>
        </div>
      )}

      {/* Price Breakdown */}
      {servicePricing && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-700">Price Breakdown</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Base Price</span>
              <span className="font-medium text-slate-900">R{servicePricing.base}</span>
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
          </div>
        </div>
      )}

      {/* Extras */}
      {state.extras.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-700">Additional Services</h3>
          <div className="space-y-1">
            {state.extras.map((extra) => (
              <div key={extra} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{extra}</span>
                <span className="font-medium text-slate-900">
                  R{extraPrices[extra] || PRICING.extras[extra as keyof typeof PRICING.extras] || 0}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Date & Time */}
      {(state.date || state.time) && (
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Calendar className="h-4 w-4" />
            Schedule
          </h3>
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
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <User className="h-4 w-4" />
            {state.requires_team ? 'Your Team' : 'Your Cleaner'}
          </h3>
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
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <MapPin className="h-4 w-4" />
            Location
          </h3>
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
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Calendar className="h-4 w-4" />
            Frequency
          </h3>
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

            {/* Service Fee */}
            {pricingDetails.serviceFee > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Service Fee</span>
                <span className="font-medium text-slate-900">R{pricingDetails.serviceFee}</span>
              </div>
            )}

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
            <span className="text-lg font-semibold text-slate-900">Total</span>
          </div>
          <motion.span 
            key={total}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-2xl font-bold text-primary"
            aria-live="polite"
            aria-atomic="true"
          >
            R{total}
          </motion.span>
        </div>
        <p className="text-xs text-slate-500">Estimated cost based on your selections</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: Sticky Card */}
      <Card className="sticky top-6 hidden border-0 shadow-lg lg:block">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Booking Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SummaryContent />
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
        whileTap={{ scale: 0.95 }}
        aria-expanded={isSlideOverOpen}
        aria-controls="booking-summary-panel"
        aria-label="View booking summary"
      >
        <Receipt className="h-5 w-5 text-primary" />
        <span className="text-lg font-bold text-slate-900">R{total}</span>
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
              <div className="p-6">
                <SummaryContent />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

