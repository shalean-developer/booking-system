'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Calendar, User, CheckCircle2, ArrowLeft, ArrowRight, Plus, Minus, Info, Star, Clock, ShieldCheck, CreditCard, MapPin, Mail, Phone, Tag, Gift, HelpCircle, X, Check, Building, Sparkles, BedDouble, Droplet, Users, Box, Loader2, AlertCircle, Repeat } from 'lucide-react';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { PRICING, calcTotalSync } from '@/lib/pricing';
import { formatDateShort } from '@/lib/utils/formatting';
import { calculateBookingOccurrencesForRollingWindow } from '@/lib/recurring-bookings';
import type { ServiceType } from '@/types/booking';
import type { Cleaner } from '@/types/booking';
import { useBookingFormData } from '@/lib/useBookingFormData';
import { WindowsIcon, FridgeIcon, OvenIcon, CabinetsIcon, EXTRA_ICONS } from '@/components/extra-service-icons';
import { 
  getStepName, 
  getStepNumber, 
  getNextStep, 
  getPreviousStep,
  getBookingUrl,
  getBookingUrlWithSession,
  isValidStep,
} from '@/lib/booking-utils';
import {
  generateSessionId,
  getSessionIdFromUrl,
  getOrCreateSessionId,
  saveSessionState,
  loadSessionState,
} from '@/lib/booking-session';
import {
  decodeBookingStateFromUrl,
} from '@/lib/booking-url-params';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

/**
 * TYPES & INTERFACES
 */

type ServiceTypeSlug = 'standard' | 'deep' | 'move-in-out' | 'airbnb' | 'carpet';
type FrequencyType = 'one-time' | 'weekly' | 'bi-weekly' | 'monthly';
type RecurringFrequencyType = 'custom-weekly' | 'custom-bi-weekly';

interface Extra {
  id: string;
  name: string;
  price: number;
  quantity: number;
  iconName?: string; // Store icon identifier for serialization
  icon?: React.ComponentType<{ className?: string }>; // Component reference (not serialized)
}

interface BookingState {
  step: number;
  serviceType: ServiceTypeSlug | null;
  bedrooms: number;
  bathrooms: number;
  offices: number;
  extras: Extra[];
  provideEquipment: boolean;
  numberOfCleaners: number;
  frequency: FrequencyType;
  /**
   * Optional recurring schedule metadata.
   * - Pricing still uses `frequency` (weekly/bi-weekly/monthly).
   * - When enabled, we create a recurring schedule with `recurringFrequency`
   *   and per-day time rules from `recurringTimesByDay`.
   */
  recurringFrequency: RecurringFrequencyType | null;
  recurringDays: number[]; // 0=Sunday ... 6=Saturday (matches JS Date.getDay + DB conventions)
  recurringTimesByDay: Record<number, string>; // { [day_of_week]: "HH:MM" }
  notes: string;
  date: string | null;
  timeSlot: string | null;
  contactInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    suburb: string;
    city: string;
  };
  selectedCleanerId: string | null;
  tipAmount: number;
  discountCode: string;
  isConfirmed: boolean;
}

/**
 * CONSTANTS & HELPERS
 */

// Map service slugs to ServiceType
const serviceSlugToType: Record<ServiceTypeSlug, ServiceType> = {
  'standard': 'Standard',
  'deep': 'Deep',
  'move-in-out': 'Move In/Out',
  'airbnb': 'Airbnb',
  'carpet': 'Carpet',
};

// Map ServiceType to slug
const serviceTypeToSlug: Record<ServiceType, ServiceTypeSlug> = {
  'Standard': 'standard',
  'Deep': 'deep',
  'Move In/Out': 'move-in-out',
  'Airbnb': 'airbnb',
  'Carpet': 'carpet',
};

// Service icon mapping
const SERVICE_ICON_MAP: Record<string, typeof Home> = {
  'Home': Home,
  'Star': Star,
  'Building': Building,
  'Calendar': Calendar,
  'Sparkles': Sparkles,
};

const TIME_SLOTS = ['07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30'];

// Helper function to get icon component from extra name
function getIconComponent(extraName: string): React.ComponentType<{ className?: string }> {
  let IconComponent = EXTRA_ICONS[extraName as keyof typeof EXTRA_ICONS];
  
  if (!IconComponent) {
    const nameLower = extraName.toLowerCase();
    if (nameLower.includes('fridge')) {
      IconComponent = FridgeIcon;
    } else if (nameLower.includes('oven')) {
      IconComponent = OvenIcon;
    } else if (nameLower.includes('cabinet')) {
      IconComponent = CabinetsIcon;
    } else if (nameLower.includes('window')) {
      IconComponent = WindowsIcon;
    } else {
      IconComponent = FridgeIcon; // Default fallback
    }
  }
  
  return IconComponent;
}

// Helper function to calculate next occurrence date for a day of the week
function getNextOccurrenceDate(dayOfWeek: number, startDate: string | null): string {
  const today = new Date();
  const referenceDate = startDate ? new Date(startDate) : today;
  
  // Get the day of the week for the reference date (0 = Sunday, 6 = Saturday)
  const refDayOfWeek = referenceDate.getDay();
  
  // Calculate days to add
  let daysToAdd = dayOfWeek - refDayOfWeek;
  
  // If the target day has already passed this week (or is today but we want next occurrence)
  // Move to next week
  if (daysToAdd <= 0) {
    daysToAdd += 7;
  }
  
  // Create the next occurrence date
  const nextDate = new Date(referenceDate);
  nextDate.setDate(referenceDate.getDate() + daysToAdd);
  
  // Format as ISO string (YYYY-MM-DD)
  return nextDate.toISOString().split('T')[0];
}

// Helper function to calculate previous occurrence (7 days earlier)
function getPreviousOccurrenceDate(currentDate: string): string {
  const date = new Date(currentDate);
  date.setDate(date.getDate() - 7);
  return date.toISOString().split('T')[0];
}

// Helper function to calculate next occurrence (7 days later)
function getNextWeekOccurrenceDate(currentDate: string): string {
  const date = new Date(currentDate);
  date.setDate(date.getDate() + 7);
  return date.toISOString().split('T')[0];
}

// Helper function to check if date is within 3 months from today
function isWithinThreeMonths(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const threeMonthsFromNow = new Date(today);
  threeMonthsFromNow.setMonth(today.getMonth() + 3);
  const checkDate = new Date(dateStr);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate <= threeMonthsFromNow && checkDate >= today;
}

/**
 * COMPONENTS
 */

const StepIndicator = ({
  currentStep,
  className,
  compact = false,
}: {
  currentStep: number;
  className?: string;
  compact?: boolean;
}) => {
  const steps = ['Details', 'Schedule', 'Contact', 'Cleaner', 'Review'];
  return (
    <div
      className={cn(
        'flex items-center justify-between w-full overflow-x-auto scrollbar-hide',
        compact ? 'px-0 py-0' : 'mb-8 pb-2 px-2',
        className
      )}
    >
      {steps.map((step, idx) => (
        <React.Fragment key={step}>
          <div className={cn('flex flex-col items-center', compact ? 'min-w-[52px]' : 'min-w-[60px]')}>
            <div
              className={cn(
                'rounded-full flex items-center justify-center font-bold transition-all duration-300',
                compact ? 'w-6 h-6 text-[10px]' : 'w-8 h-8 text-xs',
                currentStep > idx
                  ? "bg-green-500 text-white"
                  : currentStep === idx
                  ? "bg-blue-600 text-white ring-4 ring-blue-100"
                  : "bg-gray-200 text-gray-500"
              )}
            >
              {currentStep > idx ? (
                <CheckCircle2 className={cn(compact ? 'w-4 h-4' : 'w-5 h-5')} />
              ) : (
                idx + 1
              )}
            </div>
            <span
              className={cn(
                'uppercase tracking-wider font-semibold',
                compact ? 'mt-1 text-[9px]' : 'mt-2 text-[10px]',
                currentStep === idx ? 'text-blue-600' : 'text-gray-400'
              )}
            >
              {step}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div
              className={cn(
                'flex-1 min-w-[20px]',
                compact ? 'h-[1px] mx-1 -mt-4' : 'h-[2px] mx-2 mb-6',
                currentStep > idx ? 'bg-green-500' : 'bg-gray-200'
              )}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

const BookingSummary = ({
  state,
  pricing,
  payNowTotal,
  services,
  frequencies
}: {
  state: BookingState;
  pricing: any;
  payNowTotal: number;
  services: Array<{ id: ServiceTypeSlug; name: string; description: string; basePrice: number; icon: any }>;
  frequencies: Array<{ id: FrequencyType; name: string; discount: number }>;
}) => {
  const selectedService = state.serviceType ? services.find(s => s.id === state.serviceType) : null;
  const selectedFrequency = frequencies.find(f => f.id === state.frequency);

  // Helper function to format recurring days and times
  const formatRecurringSchedule = (recurringDays: number[], recurringTimesByDay: Record<number, string>, frequency: FrequencyType) => {
    if (recurringDays.length === 0) return '';
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    const sortedDays = [...recurringDays].sort((a, b) => a - b);
    const frequencyLabel = frequency === 'weekly' ? 'Weekly' : 'Bi-weekly';
    
    if (sortedDays.length === 0) return frequencyLabel;
    
    const scheduleItems = sortedDays
      .map(day => {
        const time = recurringTimesByDay[day];
        return time ? `${dayNames[day]} @ ${time}` : dayNames[day];
      })
      .join(', ');
    
    return `${frequencyLabel}: ${scheduleItems}`;
  };
  
  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl sticky top-6">
      <h3 className="text-xl font-black mb-6">Booking Summary</h3>
      
      <div className="space-y-4 pb-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-gray-900 capitalize">{selectedService?.name}</div>
              <div className="text-xs text-gray-500">
                {state.serviceType === 'carpet' ? (
                  <>
                    {state.bedrooms} Fitted, {state.bathrooms} Loose, {state.offices === 1 ? 'Has Property' : 'Empty'}
                  </>
                ) : (
                  <>
                    {state.bedrooms} Bed, {state.bathrooms} Bath, {state.offices} Office{state.offices === 1 ? '' : 's'}
                  </>
                )}
              </div>
            </div>
          </div>
          <span className="font-bold">R{pricing.base}</span>
        </div>

        {(pricing.extraCleanersCharge || 0) > 0 && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">
              Extra cleaners ({Math.max(0, (state.numberOfCleaners ?? 1) - 1)} extra)
            </span>
            <span className="font-bold">R{pricing.extraCleanersCharge}</span>
          </div>
        )}

        {state.recurringFrequency && state.recurringDays.length > 0 ? (
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                <Repeat className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-900">
                  {state.frequency === 'weekly' ? 'Weekly' : 'Bi-weekly'} Schedule
                </div>
                <div className="text-xs text-gray-500 break-words">
                  {formatRecurringSchedule(state.recurringDays, state.recurringTimesByDay, state.frequency)}
                </div>
              </div>
            </div>
          </div>
        ) : state.date && (
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-gray-900">{state.date}</div>
                <div className="text-xs text-gray-500">
                  {state.timeSlot ? `Arrival at ${state.timeSlot}` : 'Pick a time'}
                </div>
              </div>
            </div>
          </div>
        )}

        {state.extras && Array.isArray(state.extras) && state.extras.filter(e => e && e.quantity > 0).map(extra => (
          <div key={extra.id || extra.name} className="flex justify-between items-center text-sm">
            <span className="text-gray-600">{extra.quantity} {extra.name}</span>
            <span className="font-bold">R{extra.price * extra.quantity}</span>
          </div>
        ))}

        {state.provideEquipment && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Cleaning Materials Provided</span>
            <span className="font-bold">R{pricing.equipmentFee}</span>
          </div>
        )}

        {selectedFrequency && selectedFrequency.discount > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg border border-green-100">
            <Tag className="w-4 h-4 text-green-600" />
            <span className="text-xs font-bold text-green-700">
              {selectedFrequency.name} - Save {selectedFrequency.discount}%
            </span>
          </div>
        )}
      </div>

      <div className="py-6 space-y-4 border-b border-gray-200">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-bold">R{pricing.subtotal}</span>
        </div>
        {pricing.discount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span className="font-bold">Discount ({state.frequency})</span>
            <span className="font-bold">-R{pricing.discount}</span>
          </div>
        )}
        {state.frequency === 'one-time' && state.tipAmount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tip</span>
            <span className="font-bold">R{state.tipAmount}</span>
          </div>
        )}
      </div>

      <div className="pt-6 flex justify-between items-center">
        <span className="text-lg font-black uppercase text-gray-400">Total</span>
        <span className="text-3xl font-black text-blue-600">R{payNowTotal}</span>
      </div>

      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400 font-bold">
        <ShieldCheck className="w-4 h-4" />
        <span>Price updates in real-time</span>
      </div>
    </div>
  );
};

// @component: BookingFlow
interface BookingFlowProps {
  /**
   * Optional URL-derived values for SEO-friendly routes:
   * `/booking/:slug`
   */
  initialServiceSlug?: string;
}

function BookingFlow(props: BookingFlowProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: formData, loading: formDataLoading, error: formDataError } = useBookingFormData();
  
  // Make URL override computation reactive to prop changes
  const hasValidUrlOverride = useMemo(() => {
    const urlServiceSlug = typeof props.initialServiceSlug === 'string' ? props.initialServiceSlug : null;
    const hasValidUrlService =
      !!urlServiceSlug && Object.prototype.hasOwnProperty.call(serviceSlugToType, urlServiceSlug);
    return hasValidUrlService;
  }, [props.initialServiceSlug]);

  // Initialize state WITHOUT reading sessionStorage to avoid hydration mismatches.
  // If we're on the SEO URL route, URL params can define the initial service + step.
  const [state, setState] = useState<BookingState>(() => {
    const defaultState: BookingState = {
        step: 0,
        serviceType: null,
        bedrooms: 1,
        bathrooms: 1,
        offices: 0,
        extras: [],
        provideEquipment: false,
        numberOfCleaners: 1,
        frequency: 'one-time',
        recurringFrequency: null,
        recurringDays: [],
        recurringTimesByDay: {},
        notes: '',
        date: null,
        timeSlot: null,
        contactInfo: {
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          address: '',
          suburb: '',
          city: ''
        },
        selectedCleanerId: null,
        tipAmount: 0,
        discountCode: '',
        isConfirmed: false
      };

    // URL params override defaults (direct-entry SEO URLs must be authoritative)
    const urlServiceSlug = typeof props.initialServiceSlug === 'string' ? props.initialServiceSlug : null;
    const urlStep = typeof props.initialStep === 'string' ? props.initialStep : null;
    const hasValidUrlService =
      !!urlServiceSlug && Object.prototype.hasOwnProperty.call(serviceSlugToType, urlServiceSlug);
    const hasValidUrlStep = !!urlStep && isValidStep(urlStep);
    
    if (hasValidUrlService && hasValidUrlStep) {
      defaultState.serviceType = urlServiceSlug as ServiceTypeSlug;
      defaultState.step = getStepNumber(urlStep as any);
    }

    return defaultState;
  });

  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [cleanersLoading, setCleanersLoading] = useState(false);
  const [cleanersError, setCleanersError] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [paystackLoaded, setPaystackLoaded] = useState(false);
  const [forceRefreshCleaners, setForceRefreshCleaners] = useState(0);
  
  // Track previous step to detect step changes and restore state accordingly
  const previousStepRef = useRef<number | null>(null);
  
  // Track if state has been restored from sessionStorage to prevent extras reset
  const stateRestoredRef = useRef(false);
  
  // Session ID state - get from URL or generate new one
  const searchParams = useSearchParams();
  const [sessionId, setSessionId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return getOrCreateSessionId();
  });

  // Restore state from sessionStorage AFTER hydration to avoid mismatch.
  // Uses session-based storage with fallback to legacy storage.
  // Always restores state when step changes to ensure data persists across navigation.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Get session ID from URL or use existing one
    const urlSessionId = getSessionIdFromUrl();
    const sessionChanged = urlSessionId && urlSessionId !== sessionId;
    
    // Determine which session ID to use
    const activeSessionId = urlSessionId || sessionId || getOrCreateSessionId();
    
    // Load state from sessionStorage
    const savedState = loadSessionState(activeSessionId);
    
    // Get current state values safely (read from state but don't include in deps to avoid loops)
    const currentStep = state?.step;
    const currentServiceType = state?.serviceType;
    
    // Check if step has changed in saved state
    const savedStepChanged = savedState && savedState.step !== undefined && savedState.step !== previousStepRef.current;
    
    // Only restore if:
    // 1. Session ID changed (different session) - force restore
    // 2. State hasn't been restored yet AND we have saved state (initial load)
    // 3. Step changed in saved state (navigation to different step)
    // Don't restore if state was already restored unless session changed
    const shouldRestore = sessionChanged ||
                         (!stateRestoredRef.current && savedState && previousStepRef.current === null) ||
                         (!stateRestoredRef.current && savedState && !currentServiceType) ||
                         (savedStepChanged && !stateRestoredRef.current);
    
    if (!shouldRestore) {
      // Update previous step ref even if not restoring
      if (currentStep !== undefined) {
        previousStepRef.current = currentStep;
      }
      // Update session ID if changed but don't restore
      if (sessionChanged) {
        setSessionId(urlSessionId);
      }
      return;
    }
    
    if (!savedState) {
      // No saved state - just update step tracking and session ID
      if (currentStep !== undefined) {
        previousStepRef.current = currentStep;
      }
      if (sessionChanged) {
        setSessionId(urlSessionId);
      }
      // Mark as attempted even if no saved state
      stateRestoredRef.current = true;
      return;
    }

    try {
      // Log what we're restoring for debugging
      console.log('[Booking] Restoring state from sessionStorage:', {
        step: savedState.step,
        serviceType: savedState.serviceType,
        bedrooms: savedState.bedrooms,
        bathrooms: savedState.bathrooms,
        offices: savedState.offices,
        extrasCount: savedState.extras?.length || 0,
        extrasSelected: savedState.extras?.filter((e: any) => e.quantity > 0).length || 0,
        frequency: savedState.frequency,
        provideEquipment: savedState.provideEquipment,
        numberOfCleaners: savedState.numberOfCleaners,
      });
      
      // Clean up extras - remove any icon objects that can't be serialized
      if (savedState.extras && Array.isArray(savedState.extras)) {
        savedState.extras = savedState.extras.map((extra: any) => {
          const cleaned = { ...extra };
          if (cleaned.icon && typeof cleaned.icon !== 'function') {
            delete cleaned.icon;
          }
          if (!cleaned.iconName && cleaned.name) {
            cleaned.iconName = cleaned.name;
          }
          return cleaned;
        });
      }

      // Decode URL params (minimal state backup)
      const urlParams = new URLSearchParams(searchParams.toString());
      const urlState = decodeBookingStateFromUrl(urlParams);

      // Compute URL values inside effect to ensure they're fresh
      const urlServiceSlug = typeof props.initialServiceSlug === 'string' ? props.initialServiceSlug : null;
      const hasValidUrlService =
        !!urlServiceSlug && Object.prototype.hasOwnProperty.call(serviceSlugToType, urlServiceSlug);

      // Merge saved state with current state so newly-added fields keep defaults.
      // URL params act as initial values, sessionStorage is source of truth.
      // Then, if URL params are present, force only `serviceType` to match the URL.
      setState((prev) => {
        // savedState is the absolute source of truth - use it directly
        // Only merge with URL params for fields that aren't in savedState
        // Start with savedState as base, not prev (prev has defaults that shouldn't override)
        const merged = { 
          ...savedState, // SessionStorage as absolute source of truth
          ...urlState,   // URL params as backup only if not in savedState
        };

        // Explicitly preserve ALL fields from savedState using !== undefined checks
        // This ensures nothing is lost during merge (including empty arrays/falsy values)
        if (savedState.extras !== undefined) {
          merged.extras = savedState.extras;
          console.log('[Booking] Restored extras from sessionStorage:', {
            count: savedState.extras?.length || 0,
            withQuantities: savedState.extras?.filter((e: any) => e.quantity > 0).length || 0,
            extras: savedState.extras?.map((e: any) => ({ name: e.name, quantity: e.quantity }))
          });
        }
        if (savedState.frequency !== undefined) merged.frequency = savedState.frequency;
        if (savedState.provideEquipment !== undefined) merged.provideEquipment = savedState.provideEquipment;
        if (savedState.numberOfCleaners !== undefined) merged.numberOfCleaners = savedState.numberOfCleaners;
        if (savedState.bedrooms !== undefined) merged.bedrooms = savedState.bedrooms;
        if (savedState.bathrooms !== undefined) merged.bathrooms = savedState.bathrooms;
        if (savedState.offices !== undefined) merged.offices = savedState.offices;
        if (savedState.notes !== undefined) merged.notes = savedState.notes;
        if (savedState.recurringFrequency !== undefined) merged.recurringFrequency = savedState.recurringFrequency;
        if (savedState.recurringDays !== undefined) merged.recurringDays = savedState.recurringDays;
        if (savedState.recurringTimesByDay !== undefined) merged.recurringTimesByDay = savedState.recurringTimesByDay;
        if (savedState.contactInfo !== undefined) merged.contactInfo = savedState.contactInfo;
        if (savedState.selectedCleanerId !== undefined) merged.selectedCleanerId = savedState.selectedCleanerId;
        if (savedState.tipAmount !== undefined) merged.tipAmount = savedState.tipAmount;
        if (savedState.discountCode !== undefined) merged.discountCode = savedState.discountCode;
        if (savedState.date !== undefined) merged.date = savedState.date;
        if (savedState.timeSlot !== undefined) merged.timeSlot = savedState.timeSlot;
        if (savedState.step !== undefined) merged.step = savedState.step;
        
        // Always reset isConfirmed to false when restoring state for a new booking session
        // Confirmed bookings should be viewed at /booking/confirmation, not in the booking flow
        merged.isConfirmed = false;

        if (hasValidUrlService) {
          merged.serviceType = urlServiceSlug as ServiceTypeSlug;
        }
        
        // Update previous step ref
        if (merged.step !== undefined) {
          previousStepRef.current = merged.step;
        }

        return merged;
      });
      
      // Mark state as restored to prevent extras reset
      stateRestoredRef.current = true;
      
      // Update session ID if we loaded from URL
      if (urlSessionId && urlSessionId !== sessionId) {
        setSessionId(urlSessionId);
      }
    } catch (error) {
      console.error('Failed to restore booking state:', error);
      // Update previous step ref even on error to prevent infinite loops
      const currentStep = state?.step;
      if (currentStep !== undefined) {
        previousStepRef.current = currentStep;
      }
      // Mark as attempted even on error
      stateRestoredRef.current = true;
      // Update session ID if changed even on error
      if (sessionChanged) {
        setSessionId(urlSessionId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, props.initialServiceSlug, sessionId]);

  const isServiceRoute = pathname.startsWith('/booking/') && pathname !== '/booking' && pathname !== '/booking/';

  // Listen for route changes (including browser back/forward) to restore state
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isServiceRoute) return;

    // Get session ID from current URL
    const urlSessionId = getSessionIdFromUrl();
    const activeSessionId = urlSessionId || sessionId || getOrCreateSessionId();
    
    // Get current state values safely
    const currentServiceType = state?.serviceType;
    
    // Load saved state
    const savedState = loadSessionState(activeSessionId);
    
    // Restore state if session ID changed
    if (urlSessionId && urlSessionId !== sessionId && savedState) {
      try {
        setState((prev) => {
          // Always restore full state from sessionStorage
          // savedState is the absolute source of truth - use it directly
          const merged = { 
            ...savedState,
          };
          
          // Explicitly preserve ALL fields from savedState
          if (savedState.extras !== undefined) {
            merged.extras = savedState.extras;
          }
          if (savedState.frequency !== undefined) merged.frequency = savedState.frequency;
          if (savedState.provideEquipment !== undefined) merged.provideEquipment = savedState.provideEquipment;
          if (savedState.numberOfCleaners !== undefined) merged.numberOfCleaners = savedState.numberOfCleaners;
          if (savedState.bedrooms !== undefined) merged.bedrooms = savedState.bedrooms;
          if (savedState.bathrooms !== undefined) merged.bathrooms = savedState.bathrooms;
          if (savedState.offices !== undefined) merged.offices = savedState.offices;
          if (savedState.notes !== undefined) merged.notes = savedState.notes;
          if (savedState.recurringFrequency !== undefined) merged.recurringFrequency = savedState.recurringFrequency;
          if (savedState.recurringDays !== undefined) merged.recurringDays = savedState.recurringDays;
          if (savedState.recurringTimesByDay !== undefined) merged.recurringTimesByDay = savedState.recurringTimesByDay;
          if (savedState.contactInfo !== undefined) merged.contactInfo = savedState.contactInfo;
          if (savedState.selectedCleanerId !== undefined) merged.selectedCleanerId = savedState.selectedCleanerId;
          if (savedState.tipAmount !== undefined) merged.tipAmount = savedState.tipAmount;
          if (savedState.discountCode !== undefined) merged.discountCode = savedState.discountCode;
          if (savedState.date !== undefined) merged.date = savedState.date;
          if (savedState.timeSlot !== undefined) merged.timeSlot = savedState.timeSlot;
          if (savedState.step !== undefined) {
            merged.step = savedState.step;
            previousStepRef.current = savedState.step;
          }
          
          return merged;
        });
        
        // Mark state as restored
        stateRestoredRef.current = true;
        
        // Update session ID
        setSessionId(urlSessionId);
      } catch (error) {
        console.error('Failed to restore state from URL session:', error);
      }
    } else if (urlSessionId && urlSessionId !== sessionId) {
      // No saved state for this session ID - start fresh but keep the session ID
      setSessionId(urlSessionId);
    }
  }, [pathname, searchParams, isServiceRoute, sessionId]);

  const persistBookingState = (nextState: BookingState) => {
    if (typeof window === 'undefined') return;
    const activeSessionId = sessionId || getOrCreateSessionId();
    saveSessionState(activeSessionId, nextState);
  };

  // Sync URL with step slug for backward compatibility (handle /booking/[slug] without step)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isServiceRoute) return;
    if (!state?.serviceType) return;

    // Check if current pathname has a step slug
    const pathParts = pathname.split('/').filter(Boolean);
    const hasStepSlug = pathParts.length >= 3 && pathParts[0] === 'booking' && isValidStep(pathParts[2]);

    // If no step slug in URL, add one based on current state
    if (!hasStepSlug && state.serviceType) {
      const stepName = getStepName(state.step);
      const expectedUrl = `/booking/${state.serviceType}/${stepName}`;
      
      // Only update if URL doesn't match expected URL (avoid unnecessary updates)
      if (pathname !== expectedUrl) {
        router.replace(expectedUrl);
      }
    }
  }, [pathname, state?.serviceType, state?.step, isServiceRoute, router]);

  const goToStep = (nextStep: number) => {
    // Use functional state update to avoid stale closures
    setState((prev) => {
      const newState = { ...prev, step: nextStep };
      // Save state
      persistBookingState(newState);
      
      // Update URL with step slug if service is selected
      if (newState.serviceType) {
        const stepName = getStepName(nextStep);
        const serviceSlug = newState.serviceType;
        const newUrl = `/booking/${serviceSlug}/${stepName}`;
        // Use replace to avoid adding to history (smoother navigation)
        router.replace(newUrl);
      }
      
      return newState;
    });
  };

  // Persist state to sessionStorage using session-based storage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const activeSessionId = sessionId || getOrCreateSessionId();
    if (activeSessionId !== sessionId) {
      setSessionId(activeSessionId);
    }
    
    try {
      saveSessionState(activeSessionId, state);
    } catch (e) {
      // Ignore storage errors
    }
  }, [state, sessionId]); // Persist state to sessionStorage on every state change

  // Initialize Paystack script on client side
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if Paystack is already loaded
    if ((window as any).PaystackPop) {
      setPaystackLoaded(true);
      return;
    }

    // Load Paystack inline JS
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => {
      setPaystackLoaded(true);
    };
    script.onerror = () => {
      console.error('Failed to load Paystack script');
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup script if component unmounts
      const existingScript = document.querySelector('script[src="https://js.paystack.co/v1/inline.js"]');
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, []);

  // Initialize extras from database when formData loads or service type changes
  // But only if extras don't already exist (preserve selections from sessionStorage)
  useEffect(() => {
    if (!formData || !formData.extras) return;
    
    // If state was restored from sessionStorage, NEVER reset extras
    // They are already loaded from sessionStorage and should be preserved
    if (stateRestoredRef.current) {
      // State was restored, but we might need to merge if service type changed
      // Only merge if we have existing extras and need to add new ones
      if (state.extras && state.extras.length > 0) {
        // Service type might have changed - merge to add any new extras for the new service type
        // But preserve all existing quantities
        const serviceType = state.serviceType ? serviceSlugToType[state.serviceType] : null;
        let relevantExtras: string[] = [];
        
        if (!serviceType) {
          relevantExtras = formData.extras.all;
        } else if (serviceType === 'Carpet') {
          // For Carpet service, only show Mattress Cleaning and Couch Cleaning
          const allExtras = formData.extras.all || [];
          relevantExtras = allExtras.filter(extra => 
            extra === 'Mattress Cleaning' || extra === 'Couch Cleaning'
          );
        } else if (serviceType === 'Standard' || serviceType === 'Airbnb') {
          relevantExtras = formData.extras.standardAndAirbnb;
        } else if (serviceType === 'Deep' || serviceType === 'Move In/Out') {
          relevantExtras = formData.extras.deepAndMove;
        } else {
          relevantExtras = formData.extras.all;
        }

        // Merge existing extras with new extras, preserving quantities
        const existingExtrasMap = new Map(
          state.extras.map(extra => [extra.name.toLowerCase(), extra])
        );

        const mergedExtras: Extra[] = relevantExtras.map((extraName) => {
          const existing = existingExtrasMap.get(extraName.toLowerCase());
          if (existing) {
            // Preserve existing extra with its quantity
            return {
              ...existing,
              price: formData.extras.prices[extraName] || existing.price,
              iconName: extraName,
            };
          }
          // New extra, initialize with quantity 0
          return {
            id: extraName.toLowerCase().replace(/\s+/g, '-'),
            name: extraName,
            price: formData.extras.prices[extraName] || 0,
            quantity: 0,
            iconName: extraName,
          };
        });

        // Only update if extras actually changed (new extras added for different service type)
        // But preserve all quantities - don't reset any quantities that exist
        const extrasChanged = JSON.stringify(mergedExtras) !== JSON.stringify(state.extras);
        if (extrasChanged) {
          console.log('[Booking] Merging extras after service type change, preserving quantities');
          setState(prev => ({
            ...prev,
            extras: mergedExtras
          }));
        } else {
          console.log('[Booking] Extras unchanged, keeping existing extras with quantities');
        }
      }
      // If state was restored but extras are empty, that's fine - don't reset
      return;
    }
    
    // Initial load (state not restored yet): initialize extras only if they don't exist
    if (state.extras && state.extras.length > 0) {
      return; // Don't overwrite existing extras
    }

    const serviceType = state.serviceType ? serviceSlugToType[state.serviceType] : null;
    let relevantExtras: string[] = [];
    
    if (!serviceType) {
      relevantExtras = formData.extras.all;
    } else if (serviceType === 'Carpet') {
      // For Carpet service, only show Mattress Cleaning and Couch Cleaning
      const allExtras = formData.extras.all || [];
      relevantExtras = allExtras.filter(extra => 
        extra === 'Mattress Cleaning' || extra === 'Couch Cleaning'
      );
    } else if (serviceType === 'Standard' || serviceType === 'Airbnb') {
      relevantExtras = formData.extras.standardAndAirbnb;
    } else if (serviceType === 'Deep' || serviceType === 'Move In/Out') {
      relevantExtras = formData.extras.deepAndMove;
    } else {
      relevantExtras = formData.extras.all;
    }

    const initialExtras: Extra[] = relevantExtras.map((extraName) => {
      return {
        id: extraName.toLowerCase().replace(/\s+/g, '-'),
        name: extraName,
        price: formData.extras.prices[extraName] || 0,
        quantity: 0,
        iconName: extraName // Store name for serialization
      };
    });

    setState(prev => ({
      ...prev,
      extras: initialExtras
    }));
  }, [formData, state.serviceType, state.extras]);

  // Reset frequency to 'one-time' when Carpet, Deep, or Move In/Out service is selected
  useEffect(() => {
    const shouldReset = 
      (state.serviceType === 'carpet' || 
       state.serviceType === 'deep' || 
       state.serviceType === 'move-in-out') && 
      state.frequency !== 'one-time';
    
    if (shouldReset) {
      setState(prev => ({
        ...prev,
        frequency: 'one-time',
        recurringFrequency: null,
        recurringDays: [],
        recurringTimesByDay: {},
        tipAmount: prev.tipAmount, // Preserve tip amount
      }));
    }
  }, [state.serviceType, state.frequency]);

  // Track last fetched combination to prevent duplicate fetches
  const lastFetchKeyRef = useRef<string | null>(null);
  
  // Fetch cleaners function - can be called from useEffect or manually
  const fetchCleanersData = useCallback(async (force = false) => {
    // Only fetch when on step 3
    if (state.step !== 3) {
      return;
    }
    
    // Validate location
    const suburb = (state.contactInfo.suburb || '').trim();
    const city = (state.contactInfo.city || '').trim();
    const location = suburb || city;
    
    // Check if we have required data
    if (!state.date || !location) {
      console.log('[Cleaner Fetch] Missing date or location, cannot fetch cleaners', {
        date: state.date,
        location: location || '(none)'
      });
      return;
    }
    
    // Create a unique key for this fetch combination
    const fetchKey = `${state.step}-${state.date}-${location}-${suburb || ''}`;
    
    // Skip if we've already fetched for this exact combination (unless forced)
    if (!force && lastFetchKeyRef.current === fetchKey) {
      console.log('[Cleaner Fetch] Already fetched for this combination, skipping');
      return;
    }
    
    console.log('[Cleaner Fetch] Starting fetch:', {
      date: state.date,
      city: location,
      suburb: suburb || undefined,
      force
    });
    
    // Mark this combination as being fetched
    lastFetchKeyRef.current = fetchKey;
    setCleanersLoading(true);
    setCleanersError(null);
    
    try {
      const params = new URLSearchParams({
        date: state.date!,
        city: location,
      });
      
      // Add suburb if provided
      if (suburb) {
        params.append('suburb', suburb);
      }
      
      console.log('[Cleaner Fetch] Fetching from:', `/api/cleaners/available?${params.toString()}`);
      
      const response = await fetch(`/api/cleaners/available?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      console.log('[Cleaner Fetch] API response:', {
        ok: data.ok,
        cleanersCount: data.cleaners?.length || 0,
        cleanersIsArray: Array.isArray(data.cleaners),
        error: data.error || null
      });
      
      if (data.ok && Array.isArray(data.cleaners)) {
        console.log('[Cleaner Fetch] Setting cleaners:', data.cleaners.length);
        setCleaners(data.cleaners);
        setCleanersError(null);
      } else {
        console.log('[Cleaner Fetch] No cleaners found or invalid response');
        setCleaners([]);
        setCleanersError(data.error || 'No cleaners available');
      }
    } catch (error) {
      console.error('[Cleaner Fetch] Error:', error);
      setCleaners([]);
      setCleanersError('Failed to load cleaners. Please try again.');
      // Reset fetch key on error so we can retry
      lastFetchKeyRef.current = null;
    } finally {
      setCleanersLoading(false);
    }
  }, [state.step, state.date, state.contactInfo.city, state.contactInfo.suburb]);
  
  // Fetch cleaners when date and location (city or suburb) are available (step 3)
  useEffect(() => {
    // Only fetch when on step 3
    if (state.step !== 3) {
      // Only clear cleaners when actually leaving step 3 (not on initial render or other steps)
      if (previousStepRef.current === 3 && state.step !== 3) {
        console.log('[Cleaner Fetch] Leaving step 3, clearing cleaners');
        setCleaners([]);
        setCleanersLoading(false);
        lastFetchKeyRef.current = null; // Reset fetch key when leaving step 3
      }
      previousStepRef.current = state.step;
      return;
    }
    
    // Reset fetch key when entering step 3 to ensure fetch happens
    const isEnteringStep3 = previousStepRef.current !== 3;
    if (isEnteringStep3) {
      console.log('[Cleaner Fetch] Entering step 3, resetting fetch key');
      lastFetchKeyRef.current = null;
    }
    
    // Fetch cleaners
    fetchCleanersData(false);
    previousStepRef.current = state.step;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.step, state.date, state.contactInfo.city, state.contactInfo.suburb, forceRefreshCleaners]);

  // Transform services from database
  const services = useMemo(() => {
    if (!formData || !formData.services) {
      return [];
    }
    
    const transformed = formData.services.map((service) => {
      const slug = serviceTypeToSlug[service.type];
      const IconComponent = SERVICE_ICON_MAP[service.icon] || Home;
      const basePrice = formData.pricing?.services[service.type]?.base || 0;
      
      return {
        id: slug,
        name: service.label,
        description: service.description,
        basePrice,
        icon: IconComponent
      };
    });
    
    return transformed;
  }, [formData]);

  // Transform frequencies from database
  const frequencies = useMemo(() => {
    const baseFrequencies = [
      { id: 'one-time' as FrequencyType, name: 'One-time', discount: 0 }
    ];
    
    if (formData?.pricing?.frequencyDiscounts) {
      const dbFrequencies = Object.entries(formData.pricing.frequencyDiscounts).map(([key, discount]) => ({
        id: key as FrequencyType,
        name: key === 'weekly' ? 'Weekly' : key === 'bi-weekly' ? 'Bi-weekly' : 'Monthly',
        discount: discount as number
      }));
      return [...baseFrequencies, ...dbFrequencies];
    }
    
    return baseFrequencies;
  }, [formData]);

  // Get available extras for current service type
  const availableExtras = useMemo(() => {
    if (!formData || !formData.extras) return state.extras || [];
    
    const serviceType = state.serviceType ? serviceSlugToType[state.serviceType] : null;
    let relevantExtras: string[] = [];
    
    if (!serviceType) {
      relevantExtras = formData.extras.all || [];
    } else if (serviceType === 'Carpet') {
      // For Carpet service, only show Mattress Cleaning and Couch Cleaning
      const allExtras = formData.extras.all || [];
      relevantExtras = allExtras.filter(extra => 
        extra === 'Mattress Cleaning' || extra === 'Couch Cleaning'
      );
    } else if (serviceType === 'Standard' || serviceType === 'Airbnb') {
      relevantExtras = formData.extras.standardAndAirbnb || [];
    } else if (serviceType === 'Deep' || serviceType === 'Move In/Out') {
      relevantExtras = formData.extras.deepAndMove || [];
    } else {
      relevantExtras = formData.extras.all || [];
    }
    
    // Build available extras from relevantExtras, merging with state.extras to preserve quantities
    const existingExtrasMap = new Map(
      (state.extras || []).map(extra => [extra.name.toLowerCase(), extra])
    );
    
    return relevantExtras.map((extraName) => {
      const existing = existingExtrasMap.get(extraName.toLowerCase());
      if (existing) {
        // Preserve existing extra with its quantity
        return {
          ...existing,
          price: formData.extras.prices[extraName] || existing.price,
          iconName: extraName,
        };
      }
      // New extra, initialize with quantity 0
      return {
        id: extraName.toLowerCase().replace(/\s+/g, '-'),
        name: extraName,
        price: formData.extras.prices[extraName] || 0,
        quantity: 0,
        iconName: extraName,
      };
    });
  }, [formData, state.serviceType, state.extras]);

  const pricing = useMemo(() => {
    const serviceType = state.serviceType ? serviceSlugToType[state.serviceType] : null;
    if (!serviceType) {
      return { base: 0, subtotal: 0, discount: 0, total: 0, equipmentFee: 0, extrasTotal: 0, extraCleanersCharge: 0 };
    }

    // Special handling for Carpet service
    if (serviceType === 'Carpet') {
      const extrasArray = state.extras.filter(e => e.quantity > 0).map(e => e.name);
      const extrasQuantities: Record<string, number> = {};
      state.extras.forEach(e => {
        if (e.quantity > 0) {
          extrasQuantities[e.name] = e.quantity;
        }
      });

      const carpetDetails = {
        hasFittedCarpets: state.bedrooms > 0,
        hasLooseCarpets: state.bathrooms > 0,
        numberOfRooms: state.bedrooms,
        numberOfLooseCarpets: state.bathrooms,
        roomStatus: state.offices === 1 ? 'hasProperty' as const : 'empty' as const,
      };

      const carpetPricing = calcTotalSync(
        {
          service: 'Carpet',
          bedrooms: 0,
          bathrooms: 0,
          extras: extrasArray,
          extrasQuantities,
          carpetDetails,
        },
        state.frequency
      );

      const extrasTotal = state.extras.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
      const tip = state.frequency === 'one-time' ? state.tipAmount : 0;
      const total = carpetPricing.total + tip;

      return {
        subtotal: carpetPricing.subtotal,
        discount: carpetPricing.frequencyDiscount,
        total,
        equipmentFee: 0,
        extrasTotal,
        base: carpetPricing.subtotal - carpetPricing.serviceFee - carpetPricing.frequencyDiscount,
        extraCleanersCharge: 0,
        serviceFee: carpetPricing.serviceFee,
      };
    }

    if (!formData?.pricing) {
      // Fallback to hardcoded pricing
      const servicePricing = PRICING.services[serviceType];
      
      if (!servicePricing) {
        return { base: 0, subtotal: 0, discount: 0, total: 0, equipmentFee: 0, extrasTotal: 0, extraCleanersCharge: 0 };
      }

      const base = servicePricing.base + 
                   state.bedrooms * servicePricing.bedroom + 
                   state.bathrooms * servicePricing.bathroom +
                   state.offices * servicePricing.bathroom;
      const extrasTotal = state.extras.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
      const equipmentFee = state.provideEquipment ? PRICING.equipmentCharge : 0;
      // Extra-cleaner pricing (Standard/Airbnb): labor scales linearly by number of cleaners.
      // Equipment remains a per-booking charge (not per cleaner), matching `lib/pricing.ts`.
      const numberOfCleaners = Math.max(1, Math.round(state.numberOfCleaners ?? 1));
      const laborOneCleaner = base + extrasTotal;
      const extraCleanersCharge =
        (state.serviceType === 'standard' || state.serviceType === 'airbnb')
          ? laborOneCleaner * (numberOfCleaners - 1)
          : 0;
      const subtotal = laborOneCleaner + extraCleanersCharge + equipmentFee;
      const discount = 0;
      const tip = state.frequency === 'one-time' ? state.tipAmount : 0;
      const total = subtotal - discount + tip;
      
      return { subtotal, discount, total, equipmentFee, extrasTotal, base, extraCleanersCharge };
    }

    const servicePricing = formData.pricing.services[serviceType];
    
    if (!servicePricing) {
      return { base: 0, subtotal: 0, discount: 0, total: 0, equipmentFee: 0, extrasTotal: 0, extraCleanersCharge: 0 };
    }

    // Calculate base pricing including bedrooms, bathrooms, and offices
    const base = servicePricing.base + 
                 state.bedrooms * servicePricing.bedroom + 
                 state.bathrooms * servicePricing.bathroom +
                 state.offices * servicePricing.bathroom;
    const extrasTotal = state.extras.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
    const equipmentFee = state.provideEquipment ? (formData.equipment?.charge || PRICING.equipmentCharge) : 0;
    const numberOfCleaners = Math.max(1, Math.round(state.numberOfCleaners ?? 1));
    const laborOneCleaner = base + extrasTotal;
    const extraCleanersCharge =
      (state.serviceType === 'standard' || state.serviceType === 'airbnb')
        ? laborOneCleaner * (numberOfCleaners - 1)
        : 0;
    const subtotal = laborOneCleaner + extraCleanersCharge + equipmentFee;
    
    const freq = frequencies.find(f => f.id === state.frequency);
    const discount = freq ? (subtotal * freq.discount) / 100 : 0;
    const tip = state.frequency === 'one-time' ? state.tipAmount : 0;
    const total = subtotal - discount + tip;
    
    return {
      subtotal,
      discount,
      total,
      equipmentFee,
      extrasTotal,
      base,
      extraCleanersCharge
    };
  }, [formData, state.serviceType, state.bedrooms, state.bathrooms, state.offices, state.extras, state.provideEquipment, state.frequency, state.tipAmount, state.numberOfCleaners, frequencies]);

  const handleNext = () => {
    if (state.step < 4) {
      // Step-specific validation before allowing navigation.
      const getNextStepError = (): string | null => {
        if (state.step === 0) {
          if (!state.serviceType) return 'Please select a service type to continue.';
          return null;
        }

        if (state.step === 1) {
          if (state.recurringFrequency) {
            // Recurring validation - require recurring days and times, but not single date/timeSlot
            if (state.recurringDays.length === 0) return 'Please select at least one recurring day.';
            const missingTimeDay = state.recurringDays.find((d) => !state.recurringTimesByDay[d]);
            if (missingTimeDay !== undefined) return 'Please select a preferred time for each recurring day.';
          } else {
            // One-time validation - require single date and timeSlot
            if (!state.date) return 'Please select a date to continue.';
            if (!state.timeSlot) return 'Please select an arrival time to continue.';
          }
          return null;
        }

        if (state.step === 2) {
          if (!state.contactInfo.firstName?.trim()) return 'Please enter your first name to continue.';
          if (!state.contactInfo.lastName?.trim()) return 'Please enter your last name to continue.';
          if (!state.contactInfo.email?.trim()) return 'Please enter your email to continue.';
          if (!state.contactInfo.phone?.trim()) return 'Please enter your phone number to continue.';
          if (!state.contactInfo.address?.trim()) return 'Please enter your address to continue.';
          if (!state.contactInfo.suburb?.trim()) return 'Please enter your suburb to continue.';
          if (!state.contactInfo.city?.trim()) return 'Please enter your city to continue.';
          return null;
        }

        return null;
      };

      const error = getNextStepError();
      if (error) {
        setBookingError(error);
        return;
      }

      // Clear any prior error once the user passes validation.
      if (bookingError) setBookingError(null);

      const nextStep = state.step + 1;
      const activeSessionId = sessionId || getOrCreateSessionId();
      
      // Build newState before setState to use it for saving and URL building
      // Spread all state fields to ensure complete state is saved
      const newState = { 
        ...state, 
        step: nextStep 
      };
      
      // Log state before saving for debugging (remove in production if needed)
      console.log('[Booking] Saving state before navigation:', {
        step: newState.step,
        serviceType: newState.serviceType,
        bedrooms: newState.bedrooms,
        bathrooms: newState.bathrooms,
        offices: newState.offices,
        extrasCount: newState.extras?.length || 0,
        extrasSelected: newState.extras?.filter(e => e.quantity > 0).length || 0,
        frequency: newState.frequency,
        provideEquipment: newState.provideEquipment,
        numberOfCleaners: newState.numberOfCleaners,
      });
      
      // Update previous step ref before saving
      previousStepRef.current = state.step;
      
      // Save state synchronously to ensure it's persisted
      // This saves ALL state fields including extras, frequency, provideEquipment, etc.
      saveSessionState(activeSessionId, newState);
      
      // Update session ID if needed
      if (activeSessionId !== sessionId) {
        setSessionId(activeSessionId);
      }
      
      // Use functional state update to avoid stale closures
      setState(newState);
      
      // Update URL with step slug if service is selected
      if (newState.serviceType) {
        const stepName = getStepName(nextStep);
        const serviceSlug = newState.serviceType;
        const newUrl = `/booking/${serviceSlug}/${stepName}`;
        // Use replace to avoid adding to history (smoother navigation)
        router.replace(newUrl);
      }
    }
    // Final step (4) - submit booking (handled by payment)
    // This should not be called as there's no next button on review step
  };

  const handleBack = () => {
    if (state.step > 0) {
      const prevStep = state.step - 1;
      const activeSessionId = sessionId || getOrCreateSessionId();
      
      // Update previous step ref before loading state
      previousStepRef.current = state.step;
      
      // Load state from sessionStorage to preserve all selections
      const savedState = loadSessionState(activeSessionId);
      
      // Calculate merged state before setState
      const mergedState = {
        ...state,
        step: prevStep,
        // Merge with saved state to restore any previously entered values
        ...(savedState || {}),
      };
      // Ensure step is set to previous step
      mergedState.step = prevStep;
      
      // Update URL with step slug if service is selected (before setState to avoid render-time navigation)
      if (mergedState.serviceType) {
        const stepName = getStepName(prevStep);
        const serviceSlug = mergedState.serviceType;
        const newUrl = `/booking/${serviceSlug}/${stepName}`;
        // Use replace to avoid adding to history (smoother navigation)
        router.replace(newUrl);
      }
      
      // Update state, preserving all existing values
      setState(() => {
        // Save updated state
        saveSessionState(activeSessionId, mergedState);
        // Update previous step ref to new step
        previousStepRef.current = prevStep;
        
        return mergedState;
      });
    } else if (state.step === 0) {
      // First step - go back to service selection
      updateField('serviceType', null);
      if (isServiceRoute) {
        router.replace('/booking');
      }
    }
  };

  const updateField = (field: string, value: any) => {
    setState(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFrequencyChange = (next: FrequencyType) => {
    // Prevent changing frequency for Carpet service (only one-time allowed)
    if (state.serviceType === 'carpet' && next !== 'one-time') {
      return;
    }
    // Prevent changing frequency for Deep and Move In/Out services (only one-time allowed)
    if ((state.serviceType === 'deep' || state.serviceType === 'move-in-out') && next !== 'one-time') {
      return;
    }
    
    setState(prev => {
      // If the pricing frequency changes away from weekly/bi-weekly, disable custom multi-day recurrence.
      const supportsCustom = next === 'weekly' || next === 'bi-weekly';
      const nextRecurringFrequency: RecurringFrequencyType | null =
        supportsCustom && prev.recurringFrequency
          ? (next === 'weekly' ? 'custom-weekly' : 'custom-bi-weekly')
          : null;

      return {
        ...prev,
        frequency: next,
        // Tips are only supported for one-time bookings (recurring is billed up-front for multiple bookings).
        tipAmount: next === 'one-time' ? prev.tipAmount : 0,
        recurringFrequency: nextRecurringFrequency,
        recurringDays: nextRecurringFrequency ? prev.recurringDays : [],
        recurringTimesByDay: nextRecurringFrequency ? prev.recurringTimesByDay : {},
      };
    });
  };

  const setCustomRecurringEnabled = (enabled: boolean) => {
    setState(prev => {
      if (!enabled) {
        return {
          ...prev,
          recurringFrequency: null,
          recurringDays: [],
          recurringTimesByDay: {},
        };
      }

      const nextRecurringFrequency: RecurringFrequencyType =
        prev.frequency === 'bi-weekly' ? 'custom-bi-weekly' : 'custom-weekly';

      return {
        ...prev,
        recurringFrequency: nextRecurringFrequency,
        recurringDays: prev.recurringDays ?? [],
        recurringTimesByDay: prev.recurringTimesByDay ?? {},
      };
    });
  };

  const toggleRecurringDay = (dayOfWeek: number) => {
    setState(prev => {
      const has = prev.recurringDays.includes(dayOfWeek);
      const nextDays = has
        ? prev.recurringDays.filter(d => d !== dayOfWeek)
        : [...prev.recurringDays, dayOfWeek].sort((a, b) => a - b);

      const nextTimesByDay = { ...prev.recurringTimesByDay };
      if (has) {
        delete nextTimesByDay[dayOfWeek];
      } else if (!nextTimesByDay[dayOfWeek]) {
        // Default to the currently selected time (if any) so the user can move fast.
        nextTimesByDay[dayOfWeek] = prev.timeSlot || TIME_SLOTS[0];
      }

      return {
        ...prev,
        recurringDays: nextDays,
        recurringTimesByDay: nextTimesByDay,
      };
    });
  };

  const setRecurringTimeForDay = (dayOfWeek: number, time: string) => {
    setState(prev => ({
      ...prev,
      recurringTimesByDay: {
        ...prev.recurringTimesByDay,
        [dayOfWeek]: time,
      },
    }));
  };

  const updateContact = (field: string, value: string) => {
    setState(prev => ({
      ...prev,
      contactInfo: {
        ...prev.contactInfo,
        [field]: value
      }
    }));
  };

  const toggleExtra = (idOrName: string, delta: number) => {
    setState(prev => {
      // Normalize the identifier for comparison
      const normalizedId = idOrName.toLowerCase().replace(/\s+/g, '-');
      
      // Try to find by exact id match first
      let extraIndex = prev.extras.findIndex(e => 
        e.id === idOrName || 
        e.id?.toLowerCase() === normalizedId ||
        e.name?.toLowerCase() === idOrName.toLowerCase()
      );
      
      let extraToUpdate: Extra;
      
      if (extraIndex === -1) {
        // Extra doesn't exist in state, we need to create it from availableExtras or formData
        // Find it in availableExtras (which is computed from formData)
        const serviceType = prev.serviceType ? serviceSlugToType[prev.serviceType] : null;
        let relevantExtras: string[] = [];
        
        if (!formData?.extras) {
          console.warn('FormData not available, cannot create extra:', idOrName);
          return prev;
        }
        
        if (!serviceType) {
          relevantExtras = formData.extras.all || [];
        } else if (serviceType === 'Carpet') {
          // For Carpet service, only show Mattress Cleaning and Couch Cleaning
          const allExtras = formData.extras.all || [];
          relevantExtras = allExtras.filter(extra => 
            extra === 'Mattress Cleaning' || extra === 'Couch Cleaning'
          );
        } else if (serviceType === 'Standard' || serviceType === 'Airbnb') {
          relevantExtras = formData.extras.standardAndAirbnb || [];
        } else if (serviceType === 'Deep' || serviceType === 'Move In/Out') {
          relevantExtras = formData.extras.deepAndMove || [];
        } else {
          relevantExtras = formData.extras.all || [];
        }
        
        // Find the extra name from relevantExtras
        const extraName = relevantExtras.find(name => 
          name.toLowerCase() === idOrName.toLowerCase() ||
          name.toLowerCase().replace(/\s+/g, '-') === normalizedId
        );
        
        if (!extraName) {
          console.warn('Extra not found in relevant extras:', idOrName);
          return prev;
        }
        
        // Create new extra object
        extraToUpdate = {
          id: extraName.toLowerCase().replace(/\s+/g, '-'),
          name: extraName,
          price: formData.extras.prices[extraName] || 0,
          quantity: 0,
          iconName: extraName,
        };
        
        // Add it to the state extras array
        const updatedExtras = [...prev.extras, extraToUpdate];
        extraIndex = updatedExtras.length - 1;
        
        // Now update the quantity
        const newQuantity = Math.max(0, extraToUpdate.quantity + delta);
        updatedExtras[extraIndex] = {
          ...extraToUpdate,
          quantity: newQuantity
        };
        
        return {
          ...prev,
          extras: updatedExtras
        };
      }
      
      // Extra exists in state, update it
      const updatedExtras = [...prev.extras];
      extraToUpdate = updatedExtras[extraIndex];
      const newQuantity = Math.max(0, extraToUpdate.quantity + delta);
      
      updatedExtras[extraIndex] = {
        ...extraToUpdate,
        quantity: newQuantity
      };
      
      return {
        ...prev,
        extras: updatedExtras
      };
    });
  };

  const recurringOccurrencesCount = useMemo(() => {
    if (state.frequency === 'one-time') return 1;
    if (!state.date) return 0;

    const startDateObj = new Date(`${state.date}T00:00:00`);
    const isCustom = !!state.recurringFrequency;
    const scheduleFrequency = isCustom ? state.recurringFrequency : state.frequency;

    const rules = isCustom
      ? state.recurringDays
          .map((day) => ({
            day_of_week: day,
            preferred_time: state.recurringTimesByDay[day],
          }))
          .filter(
            (r) =>
              typeof r.day_of_week === 'number' &&
              r.day_of_week >= 0 &&
              r.day_of_week <= 6 &&
              typeof r.preferred_time === 'string' &&
              r.preferred_time.length > 0
          )
      : undefined;

    const scheduleForCalc: any = {
      frequency: scheduleFrequency,
      day_of_week: scheduleFrequency === 'weekly' || scheduleFrequency === 'bi-weekly' ? startDateObj.getDay() : undefined,
      day_of_month: scheduleFrequency === 'monthly' ? startDateObj.getDate() : undefined,
      days_of_week: scheduleFrequency === 'custom-weekly' || scheduleFrequency === 'custom-bi-weekly' ? state.recurringDays : undefined,
      preferred_time: state.timeSlot || TIME_SLOTS[0],
      start_date: state.date,
    };

    return calculateBookingOccurrencesForRollingWindow(scheduleForCalc, startDateObj, rules, { days: 30 }).length;
  }, [
    state.frequency,
    state.date,
    state.timeSlot,
    state.recurringFrequency,
    state.recurringDays,
    state.recurringTimesByDay,
  ]);

  const payNowTotal = useMemo(() => {
    const count = state.frequency === 'one-time' ? 1 : Math.max(0, recurringOccurrencesCount);
    return pricing.total * Math.max(1, count);
  }, [pricing.total, state.frequency, recurringOccurrencesCount]);

  // Submit booking after payment
  const submitBooking = async (paymentReference: string) => {
    setIsSubmittingBooking(true);
    setBookingError(null);

    try {
      const serviceType = state.serviceType ? serviceSlugToType[state.serviceType] : null;
      if (!serviceType) {
        throw new Error('Please select a service type before confirming your booking.');
      }
      if (!state.date || !state.timeSlot) {
        throw new Error('Please select a date and time before confirming your booking.');
      }

      const extrasArray = state.extras
        .filter(e => e.quantity > 0)
        .flatMap(e => Array(e.quantity).fill(e.name));
      
      const extrasQuantities: Record<string, number> = {};
      state.extras.forEach(e => {
        if (e.quantity > 0) {
          extrasQuantities[e.name] = e.quantity;
        }
      });

      const carpetDetails = serviceType === 'Carpet' ? {
        hasFittedCarpets: state.bedrooms > 0,
        hasLooseCarpets: state.bathrooms > 0,
        numberOfRooms: state.bedrooms,
        numberOfLooseCarpets: state.bathrooms,
        roomStatus: state.offices === 1 ? 'hasProperty' as const : 'empty' as const,
      } : undefined;

      const isRecurring = state.frequency !== 'one-time';

      const response = await fetch(isRecurring ? '/api/recurring/checkout' : '/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isRecurring
            ? {
                paymentReference,
                perBookingTotalCents: Math.round(pricing.total * 100),
                priceSnapshot: {
                  service_type: serviceType,
                  bedrooms: state.bedrooms,
                  bathrooms: state.bathrooms,
                  numberOfCleaners: state.numberOfCleaners,
                  extras: extrasArray,
                  extrasQuantities,
                  notes: state.notes || null,
                  subtotal: pricing.subtotal,
                  discount: pricing.discount,
                  equipmentFee: pricing.equipmentFee,
                  total: pricing.total,
                  frequency: state.frequency,
                  occurrencesCount: recurringOccurrencesCount,
                  snapshot_date: new Date().toISOString(),
                  ...(carpetDetails && { carpetDetails }),
                },
                firstName: state.contactInfo.firstName,
                lastName: state.contactInfo.lastName,
                email: state.contactInfo.email,
                phone: state.contactInfo.phone,
                address: {
                  line1: state.contactInfo.address,
                  suburb: state.contactInfo.suburb,
                  city: state.contactInfo.city,
                },
                service: serviceType,
                bedrooms: state.bedrooms,
                bathrooms: state.bathrooms,
                extras: extrasArray,
                extrasQuantities,
                notes: state.notes || undefined,
                frequency: state.frequency,
                recurringFrequency: state.recurringFrequency,
                recurringDays: state.recurringDays,
                recurringTimesByDay: state.recurringTimesByDay,
                start_date: state.date,
                preferred_time: state.timeSlot,
                cleaner_id: state.selectedCleanerId || null,
                ...(carpetDetails && { carpetDetails }),
              }
            : {
                service: serviceType,
                bedrooms: state.bedrooms,
                bathrooms: state.bathrooms,
                numberOfCleaners: state.numberOfCleaners,
                extras: extrasArray,
                extrasQuantities,
                frequency: state.frequency,
                date: state.date,
                time: state.timeSlot,
                firstName: state.contactInfo.firstName,
                lastName: state.contactInfo.lastName,
                email: state.contactInfo.email,
                phone: state.contactInfo.phone,
                address: {
                  line1: state.contactInfo.address,
                  suburb: state.contactInfo.suburb,
                  city: state.contactInfo.city,
                },
                cleaner_id: state.selectedCleanerId || null,
                paymentReference,
                totalAmount: Math.round(payNowTotal * 100), // Convert to cents
                serviceFee: formData?.pricing?.serviceFee || 0,
                frequencyDiscount: pricing.discount,
                tipAmount: state.frequency === 'one-time' ? state.tipAmount : 0,
                discountCode: state.discountCode || undefined,
                notes: state.notes || undefined,
                ...(carpetDetails && { carpetDetails }),
              }
        ),
      });

      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.error || 'Failed to submit booking');
      }

      const bookingRef = result.bookingId || paymentReference;
      setBookingId(bookingRef);
      
      // Redirect to confirmation page instead of showing inline confirmation
      router.push(`/booking/confirmation?ref=${encodeURIComponent(bookingRef)}`);
    } catch (error) {
      console.error('Booking submission error:', error);
      setBookingError(error instanceof Error ? error.message : 'Failed to submit booking. Please contact support.');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  // Handle Paystack payment
  const handlePayment = () => {
    if (!state.contactInfo.email || !state.date || !state.timeSlot) {
      setBookingError('Please complete all required fields before proceeding to payment.');
      return;
    }

    if (state.recurringFrequency) {
      if (state.recurringDays.length === 0) {
        setBookingError('Please select at least one recurring day.');
        return;
      }
      const missingTimeDay = state.recurringDays.find((d) => !state.recurringTimesByDay[d]);
      if (missingTimeDay !== undefined) {
        setBookingError('Please select a preferred time for each recurring day.');
        return;
      }
    }

    if (!paystackLoaded) {
      setBookingError('Payment system is loading. Please wait a moment and try again.');
      return;
    }

    const paystackPublicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '';

    if (!paystackPublicKey) {
      setBookingError('Payment system not configured. Please contact support.');
      return;
    }

    setIsProcessingPayment(true);
    setBookingError(null);

    const paymentReference = `BK-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    try {
      if (state.frequency !== 'one-time' && recurringOccurrencesCount <= 0) {
        setBookingError('No recurring booking dates found for the next 30 days. Please adjust your start date.');
        setIsProcessingPayment(false);
        return;
      }

      const handler = (window as any).PaystackPop.setup({
        key: paystackPublicKey,
        email: state.contactInfo.email,
        amount: Math.round(payNowTotal * 100), // Convert to cents (kobo)
        currency: 'ZAR',
        ref: paymentReference,
        metadata: {
          booking_service: state.serviceType,
          customer_email: state.contactInfo.email,
          customer_name: `${state.contactInfo.firstName} ${state.contactInfo.lastName}`,
          booking_frequency: state.frequency,
          recurring_occurrences_count: state.frequency === 'one-time' ? 1 : recurringOccurrencesCount,
        },
        onClose: () => {
          console.log('Payment modal closed');
          setIsProcessingPayment(false);
        },
        callback: (response: any) => {
          console.log('Payment successful:', response);
          setIsProcessingPayment(false);
          submitBooking(paymentReference);
        },
      });

      handler.openIframe();
    } catch (error) {
      console.error('Payment initialization error:', error);
      setBookingError('Failed to initialize payment. Please try again.');
      setIsProcessingPayment(false);
    }
  };

  // Generate calendar days (simplified - shows next 31 days)
  const generateCalendarDays = () => {
    const days: { day: number; date: string; disabled: boolean }[] = [];
    const today = new Date();
    
    for (let i = 0; i < 31; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay(); // 0=Sunday
      const restrictToRecurringDays =
        !!state.recurringFrequency && state.recurringDays.length > 0;
      const notAllowedByRecurringDays = restrictToRecurringDays && !state.recurringDays.includes(dayOfWeek);
      days.push({
        day: date.getDate(),
        date: dateStr,
        disabled: i < 1 // Disable today and past dates
          || notAllowedByRecurringDays
      });
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();

  // Chunk calendar days into groups of 7 for date cards
  const chunkCalendarDays = (days: typeof calendarDays, chunkSize: number = 7) => {
    const chunks = [];
    for (let i = 0; i < days.length; i += chunkSize) {
      chunks.push(days.slice(i, i + chunkSize));
    }
    return chunks;
  };

  const dateCardChunks = chunkCalendarDays(calendarDays, 7).slice(0, 5); // Get first 5 weeks (35 days)

  // Rendering individual steps
  const renderStepContent = () => {
    const renderServiceSelection = () => {
      if (formDataError) {
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
            <p className="text-red-600 mb-4">{formDataError}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        );
      }

      // Show services if available, or loading state if not ready yet
      if (services.length === 0) {
        return (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Loading services...</span>
          </div>
        );
      }

      return (
        <section className="min-w-0">
          <h3 className="text-lg font-bold mb-4">Select Service Type</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {services.map(service => {
              const IconComponent = service.icon;
              const isSelected = state.serviceType === service.id;
              return (
                <button
                  key={service.id}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const activeSessionId = sessionId || generateSessionId();
                    if (!sessionId) {
                      setSessionId(activeSessionId);
                    }
                    // service.id is already a slug ('standard', 'deep', etc.)
                    const serviceSlug = service.id;
                    
                    // Update state first
                    updateField('serviceType', serviceSlug);
                    updateField('step', 0);
                    
                    // Only navigate if we're not already on this service's page
                    const currentPath = pathname;
                    const targetPath = `/booking/${serviceSlug}/details`;
                    if (!currentPath.startsWith(`/booking/${serviceSlug}`)) {
                      const url = `${targetPath}${activeSessionId ? `?sid=${activeSessionId}` : ''}`;
                      router.push(url);
                    }
                  }}
                  className={cn(
                    "p-4 rounded-xl border-2 text-left transition-all bg-white cursor-pointer relative z-10",
                    isSelected
                      ? "border-blue-600 ring-1 ring-blue-600"
                      : "border-gray-100 hover:border-blue-200"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <IconComponent className={cn(
                      "w-5 h-5 shrink-0",
                      isSelected ? "text-blue-600" : "text-gray-600"
                    )} />
                    <div className="font-bold text-gray-900 truncate">{service.name}</div>
                  </div>
                  <div className="text-sm text-gray-500 mt-1 line-clamp-2">{service.description}</div>
                  <div className="mt-2 font-semibold text-blue-600">From R{service.basePrice}</div>
                </button>
              );
            })}
          </div>
        </section>
      );
    };

    // For steps 1+, show a single loading/error screen.
    // Step 0 can render the service selection (or its loading state) inline.
    if (state.step !== 0) {
      // Show loading state
      if (formDataLoading) {
        return (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Loading booking options...</span>
          </div>
        );
      }

      // Show error state
      if (formDataError) {
        return (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <p className="text-red-600 mb-4">{formDataError}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        );
      }
    }


    switch (state.step) {
      case 0:
        // Service Details
        return (
          <div className="space-y-6">
            {renderServiceSelection()}

            {!state.serviceType ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h4 className="text-base font-bold text-gray-900">Choose a service type to continue</h4>
                <p className="text-sm text-gray-600 mt-2">
                  Once you select a service type, you’ll see Property Details, Cleaning Equipment & Supplies,
                  Number of Cleaners (if applicable), Add Extras, and Booking Frequency.
                </p>
              </div>
            ) : (
              <>
            <section className="space-y-6">
              <div className="flex items-center gap-2">
                <Home className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-gray-900">House Details</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Bedrooms Card / Fitted Carpets Card */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <BedDouble className="w-5 h-5 text-blue-600" />
                    <label className="text-sm font-bold text-gray-900">
                      {state.serviceType === 'carpet' ? 'Fitted Carpets' : 'Bedrooms'}
                    </label>
                  </div>
                  <Select
                    value={state.bedrooms.toString()}
                    onValueChange={(value) => updateField('bedrooms', parseInt(value))}
                  >
                    <SelectTrigger className="w-full border-gray-200 bg-gray-50">
                      <SelectValue placeholder={state.serviceType === 'carpet' ? "Select rooms" : "Select bedrooms"} />
                    </SelectTrigger>
                    <SelectContent>
                      {state.serviceType === 'carpet' ? (
                        Array.from({ length: 11 }).map((_, i) => (
                          <SelectItem key={i} value={i.toString()}>
                            {i} {i === 1 ? 'Room' : 'Rooms'}
                          </SelectItem>
                        ))
                      ) : (
                        [0, 1, 2, 3, 4, 5].map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num === 5 ? '5+ Bedrooms' : `${num} ${num === 1 ? 'Bedroom' : 'Bedrooms'}`}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Bathrooms Card / Loose Carpets/Rugs Card */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Droplet className="w-5 h-5 text-blue-600" />
                    <label className="text-sm font-bold text-gray-900">
                      {state.serviceType === 'carpet' ? 'Loose Carpets/Rugs' : 'Bathrooms'}
                    </label>
                  </div>
                  <Select
                    value={state.bathrooms.toString()}
                    onValueChange={(value) => updateField('bathrooms', parseInt(value))}
                  >
                    <SelectTrigger className="w-full border-gray-200 bg-gray-50">
                      <SelectValue placeholder={state.serviceType === 'carpet' ? "Select number" : "Select bathrooms"} />
                    </SelectTrigger>
                    <SelectContent>
                      {state.serviceType === 'carpet' ? (
                        Array.from({ length: 21 }).map((_, i) => (
                          <SelectItem key={i} value={i.toString()}>
                            {i} {i === 1 ? 'Carpet/Rug' : 'Carpets/Rugs'}
                          </SelectItem>
                        ))
                      ) : (
                        [1, 2, 3, 4, 5].map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num === 5 ? '5+ Bathrooms' : `${num} ${num === 1 ? 'Bathroom' : 'Bathrooms'}`}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Office Card / Room Status Card */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Building className="w-5 h-5 text-blue-600" />
                    <label className="text-sm font-bold text-gray-900">
                      {state.serviceType === 'carpet' ? 'Room Status' : 'Office'}
                    </label>
                  </div>
                  {state.serviceType === 'carpet' ? (
                    <RadioGroup
                      value={state.offices === 1 ? 'hasProperty' : 'empty'}
                      onValueChange={(value) => updateField('offices', value === 'hasProperty' ? 1 : 0)}
                      className="flex gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="empty" id="booking-empty" />
                        <Label htmlFor="booking-empty" className="text-sm font-normal cursor-pointer">
                          Room is Empty
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="hasProperty" id="booking-hasProperty" />
                        <Label htmlFor="booking-hasProperty" className="text-sm font-normal cursor-pointer">
                          Has Property
                        </Label>
                      </div>
                    </RadioGroup>
                  ) : (
                    <Select
                      value={state.offices.toString()}
                      onValueChange={(value) => updateField('offices', parseInt(value))}
                    >
                      <SelectTrigger className="w-full border-gray-200 bg-gray-50">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {[0, 1, 2, 3, 4, 5].map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num === 0 ? 'None' : num === 5 ? '5+ Offices' : num === 1 ? '1 Office' : `${num} Offices`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </section>

            {(state.serviceType === 'standard' || state.serviceType === 'airbnb') && (
              <section className="space-y-6">
                <h3 className="text-lg font-bold text-gray-900">Cleaning Setup</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Cleaning Equipment Card */}
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <button
                        onClick={() => setShowEquipmentModal(true)}
                        className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                        aria-label="View equipment checklist"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                      <label className="text-sm font-bold text-gray-900">Cleaning Equipment</label>
                    </div>
                    <Select
                      value={state.provideEquipment ? 'yes' : 'no'}
                      onValueChange={(value) => updateField('provideEquipment', value === 'yes')}
                    >
                      <SelectTrigger className="w-full border-gray-200 bg-gray-50">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Number of Cleaners Card - Only show for standard or airbnb */}
                  {(state.serviceType === 'standard' || state.serviceType === 'airbnb') && (
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <Users className="w-5 h-5 text-blue-600" />
                        <label className="text-sm font-bold text-gray-900">Number of Cleaners</label>
                      </div>
                      <Select
                        value={state.numberOfCleaners.toString()}
                        onValueChange={(value) => updateField('numberOfCleaners', parseInt(value))}
                      >
                      <SelectTrigger className="w-full border-2 border-blue-600 bg-gray-50 focus:border-blue-600 focus:ring-blue-600">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 5 }, (_, i) => i + 1).map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num} {num === 1 ? 'cleaner' : 'cleaners'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </section>
            )}

            <section>
              <div className="flex items-center gap-2 mb-4">
                <Box className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-bold text-gray-900">Additional Services</h3>
                <span className="text-sm font-normal text-gray-500">(Optional)</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {availableExtras.map(extra => (
                  <div
                    key={extra.id}
                    className={cn(
                      "p-4 rounded-xl border transition-all flex flex-col items-center text-center bg-white relative z-10",
                      extra.quantity > 0 
                        ? "border-gray-200 border-l-4 border-l-blue-500" 
                        : "border-gray-200 hover:border-blue-300 hover:shadow-md cursor-pointer"
                    )}
                    onClick={(e) => {
                      // If clicking on the card but not on buttons, add the service
                      if ((e.target as HTMLElement).closest('button') === null) {
                        if (extra.quantity === 0) {
                          toggleExtra(extra.id, 1);
                        }
                      }
                    }}
                  >
                    <div className="mb-3 flex items-center justify-center text-gray-700">
                      {React.createElement(getIconComponent(extra.iconName || extra.name), { className: "w-6 h-6" })}
                    </div>
                    <div className="text-xs font-bold text-gray-900 mb-2 text-center leading-tight min-h-[32px] flex items-center justify-center">
                      {extra.name}
                    </div>
                    <div className="text-sm font-semibold text-gray-900 mb-3">R{extra.price}</div>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleExtra(extra.id, -1);
                        }}
                        disabled={extra.quantity === 0}
                        className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed relative z-20"
                      >
                        -
                      </button>
                      <span className="text-sm font-bold text-gray-900 min-w-[20px]">{extra.quantity}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          // Try using the id first, fallback to name if needed
                          const identifier = extra.id || extra.name;
                          console.log('Plus button clicked for extra:', { id: extra.id, name: extra.name, identifier });
                          toggleExtra(identifier, 1);
                        }}
                        className="w-6 h-6 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center text-xs hover:bg-blue-50 hover:border-blue-400 active:bg-blue-100 active:scale-95 transition-all cursor-pointer relative z-20 touch-manipulation"
                        aria-label={`Add ${extra.name}`}
                        style={{ pointerEvents: 'auto' }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-blue-600 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold">Booking Frequency</h3>
                  <p className="text-blue-100 text-sm">Save up to {Math.max(...frequencies.map(f => f.discount))}% on recurring bookings</p>
                </div>
                <div className="flex bg-blue-700/50 p-1 rounded-xl">
                  {frequencies.map(f => {
                    const isCarpetService = state.serviceType === 'carpet';
                    const isDeepOrMoveInOut = state.serviceType === 'deep' || state.serviceType === 'move-in-out';
                    const isDisabled = 
                      (isCarpetService && f.id !== 'one-time') ||
                      (isDeepOrMoveInOut && f.id !== 'one-time');
                    return (
                      <button
                        key={f.id}
                        onClick={() => handleFrequencyChange(f.id)}
                        disabled={isDisabled}
                        className={cn(
                          "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                          state.frequency === f.id
                            ? "bg-white text-blue-600 shadow-md"
                            : "text-white/70 hover:text-white",
                          isDisabled && "opacity-50 cursor-not-allowed hover:text-white/70"
                        )}
                      >
                        {f.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
              </>
            )}
          </div>
        );
      case 1:
        // Schedule
        return (
          <div className="space-y-8">
            {(state.frequency === 'weekly' || state.frequency === 'bi-weekly') && (
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Recurring days & times</h3>
                    <p className="text-sm text-gray-500">
                      Optional: choose multiple days and a preferred time per day.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCustomRecurringEnabled(!state.recurringFrequency)}
                    className={cn(
                      "px-3 py-2 rounded-lg text-sm font-bold border transition-all",
                      state.recurringFrequency
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-900 border-gray-200 hover:border-blue-300"
                    )}
                  >
                    {state.recurringFrequency ? 'Enabled' : 'Enable'}
                  </button>
                </div>

                {state.recurringFrequency && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { label: 'Mon', value: 1 },
                        { label: 'Tue', value: 2 },
                        { label: 'Wed', value: 3 },
                        { label: 'Thu', value: 4 },
                        { label: 'Fri', value: 5 },
                        { label: 'Sat', value: 6 },
                        { label: 'Sun', value: 0 },
                      ].map((d) => {
                        const isSelected = state.recurringDays.includes(d.value);
                        return (
                          <button
                            key={d.value}
                            type="button"
                            onClick={() => toggleRecurringDay(d.value)}
                            className={cn(
                              "px-3 py-2 rounded-xl border-2 font-bold transition-all",
                              isSelected
                                ? "border-blue-600 bg-blue-50 text-blue-700"
                                : "border-gray-200 bg-white text-gray-900 hover:border-blue-300"
                            )}
                          >
                            {d.label}
                          </button>
                        );
                      })}
                    </div>

                    {state.recurringDays.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {state.recurringDays.map((dayOfWeek) => {
                          const nextDate = getNextOccurrenceDate(dayOfWeek, state.date);
                          const dayName = dayOfWeek === 0 ? 'Sunday' :
                                         dayOfWeek === 1 ? 'Monday' :
                                         dayOfWeek === 2 ? 'Tuesday' :
                                         dayOfWeek === 3 ? 'Wednesday' :
                                         dayOfWeek === 4 ? 'Thursday' :
                                         dayOfWeek === 5 ? 'Friday' : 'Saturday';
                          const formattedDate = formatDateShort(nextDate);
                          
                          return (
                            <div key={dayOfWeek} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200">
                              <div className="text-sm font-bold text-gray-900">
                                {dayName}, {formattedDate}
                              </div>
                              <Select
                                value={state.recurringTimesByDay[dayOfWeek] || ''}
                                onValueChange={(value) => setRecurringTimeForDay(dayOfWeek, value)}
                              >
                                <SelectTrigger className="w-[140px] border-gray-200 bg-white">
                                  <SelectValue placeholder="Time" />
                                </SelectTrigger>
                                <SelectContent>
                                  {TIME_SLOTS.map((slot) => (
                                    <SelectItem key={`${dayOfWeek}-${slot}`} value={slot}>
                                      {slot}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {state.recurringDays.length > 0 && (
                      <div className="text-xs text-gray-500">
                        Dates below are limited to your selected recurring days.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {!(state.frequency === 'weekly' || state.frequency === 'bi-weekly') && (
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Select Date</h3>
                  <p className="text-sm text-gray-500">Choose your preferred day of week.</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: 'Mon', value: 1 },
                    { label: 'Tue', value: 2 },
                    { label: 'Wed', value: 3 },
                    { label: 'Thu', value: 4 },
                    { label: 'Fri', value: 5 },
                    { label: 'Sat', value: 6 },
                    { label: 'Sun', value: 0 },
                  ].map((d) => {
                    // Determine if this day is selected by checking if state.date's day of week matches
                    const isSelected = state.date ? new Date(state.date).getDay() === d.value : false;
                    return (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => {
                          const nextDate = getNextOccurrenceDate(d.value, null);
                          updateField('date', nextDate);
                        }}
                        className={cn(
                          "px-3 py-2 rounded-xl border-2 font-bold transition-all",
                          isSelected
                            ? "border-blue-600 bg-blue-50 text-blue-700"
                            : "border-gray-200 bg-white text-gray-900 hover:border-blue-300"
                        )}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>

                {state.date && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200">
                      {(() => {
                        const selectedDayOfWeek = new Date(state.date).getDay();
                        const dayName = selectedDayOfWeek === 0 ? 'Sunday' :
                                       selectedDayOfWeek === 1 ? 'Monday' :
                                       selectedDayOfWeek === 2 ? 'Tuesday' :
                                       selectedDayOfWeek === 3 ? 'Wednesday' :
                                       selectedDayOfWeek === 4 ? 'Thursday' :
                                       selectedDayOfWeek === 5 ? 'Friday' : 'Saturday';
                        const formattedDate = formatDateShort(state.date);
                        
                        // Calculate previous and next dates for navigation
                        const prevDate = getPreviousOccurrenceDate(state.date);
                        const nextDate = getNextWeekOccurrenceDate(state.date);
                        
                        // Check boundaries
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const prevDateObj = new Date(prevDate);
                        prevDateObj.setHours(0, 0, 0, 0);
                        const isPrevDisabled = prevDateObj < today;
                        
                        const threeMonthsFromNow = new Date(today);
                        threeMonthsFromNow.setMonth(today.getMonth() + 3);
                        const nextDateObj = new Date(nextDate);
                        nextDateObj.setHours(0, 0, 0, 0);
                        const isNextDisabled = nextDateObj > threeMonthsFromNow;
                        
                        return (
                          <>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  if (!isPrevDisabled) {
                                    updateField('date', prevDate);
                                  }
                                }}
                                disabled={isPrevDisabled}
                                className={cn(
                                  "p-1 rounded-md transition-colors",
                                  isPrevDisabled
                                    ? "text-gray-300 cursor-not-allowed"
                                    : "text-gray-600 hover:bg-gray-200"
                                )}
                                aria-label="Previous week"
                              >
                                <ArrowLeft className="w-4 h-4" />
                              </button>
                              <div className="text-sm font-bold text-gray-900">
                                {dayName}, {formattedDate}
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  if (!isNextDisabled) {
                                    updateField('date', nextDate);
                                  }
                                }}
                                disabled={isNextDisabled}
                                className={cn(
                                  "p-1 rounded-md transition-colors",
                                  isNextDisabled
                                    ? "text-gray-300 cursor-not-allowed"
                                    : "text-gray-600 hover:bg-gray-200"
                                )}
                                aria-label="Next week"
                              >
                                <ArrowRight className="w-4 h-4" />
                              </button>
                            </div>
                            <Select
                              value={state.timeSlot || ''}
                              onValueChange={(value) => updateField('timeSlot', value)}
                            >
                              <SelectTrigger className="w-[140px] border-gray-200 bg-white">
                                <SelectValue placeholder="Time" />
                              </SelectTrigger>
                              <SelectContent>
                                {TIME_SLOTS.map((slot) => (
                                  <SelectItem key={slot} value={slot}>
                                    {slot}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </>
                        );
                      })()}
                    </div>
                    <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl flex gap-3">
                      <Info className="w-5 h-5 text-orange-500 shrink-0" />
                      <p className="text-xs text-orange-800 leading-relaxed">
                        Arrival window: Our cleaners arrive within 30 minutes of the selected time slot to allow for traffic.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      case 2:
        // Contact Information
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <label className="block">
                  <span className="text-sm font-bold text-gray-700">First Name</span>
                  <input
                    type="text"
                    value={state.contactInfo.firstName}
                    onChange={e => updateContact('firstName', e.target.value)}
                    className="mt-1 block w-full rounded-xl border-gray-200 bg-gray-50 border p-3 focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                    placeholder="John"
                  />
                </label>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <label className="block">
                  <span className="text-sm font-bold text-gray-700">Last Name</span>
                  <input
                    type="text"
                    value={state.contactInfo.lastName}
                    onChange={e => updateContact('lastName', e.target.value)}
                    className="mt-1 block w-full rounded-xl border-gray-200 bg-gray-50 border p-3 focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                    placeholder="Doe"
                  />
                </label>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <label className="block">
                  <span className="text-sm font-bold text-gray-700">Email Address</span>
                  <input
                    type="email"
                    value={state.contactInfo.email}
                    onChange={e => updateContact('email', e.target.value)}
                    className="mt-1 block w-full rounded-xl border-gray-200 bg-gray-50 border p-3 focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                    placeholder="john@example.com"
                  />
                </label>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <label className="block">
                  <span className="text-sm font-bold text-gray-700">Phone Number</span>
                  <input
                    type="tel"
                    value={state.contactInfo.phone}
                    onChange={e => updateContact('phone', e.target.value)}
                    className="mt-1 block w-full rounded-xl border-gray-200 bg-gray-50 border p-3 focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                    placeholder="082 123 4567"
                  />
                </label>
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <label className="block">
                  <span className="text-sm font-bold text-gray-700">Street Address</span>
                  <div className="relative mt-1">
                    <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={state.contactInfo.address}
                      onChange={e => updateContact('address', e.target.value)}
                      className="block w-full rounded-xl border-gray-200 bg-gray-50 border p-3 pl-10 focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                      placeholder="123 Ocean View Dr"
                    />
                  </div>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <label className="block">
                    <span className="text-sm font-bold text-gray-700">Suburb</span>
                    <input
                      type="text"
                      value={state.contactInfo.suburb}
                      onChange={e => updateContact('suburb', e.target.value)}
                      className="mt-1 block w-full rounded-xl border-gray-200 bg-gray-50 border p-3 focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                      placeholder="Sea Point"
                    />
                  </label>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <label className="block">
                    <span className="text-sm font-bold text-gray-700">City</span>
                    <input
                      type="text"
                      value={state.contactInfo.city}
                      onChange={e => updateContact('city', e.target.value)}
                      className="mt-1 block w-full rounded-xl border-gray-200 bg-gray-50 border p-3 focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                      placeholder="Cape Town"
                    />
                  </label>
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl flex gap-3 items-start mt-6">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800 leading-relaxed">
                  Your data is protected. We use industry-standard encryption to keep your information safe and private.
                </p>
              </div>
            </div>
          </div>
        );
      case 3:
        // Cleaner Selection
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Choose a Pro</h3>
              <button
                onClick={() => updateField('selectedCleanerId', null)}
                className={cn(
                  "text-sm font-bold px-4 py-2 rounded-lg transition-all",
                  state.selectedCleanerId === null
                    ? "bg-blue-600 text-white"
                    : "text-blue-600 hover:bg-blue-50"
                )}
              >
                Auto-assign Best Available
              </button>
            </div>
            
            {/* Show loading state */}
            {cleanersLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span className="ml-3 text-gray-600">Loading available cleaners...</span>
              </div>
            )}
            
            {/* Show error state - but don't block cleaner display if we have cleaners */}
            {!cleanersLoading && cleanersError && cleaners.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-semibold">{cleanersError}</span>
                </div>
                <p className="text-sm text-yellow-700 mt-2">
                  You can proceed with auto-assignment, and we'll assign the best available cleaner for your booking.
                </p>
                <button
                  onClick={() => {
                    // Reset fetch key to allow retry
                    lastFetchKeyRef.current = null;
                    // Force re-fetch
                    fetchCleanersData(true);
                  }}
                  className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-semibold hover:bg-yellow-700 transition-colors"
                >
                  Retry Loading Cleaners
                </button>
              </div>
            )}
            
            {/* Show cleaners if available */}
            {!cleanersLoading && cleaners.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {cleaners.map(cleaner => (
                  <div
                    key={cleaner.id}
                    onClick={() => updateField('selectedCleanerId', cleaner.id)}
                    className={cn(
                      "p-5 rounded-2xl border-2 transition-all cursor-pointer relative",
                      state.selectedCleanerId === cleaner.id
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-100 hover:border-blue-200 bg-white"
                    )}
                  >
                    {state.selectedCleanerId === cleaner.id && (
                      <div className="absolute top-4 right-4 bg-blue-600 text-white p-1 rounded-full">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    )}
                    <img
                      src={cleaner.photo_url || 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=150&h=150'}
                      alt={cleaner.name}
                      className="w-16 h-16 rounded-full object-cover mb-4 border-4 border-white shadow-sm"
                    />
                    <h4 className="font-bold text-gray-900">{cleaner.name}</h4>
                    <div className="flex items-center gap-1 text-sm text-yellow-500 mt-1">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="font-bold">{cleaner.rating?.toFixed(1) || '5.0'}</span>
                    </div>
                    {cleaner.bio && (
                      <div className="mt-3 text-xs text-gray-500 leading-relaxed line-clamp-2">
                        {cleaner.bio}
                      </div>
                    )}
                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                      {cleaner.years_experience && (
                        <span className="px-2 py-1 bg-gray-100 rounded-md font-semibold text-gray-600">
                          {cleaner.years_experience} {cleaner.years_experience === 1 ? 'year' : 'years'} exp
                        </span>
                      )}
                      <span className="text-green-600 font-bold uppercase tracking-tight">Available</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Show no cleaners message only when not loading and no cleaners available */}
            {!cleanersLoading && cleaners.length === 0 && !cleanersError && state.date && (state.contactInfo.suburb || state.contactInfo.city) && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-blue-800">
                  No cleaners available for the selected date and location. We'll auto-assign the best available cleaner.
                </p>
              </div>
            )}
            
            {/* Show placeholder when date/location not selected yet */}
            {!cleanersLoading && cleaners.length === 0 && !cleanersError && (!state.date || (!state.contactInfo.suburb && !state.contactInfo.city)) && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-gray-600">
                  Please select a date and provide your location to see available cleaners.
                </p>
              </div>
            )}
          </div>
        );
      case 4:
        // Review & Payment
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-8">
              <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Contact Details
                </h3>
                <div className="space-y-2 text-sm">
                  <p className="font-bold text-gray-900">
                    {state.contactInfo.firstName} {state.contactInfo.lastName}
                  </p>
                  <div className="flex items-center gap-2 text-gray-500">
                    <Mail className="w-4 h-4" /> {state.contactInfo.email}
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <Phone className="w-4 h-4" /> {state.contactInfo.phone}
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <MapPin className="w-4 h-4" /> {state.contactInfo.address}, {state.contactInfo.suburb}, {state.contactInfo.city}
                  </div>
                </div>
                <button
                  onClick={() => goToStep(2)}
                  className="mt-4 text-xs font-bold text-blue-600 hover:underline"
                >
                  Edit Contact Info
                </button>
              </section>

              <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Gift className="w-5 h-5 text-blue-600" />
                  Add a Tip
                </h3>
                <div className="flex gap-2">
                  {[20, 50, 100].map(amount => (
                    <button
                      key={amount}
                      onClick={() => updateField('tipAmount', amount)}
                      className={cn(
                        "px-4 py-2 rounded-xl border-2 font-bold text-sm transition-all",
                        state.tipAmount === amount
                          ? "border-blue-600 bg-blue-50 text-blue-600"
                          : "border-gray-100 hover:border-blue-100"
                      )}
                    >
                      R{amount}
                    </button>
                  ))}
                  <input
                    type="number"
                    placeholder="Custom"
                    onChange={e => updateField('tipAmount', Number(e.target.value))}
                    className="w-24 px-4 py-2 rounded-xl border-2 border-gray-100 text-sm font-bold focus:border-blue-600 outline-none"
                  />
                </div>
              </section>

              <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-blue-600" />
                  Promo Code
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter code"
                    value={state.discountCode}
                    onChange={e => updateField('discountCode', e.target.value)}
                    className="flex-1 px-4 py-2 rounded-xl border-2 border-gray-100 text-sm font-bold focus:border-blue-600 outline-none"
                  />
                  <button className="px-6 py-2 bg-gray-900 text-white rounded-xl font-bold text-sm">
                    Apply
                  </button>
                </div>
              </section>
            </div>

            <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100">
              <h3 className="text-xl font-black mb-8">Booking Summary</h3>
              
              <div className="space-y-4 pb-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                      <Home className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{services.find(s => s.id === state.serviceType)?.name || `${state.serviceType} Service`}</div>
                      <div className="text-xs text-gray-500">
                        {state.serviceType === 'carpet' ? (
                          <>
                            {state.bedrooms} Fitted, {state.bathrooms} Loose, {state.offices === 1 ? 'Has Property' : 'Empty'}
                          </>
                        ) : (
                          <>
                            {state.bedrooms} Bed, {state.bathrooms} Bath, {state.offices} Office{state.offices === 1 ? '' : 's'}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="font-bold">R{pricing.base}</span>
                </div>

                {(pricing.extraCleanersCharge || 0) > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">
                      Extra cleaners ({Math.max(0, (state.numberOfCleaners ?? 1) - 1)} extra)
                    </span>
                    <span className="font-bold">R{pricing.extraCleanersCharge}</span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{state.date || 'Pick a date'}</div>
                      <div className="text-xs text-gray-500">
                        {state.timeSlot ? `Arrival at ${state.timeSlot}` : 'Pick a time'}
                      </div>
                    </div>
                  </div>
                </div>

                {state.extras.filter(e => e.quantity > 0).map(extra => (
                  <div key={extra.id} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">{extra.quantity} {extra.name}</span>
                    <span className="font-bold">R{extra.price * extra.quantity}</span>
                  </div>
                ))}

                {state.provideEquipment && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Cleaning Materials Provided</span>
                    <span className="font-bold">R{pricing.equipmentFee}</span>
                  </div>
                )}
              </div>

              <div className="py-6 space-y-4 border-b border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-bold">R{pricing.subtotal}</span>
                </div>
                {pricing.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span className="font-bold">Discount ({state.frequency})</span>
                    <span className="font-bold">-R{pricing.discount}</span>
                  </div>
                )}
                {state.frequency === 'one-time' && state.tipAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tip</span>
                    <span className="font-bold">R{state.tipAmount}</span>
                  </div>
                )}
              </div>

              <div className="pt-6 flex justify-between items-center">
                <span className="text-lg font-black uppercase text-gray-400">Total</span>
                <span className="text-3xl font-black text-blue-600">R{payNowTotal}</span>
              </div>

              {bookingError && (
                <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-semibold">{bookingError}</span>
                  </div>
                </div>
              )}
              
              <button
                onClick={handlePayment}
                disabled={isProcessingPayment || isSubmittingBooking || !state.contactInfo.email || !state.date || !state.timeSlot}
                className={cn(
                  "w-full mt-10 py-5 bg-blue-600 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-xl shadow-blue-200",
                  (isProcessingPayment || isSubmittingBooking || !state.contactInfo.email || !state.date || !state.timeSlot) && "opacity-50 cursor-not-allowed"
                )}
              >
                {isProcessingPayment || isSubmittingBooking ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    {isProcessingPayment ? 'Processing Payment...' : 'Submitting Booking...'}
                  </>
                ) : (
                  <>
                    <CreditCard className="w-6 h-6" />
                    Secure Checkout
                  </>
                )}
              </button>
              
              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400 font-bold uppercase tracking-widest">
                <ShieldCheck className="w-4 h-4" />
                Encrypted & Secure
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Helper function to format booking ID to 8 digits for display
  const formatBookingIdForDisplay = (id: string | null): string => {
    if (!id) return '';
    
    // SCS format: SCS-12345678 -> 12345678
    if (id.startsWith('SCS-')) {
      return id.substring(4);
    }
    
    // BK format: BK-1234567890-abc -> extract numbers, take last 8
    if (id.startsWith('BK-')) {
      const numericPart = id.replace(/\D/g, ''); // Extract all digits
      return numericPart.slice(-8).padStart(8, '0'); // Take last 8, pad if needed
    }
    
    // Fallback: extract last 8 digits from any format
    const digits = id.replace(/\D/g, '');
    if (digits.length >= 8) {
      return digits.slice(-8);
    }
    return digits.padStart(8, '0');
  };

  // Note: Confirmation is now handled by the dedicated /booking/confirmation page
  // After successful booking submission, we redirect to that page instead of showing inline confirmation

  const getCurrentStepFromPathname = (value: string | null | undefined): number => {
    if (!value) return 0;
    // Expected: /booking/service/:slug/:step
    const parts = value.split('/').filter(Boolean);
    const maybeStep = parts[parts.length - 1];
    if (maybeStep && isValidStep(maybeStep)) {
      return getStepNumber(maybeStep);
    }
    return 0;
  };

  // Progress in the header should be URL-driven (stays correct on refresh/back/forward).
  const currentStep = getCurrentStepFromPathname(pathname);

  // Ensure we have valid state before rendering
  if (!state || typeof state.step !== 'number') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading booking form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* Header matching sweepsouth design */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-16 md:h-20 relative">
            {/* Left: Logo and Company Name */}
            <div className="absolute left-4 sm:left-6 lg:left-8 flex items-center gap-2 md:gap-3">
              <div className="relative w-8 h-8 md:w-10 md:h-10 flex-shrink-0 flex items-center justify-center">
                <img
                  src="/logo.svg"
                  alt="Shalean logo"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src.includes('logo.svg')) {
                      target.src = '/logo.png';
                    }
                  }}
                />
              </div>
              <span className="text-lg md:text-xl font-bold text-gray-900">Shalean</span>
            </div>

            {/* Center: Five-Step Progress Indicator */}
            <div className="w-[420px] max-w-[60vw]">
              <StepIndicator currentStep={currentStep} compact className="mb-0" />
            </div>

            {/* Right: Help Button */}
            <div className="absolute right-4 sm:right-6 lg:right-8">
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs md:text-sm font-medium transition-colors border border-gray-200">
                <HelpCircle className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span>Help</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className={cn("max-w-7xl mx-auto py-8 md:py-12", state.step < 4 && "pb-20")}>

        <main className="relative">
          <div
            className={cn(
              "grid gap-8 min-w-0",
              state.step < 4 ? "lg:grid-cols-[1fr,400px]" : "grid-cols-1"
            )}
          >
            {/* Main Content */}
            <div className="rounded-3xl p-2 md:p-0 min-w-0 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={state.step}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="md:py-10 md:rounded-[40px] md:shadow-2xl md:shadow-blue-100/50"
                >
                  {(() => {
                    const content = renderStepContent();
                    return content || <div>Loading...</div>;
                  })()}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Sticky Booking Summary - Only show on steps 0-3 */}
            {state.step < 4 && (
              <div className="hidden lg:block">
                <BookingSummary
                  state={state}
                  pricing={pricing}
                  payNowTotal={payNowTotal}
                  services={services}
                  frequencies={frequencies}
                />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Sticky Footer with Navigation - Only show on steps 0-3 */}
      {state.step < 4 && (
        <footer className="fixed bottom-0 left-0 right-0 z-40 h-20 bg-white border-t border-gray-200 shadow-lg">
          <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8">
            <div className="h-full flex items-center justify-between">
              {state.step > 0 ? (
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 font-bold text-gray-500 hover:text-gray-900 transition-all"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back
                </button>
              ) : (
                <div />
              )}

              <button
                onClick={handleNext}
                disabled={
                  (state.step === 0 && !state.serviceType) ||
                  (state.step === 1 &&
                    (state.recurringFrequency
                      ? (state.recurringDays.length === 0 ||
                         state.recurringDays.some((d) => !state.recurringTimesByDay[d]))
                      : (!state.date || !state.timeSlot))) ||
                  (state.step === 2 &&
                    (!state.contactInfo.firstName?.trim() ||
                      !state.contactInfo.lastName?.trim() ||
                      !state.contactInfo.email?.trim() ||
                      !state.contactInfo.phone?.trim() ||
                      !state.contactInfo.address?.trim() ||
                      !state.contactInfo.suburb?.trim() ||
                      !state.contactInfo.city?.trim()))
                }
                className={cn(
                  "px-10 py-4 bg-blue-600 text-white rounded-2xl font-black flex items-center gap-3 transition-all shadow-xl shadow-blue-200",
                  "hover:bg-blue-700",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
                )}
              >
                Next Step
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </footer>
      )}

      {/* Equipment Modal */}
      {showEquipmentModal && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setShowEquipmentModal(false)}
            aria-hidden="true"
          />

          {/* Bottom Sheet */}
          <div
            className={cn(
              'fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out',
              'max-h-[85vh] overflow-y-auto'
            )}
          >
            {/* Handle */}
            <div className="sticky top-0 z-10 flex items-center justify-center bg-white pt-4 pb-2">
              <div className="h-1 w-12 rounded-full bg-slate-300" />
              <button
                onClick={() => setShowEquipmentModal(false)}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 pb-8">
              {/* Header */}
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                  <ShieldCheck className="h-6 w-6 text-blue-600" strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Equipment & Supplies Checklist
                  </h2>
                  <p className="text-sm text-slate-600">
                    What's included
                  </p>
                </div>
              </div>

              {/* Checklist */}
              <ul className="space-y-4">
                {(formData?.equipment?.items || []).map((item, index) => (
                  <li key={index} className="flex items-start gap-4">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100">
                      <Check className="h-4 w-4 text-blue-600" strokeWidth={2.5} />
                    </div>
                    <span className="flex-1 text-base leading-relaxed text-slate-700">
                      {item}
                    </span>
                  </li>
                ))}
                {(!formData?.equipment?.items || formData.equipment.items.length === 0) && (
                  <li className="text-slate-500 italic">Equipment list loading...</li>
                )}
              </ul>
            </div>
          </div>
        </>
      )}

      <footer className="mt-20 text-center text-gray-400 text-sm">
          <p>© 2024 MagicPath Cleaning Services. All rights reserved.</p>
          <div className="flex items-center justify-center gap-6 mt-4 font-semibold uppercase tracking-widest text-[10px]">
            <a href="#" className="hover:text-blue-600">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-blue-600">
              Terms of Service
            </a>
            <a href="#" className="hover:text-blue-600">
              Contact Us
            </a>
          </div>
        </footer>
    </div>
  );
}

BookingFlow.displayName = 'BookingFlow';

// Export both as default and named for flexibility
export default BookingFlow;
export { BookingFlow };
