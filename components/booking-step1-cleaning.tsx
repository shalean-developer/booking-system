'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  ChevronDown,
  Minus,
  Plus,
  ArrowLeft,
  ArrowRight,
  MapPin,
  Home,
  Building2,
  Briefcase,
  Star,
  Sparkles,
  DoorOpen,
  Layers,
  AlertCircle,
  X,
  BedDouble,
  Bath,
  LayoutGrid,
  Users,
  Coffee,
  PhoneCall,
  Sofa,
  LampDesk,
  DoorOpen as StudioIcon,
} from 'lucide-react';

import type { BookingFormData, PricingMode } from './booking-system-types';
import type { PricingResult } from '@/lib/pricing-engine-v2';
import { BookingFlowStepIndicator } from '@/components/booking-flow-step-indicator';
import { BookingFlowLayout } from '@/components/booking/booking-flow-layout';
import { BookingSummary } from '@/components/booking/booking-summary';
import { SavingsMessage } from '@/components/booking/savings-message';
import { UpsellCard } from '@/components/UpsellCard';
import { getUpsellContent, getUpsellTrigger } from '@/lib/upsell-engine';
import { getBasicPlannedWizardPricing } from '@/shared/booking-engine/wizard-display-pricing';
import { nextTierBedroomsForUpsell } from '@/lib/quick-clean-pricing-v4';
import { calculateBookingUnified } from '@/lib/pricing/calculateBookingUnified';
import {
  DEFAULT_QUICK_CLEAN_SETTINGS,
  type QuickCleanSettings,
} from '@/lib/quick-clean-settings';
import { Tooltip } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { StickyCTA } from '@/components/booking/mobile/sticky-cta';

/** Short count-up for price / hours (200–300ms). */
function useCountUp(target: number, durationMs = 280) {
  const [display, setDisplay] = useState(target);
  const prevRef = useRef(target);
  useEffect(() => {
    const from = prevRef.current;
    if (Math.abs(from - target) < 0.0001) return;
    const t0 = performance.now();
    let raf: number;
    const ease = (t: number) => 1 - (1 - t) ** 2;
    const tick = (now: number) => {
      const u = ease(Math.min(1, (now - t0) / durationMs));
      setDisplay(from + (target - from) * u);
      if (u < 1) raf = requestAnimationFrame(tick);
      else {
        setDisplay(target);
        prevRef.current = target;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return display;
}

type ServiceId = 'standard' | 'deep' | 'airbnb' | 'moveinout' | 'carpet';
type StepPropertyType = 'apartment' | 'house' | 'studio' | 'office';

interface ServiceOption {
  id: ServiceId;
  label: string;
  tagline: string;
  bedroomPrice: number;
  bathroomPrice: number;
  extraRoomPrice: number;
  basePrice: number;
  boardroomPrice: number;
  privateOfficePrice: number;
  openAreaPrice: number;
  icon: React.ReactNode;
  color: string;
  selectedColor: string;
  borderSelected: string;
  bgSelected: string;
  accentBg: string;
}
interface AreaOption {
  label: string;
  suburb: string;
}
interface StepperRowConfig {
  id: string;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  accentClass: string;
}

/** Default illustrative rates when `pricing_config` is unavailable (aligned with `lib/pricing` PRICING fallback). */
const SERVICE_DEFAULTS: ServiceOption[] = [
  {
    id: 'standard',
    label: 'Standard Clean',
    tagline: 'Regular upkeep to keep your space fresh',
    basePrice: 60,
    bedroomPrice: 25,
    bathroomPrice: 20,
    extraRoomPrice: 15,
    boardroomPrice: 45,
    privateOfficePrice: 30,
    openAreaPrice: 35,
    icon: <Star className="w-5 h-5" />,
    color: 'text-blue-600',
    selectedColor: 'text-blue-700',
    borderSelected: 'border-blue-500',
    bgSelected: 'bg-blue-50',
    accentBg: 'bg-blue-600',
  },
  {
    id: 'deep',
    label: 'Deep Clean',
    tagline: 'Thorough scrub for a like-new result',
    basePrice: 90,
    bedroomPrice: 45,
    bathroomPrice: 40,
    extraRoomPrice: 30,
    boardroomPrice: 80,
    privateOfficePrice: 55,
    openAreaPrice: 65,
    icon: <Sparkles className="w-5 h-5" />,
    color: 'text-purple-600',
    selectedColor: 'text-purple-700',
    borderSelected: 'border-purple-500',
    bgSelected: 'bg-purple-50',
    accentBg: 'bg-purple-600',
  },
  {
    id: 'airbnb',
    label: 'Airbnb Clean',
    tagline: 'Fast turnover, guest-ready every time',
    basePrice: 70,
    bedroomPrice: 30,
    bathroomPrice: 25,
    extraRoomPrice: 18,
    boardroomPrice: 50,
    privateOfficePrice: 35,
    openAreaPrice: 40,
    icon: <Home className="w-5 h-5" />,
    color: 'text-rose-600',
    selectedColor: 'text-rose-700',
    borderSelected: 'border-rose-500',
    bgSelected: 'bg-rose-50',
    accentBg: 'bg-rose-600',
  },
  {
    id: 'moveinout',
    label: 'Move In/Out',
    tagline: 'Spotless handover for bonds & new starts',
    basePrice: 100,
    bedroomPrice: 55,
    bathroomPrice: 50,
    extraRoomPrice: 35,
    boardroomPrice: 90,
    privateOfficePrice: 65,
    openAreaPrice: 75,
    icon: <DoorOpen className="w-5 h-5" />,
    color: 'text-amber-600',
    selectedColor: 'text-amber-700',
    borderSelected: 'border-amber-500',
    bgSelected: 'bg-amber-50',
    accentBg: 'bg-amber-600',
  },
  {
    id: 'carpet',
    label: 'Carpet Cleaning',
    tagline: 'Steam-clean carpets back to perfection',
    basePrice: 0,
    bedroomPrice: 55,
    bathroomPrice: 35,
    extraRoomPrice: 0,
    boardroomPrice: 0,
    privateOfficePrice: 0,
    openAreaPrice: 0,
    icon: <Layers className="w-5 h-5" />,
    color: 'text-teal-600',
    selectedColor: 'text-teal-700',
    borderSelected: 'border-teal-500',
    bgSelected: 'bg-teal-50',
    accentBg: 'bg-teal-600',
  },
];

const SERVICE_ID_TO_API_TYPE: Record<ServiceId, string> = {
  standard: 'Standard',
  deep: 'Deep',
  airbnb: 'Airbnb',
  moveinout: 'Move In/Out',
  carpet: 'Carpet',
};

function mergeServicesWithPricing(
  pricing: Record<string, { base: number; bedroom: number; bathroom: number; extraRoom: number }> | null | undefined
): ServiceOption[] {
  return SERVICE_DEFAULTS.map((template) => {
    const apiKey = SERVICE_ID_TO_API_TYPE[template.id];
    const p = pricing?.[apiKey];
    if (!p) return { ...template };

    if (template.id === 'carpet') {
      return {
        ...template,
        basePrice: p.base,
        bedroomPrice: p.bedroom,
        bathroomPrice: p.bathroom,
        extraRoomPrice: 0,
      };
    }

    const factor = template.basePrice > 0 ? p.base / template.basePrice : 1;
    return {
      ...template,
      basePrice: p.base,
      bedroomPrice: p.bedroom,
      bathroomPrice: p.bathroom,
      extraRoomPrice: p.extraRoom > 0 ? p.extraRoom : p.bedroom,
      boardroomPrice: Math.round(template.boardroomPrice * factor),
      privateOfficePrice: Math.round(template.privateOfficePrice * factor),
      openAreaPrice: Math.round(template.openAreaPrice * factor),
    };
  });
}
const PROPERTY_TYPES: { id: StepPropertyType; label: string; icon: React.ReactNode }[] = [
  { id: 'apartment', label: 'Apartment', icon: <Building2 className="w-4 h-4" /> },
  { id: 'house', label: 'House', icon: <Home className="w-4 h-4" /> },
  { id: 'studio', label: 'Studio', icon: <StudioIcon className="w-4 h-4" /> },
  { id: 'office', label: 'Office', icon: <Briefcase className="w-4 h-4" /> },
];
/** Suburbs should match entries in cleaner `areas` in Supabase; `/api/cleaners/available` unions suburb+city and sorts by rating/reliability. */
const STEP1_LOCATION_OPTIONS = [
  'House Cleaning Amandelrug',
  'House Cleaning Athlone',
  'House Cleaning Bantry Bay',
  'House Cleaning Belhar',
  'House Cleaning Bellville',
  'House Cleaning Bellville South',
  'House Cleaning Bergvliet',
  'House Cleaning Bishopscourt',
  'House Cleaning Bloubergrant',
  'House Cleaning Bloubergstrand',
  'House Cleaning Bo-Kaap',
  'House Cleaning Bothasig',
  'House Cleaning Brackenfell',
  'House Cleaning Brooklyn',
  'House Cleaning Camps Bay',
  'House Cleaning Cape gate',
  'House Cleaning Cape Town',
  'House Cleaning Century City',
  'House Cleaning Chempet',
  'House Cleaning City Bowl',
  'House Cleaning Clareinch',
  'House Cleaning Claremont',
  'House Cleaning Clifton',
  'House Cleaning Clovelly',
  'House Cleaning Constantia',
  'House Cleaning Crawford',
  "House Cleaning D'urbanvale",
  'House Cleaning De Waterkant',
  "House Cleaning Devil's Peak Estate",
  'House Cleaning Diep River',
  'House Cleaning Durbanville',
  'House Cleaning Edgemead',
  'House Cleaning Epping',
  'House Cleaning Faure',
  'House Cleaning Firgrove',
  'House Cleaning Fish Hoek',
  'House Cleaning Foreshore',
  'House Cleaning Fresnaye',
  'House Cleaning Gardens',
  'House Cleaning Glencairn',
  'George',
  'House Cleaning Glosderry',
  'House Cleaning Goodwood',
  'House Cleaning Green Point',
  'House Cleaning Groote Schuur',
  'House Cleaning Harfield Village',
  'House Cleaning Heathfield',
  'House Cleaning Helderberg',
  'Hermanus',
  'House Cleaning Higgovale',
  'House Cleaning Hout Bay',
  'House Cleaning Howard Place',
  'House Cleaning Kalk Bay',
  'House Cleaning Kenilworth',
  'House Cleaning Kensington',
  'House Cleaning Kenwyn',
  'House Cleaning Kirstenhof',
  'House Cleaning Kommetjie',
  'Knysna',
  'House Cleaning Kraaifontein',
  'House Cleaning Kreupelbosch',
  'House Cleaning Kuils River',
  'Langebaan',
  'House Cleaning Lansdowne',
  'House Cleaning Llandudno',
  'House Cleaning Lower Vrede',
  'House Cleaning Macassar',
  'House Cleaning Maitland',
  'House Cleaning Marconi Beam',
  'House Cleaning Meadowridge',
  'House Cleaning Milnerton',
  'House Cleaning Monte Vista',
  'Mossel Bay',
  'House Cleaning Mouille Point',
  'House Cleaning Mowbray',
  'House Cleaning Mutual Park',
  'House Cleaning Newlands',
  'House Cleaning Noordhoek',
  'House Cleaning Observatory',
  'House Cleaning Old Oak',
  'House Cleaning Oranjezicht',
  'House Cleaning Ottery',
  'Oudshoorn',
  'House Cleaning Paarden Island',
  'House Cleaning Paarl',
  'House Cleaning Panorama',
  'House Cleaning Parow',
  'House Cleaning Parow East',
  'House Cleaning Pinelands',
  'House Cleaning Plattekloof',
  'Plettenberg Bay',
  'House Cleaning Plumstead',
  'House Cleaning Ravensmead',
  'House Cleaning Retreat',
  'House Cleaning Rhodes',
  'House Cleaning Rondebosch',
  'House Cleaning Rondebosch East',
  'House Cleaning Salt River',
  'House Cleaning Scarborough',
  'House Cleaning Schotse Kloof',
  'House Cleaning Sea Point',
  "House Cleaning Simon's Town",
  'House Cleaning Southfield',
  'House Cleaning St James',
  'House Cleaning Steenberg',
  'House Cleaning Stellenbosch',
  'House Cleaning Sun Valley',
  'House Cleaning Sunnyside',
  'House Cleaning Sunset Beach',
  'House Cleaning Tableview',
  'House Cleaning Tamboerskloof',
  'House Cleaning Thornton',
  'House Cleaning Three Anchor Bay',
  'House Cleaning Tokai',
  'House Cleaning Tyger Valley',
  'House Cleaning Tygerberg',
  'House Cleaning University Estate',
  'House Cleaning Van Riebeeckshof',
  'House Cleaning Vredehoek',
  'House Cleaning Walmer Estate',
  'House Cleaning Waterfront',
  'House Cleaning Welgemoed',
  'House Cleaning West Beach',
  'House Cleaning Wetton',
  'House Cleaning Wittebome',
  'House Cleaning Woodstock',
  'Worcester',
  'House Cleaning Wynberg',
  'House Cleaning Ysterplaat',
  'House Cleaning Zonnebloem',
] as const;

const AREAS: AreaOption[] = Array.from(
  new Set(
    STEP1_LOCATION_OPTIONS.map((entry) =>
      entry.replace(/^House Cleaning\s+/i, '').trim()
    ).filter(Boolean)
  )
)
  .map((name) => ({ label: name, suburb: name }))
  .sort((a, b) => a.label.localeCompare(b.label, 'en-ZA'));
const EXTRA_CLEANER_PRICE = 40;
const OFFICE_BATHROOM_PRICE = 25;
const OFFICE_KITCHEN_PRICE = 40;
const OFFICE_RECEPTION_PRICE = 30;
const DURATION_MAP: Record<ServiceId, string> = {
  standard: '~2 hrs',
  deep: '~4 hrs',
  airbnb: '~2.5 hrs',
  moveinout: '~5 hrs',
  carpet: '~1 hr',
};

function serviceToStepId(service: BookingFormData['service']): ServiceId | null {
  if (service === 'move') return 'moveinout';
  if (service === 'standard' || service === 'deep' || service === 'airbnb' || service === 'carpet') return service;
  return null;
}
function stepIdToService(id: ServiceId): BookingFormData['service'] {
  return id === 'moveinout' ? 'move' : id;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
  }).format(price);

const calcResidentialPrice = (
  service: ServiceOption,
  bedrooms: number,
  bathrooms: number,
  extraRooms: number
): number =>
  service.basePrice +
  bedrooms * service.bedroomPrice +
  bathrooms * service.bathroomPrice +
  extraRooms * service.extraRoomPrice;

const calcOfficePrice = (
  service: ServiceOption,
  boardrooms: number,
  privateOffices: number,
  openAreas: number,
  officeBathrooms: number,
  kitchens: number,
  hasReception: boolean,
  officeExtras: { bath: number; kitchen: number; reception: number }
): number =>
  service.basePrice +
  boardrooms * service.boardroomPrice +
  privateOffices * service.privateOfficePrice +
  openAreas * service.openAreaPrice +
  officeBathrooms * officeExtras.bath +
  kitchens * officeExtras.kitchen +
  (hasReception ? officeExtras.reception : 0);

const calcCarpetPrice = (
  rooms: number,
  rugs: number,
  extra: boolean,
  pricePerRoom: number,
  pricePerRug: number,
  extraCleanerZar: number
): number => rooms * pricePerRoom + rugs * pricePerRug + (extra ? extraCleanerZar : 0);

const calcDuration = (serviceId: ServiceId | null, carpetRooms: number): string => {
  if (!serviceId) return '—';
  if (serviceId === 'carpet') {
    const hrs = Math.max(1, carpetRooms) * 0.75;
    return `~${hrs.toFixed(1)} hrs`;
  }
  return DURATION_MAP[serviceId];
};

const Stepper = ({
  label,
  sublabel,
  icon,
  value,
  onChange,
  min,
  max,
  accentClass,
  variant = 'inline',
  /** `variant="card"` only: one row (icon+label | stepper) at every breakpoint — matches Basic Clean / reference row. */
  cardSingleRow = false,
}: {
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  accentClass?: string;
  variant?: 'inline' | 'card';
  cardSingleRow?: boolean;
}) => {
  const btnSize =
    variant === 'card' ? 'h-10 w-10 min-h-10 min-w-10' : 'min-h-10 min-w-10 h-10 w-10';
  const iconSize = 'w-4 h-4';
  const compactCard = variant === 'card' && cardSingleRow;

  const decrease = (
    <motion.button
      type="button"
      whileTap={{ scale: 0.88 }}
      onClick={() => onChange(Math.max(min, value - 1))}
      disabled={value <= min}
      className={cn(
        btnSize,
        'shrink-0 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed active:bg-gray-100 transition-colors touch-manipulation'
      )}
      aria-label={`Decrease ${label}`}
    >
      <Minus className={iconSize} aria-hidden />
    </motion.button>
  );

  const increase = (
    <motion.button
      type="button"
      whileTap={{ scale: 0.88 }}
      onClick={() => onChange(Math.min(max, value + 1))}
      disabled={value >= max}
      className={cn(
        btnSize,
        'shrink-0 rounded-full border-2 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors touch-manipulation',
        accentClass || 'border-violet-500 bg-violet-50 text-violet-600 active:bg-violet-100'
      )}
      aria-label={`Increase ${label}`}
    >
      <Plus className={iconSize} aria-hidden />
    </motion.button>
  );

  const valueDisplay = (
    <motion.span
      key={value}
      initial={{ scale: 1.25, opacity: 0.6 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        'text-center font-bold text-gray-900 tabular-nums',
        variant === 'card'
          ? compactCard
            ? 'min-w-[2.75rem] px-0.5 text-base'
            : 'min-w-[2.75rem] text-base max-lg:px-0.5 lg:min-w-[2.5rem] lg:flex-1'
          : 'w-7 text-base'
      )}
      aria-live="polite"
      aria-atomic="true"
    >
      {value}
    </motion.span>
  );

  if (variant === 'card') {
    return (
      <div
        role="group"
        aria-label={label}
        className={cn(
          'w-full min-w-0 rounded-xl border border-gray-100 bg-white shadow-sm',
          compactCard
            ? 'flex flex-row items-center justify-between gap-3 px-3 py-3'
            : [
                'max-lg:flex max-lg:flex-row max-lg:items-center max-lg:justify-between max-lg:gap-3 max-lg:px-3 max-lg:py-3',
                'lg:flex lg:flex-col lg:gap-3 lg:p-4',
              ]
        )}
      >
        <div
          className={cn(
            'flex min-w-0 items-center gap-2',
            compactCard ? 'min-w-0 flex-1' : 'max-lg:min-w-0 max-lg:flex-1 lg:items-start'
          )}
        >
          {icon && (
            <div
              className={cn(
                'shrink-0 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500',
                compactCard
                  ? 'h-8 w-8 [&>svg]:h-4 [&>svg]:w-4'
                  : 'h-7 w-7 max-lg:[&>svg]:h-3.5 max-lg:[&>svg]:w-3.5 lg:h-8 lg:w-8 lg:[&>svg]:h-5 lg:[&>svg]:w-5'
              )}
            >
              {icon}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                'text-sm leading-tight text-gray-800',
                compactCard ? 'font-semibold' : 'font-medium'
              )}
            >
              {label}
            </p>
            {sublabel && (
              <p
                className={cn(
                  'mt-0.5 text-xs leading-snug text-gray-500',
                  compactCard ? '' : 'max-lg:line-clamp-2 lg:text-sm'
                )}
              >
                {sublabel}
              </p>
            )}
          </div>
        </div>
        <div
          className={cn(
            'flex shrink-0 items-center',
            compactCard ? 'gap-3' : 'justify-end max-lg:gap-3 lg:w-full lg:justify-between lg:gap-3'
          )}
        >
          {decrease}
          {valueDisplay}
          {increase}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between py-3.5 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-2.5 min-w-0">
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 flex-shrink-0">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-800">{label}</p>
          {sublabel && <p className="text-xs text-gray-400 mt-0.5">{sublabel}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {decrease}
        {valueDisplay}
        {increase}
      </div>
    </div>
  );
};

const ToggleRow = ({
  label,
  sublabel,
  icon,
  value,
  onChange,
  activeColor,
}: {
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
  value: boolean;
  onChange: (v: boolean) => void;
  activeColor?: string;
}) => (
  <div className="flex items-center justify-between py-3.5 border-b border-gray-100 last:border-0">
    <div className="flex items-center gap-2.5">
      {icon && (
        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 flex-shrink-0">
          {icon}
        </div>
      )}
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {sublabel && <p className="text-xs text-gray-400 mt-0.5">{sublabel}</p>}
      </div>
    </div>
    <motion.button
      type="button"
      whileTap={{ scale: 0.92 }}
      onClick={() => onChange(!value)}
      className={[
        'relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none flex-shrink-0',
        value ? activeColor || 'bg-violet-500' : 'bg-gray-300',
      ].join(' ')}
      aria-pressed={value}
      role="switch"
      aria-label={label}
    >
      <motion.span
        layout
        className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md"
        animate={{ left: value ? 'calc(100% - 22px)' : '2px' }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      />
    </motion.button>
  </div>
);

const AreaDropdown = ({
  value,
  onSelect,
  error,
}: {
  value: string;
  onSelect: (v: string) => void;
  error: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(value);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const dropRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const areaSearchHintId = useId();
  const areaListboxId = useId();
  useEffect(() => {
    setSearch(value);
  }, [value]);

  const updateDropdownPosition = useCallback(() => {
    if (!wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const maxHeight = Math.min(220, spaceBelow - 8);
    setDropdownStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
      maxHeight: Math.max(maxHeight, 120),
    });
  }, []);
  useEffect(() => {
    if (open) {
      updateDropdownPosition();
    }
  }, [open, updateDropdownPosition]);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const clickedInsideWrapper = wrapperRef.current?.contains(target);
      const clickedInsideDrop = dropRef.current?.contains(target);
      if (!clickedInsideWrapper && !clickedInsideDrop) {
        setOpen(false);
      }
    };
    const scrollHandler = () => {
      if (open) updateDropdownPosition();
    };
    document.addEventListener('mousedown', handler);
    window.addEventListener('scroll', scrollHandler, true);
    window.addEventListener('resize', scrollHandler);
    return () => {
      document.removeEventListener('mousedown', handler);
      window.removeEventListener('scroll', scrollHandler, true);
      window.removeEventListener('resize', scrollHandler);
    };
  }, [open, updateDropdownPosition]);
  const filtered = AREAS.filter((a) => a.label.toLowerCase().includes(search.toLowerCase()));
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setOpen(true);
    if (!e.target.value) onSelect('');
  };
  const handleSelect = (label: string) => {
    setSearch(label);
    onSelect(label);
    setOpen(false);
  };
  const handleClear = () => {
    setSearch('');
    onSelect('');
    inputRef.current?.focus();
    setOpen(true);
  };
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
      text.slice(0, idx) + '\u0000' + text.slice(idx, idx + query.length) + '\u0001' + text.slice(idx + query.length)
    );
  };
  return (
    <div ref={wrapperRef} className="relative">
      <span id={areaSearchHintId} className="sr-only">
        Start typing to filter areas. Choose a match from the list.
      </span>
      <div
        role="search"
        className={[
          'flex items-center gap-2 w-full px-4 py-3 rounded-xl border-2 bg-white transition-all duration-150 cursor-text',
          open ? 'border-violet-500 ring-2 ring-violet-100' : error ? 'border-red-400' : 'border-gray-200',
        ].join(' ')}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('button')) return;
          inputRef.current?.focus();
          setOpen(true);
          updateDropdownPosition();
        }}
      >
        <MapPin
          className={['w-4 h-4 flex-shrink-0 pointer-events-none transition-colors', open ? 'text-violet-500' : 'text-gray-400'].join(
            ' '
          )}
          aria-hidden
        />
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={handleInputChange}
          onFocus={() => {
            setOpen(true);
            updateDropdownPosition();
          }}
          placeholder="Type to search your suburb or area"
          className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-500 outline-none min-w-0"
          aria-label="Search location by suburb or area"
          aria-describedby={areaSearchHintId}
          aria-expanded={open}
          aria-controls={open ? areaListboxId : undefined}
          aria-autocomplete="list"
          role="combobox"
          autoComplete="off"
        />
        {search && (
          <button
            type="button"
            onClick={handleClear}
            className="text-gray-400 hover:text-gray-600 p-0.5 flex-shrink-0"
            aria-label="Clear location"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <ChevronDown
          className={['w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0', open ? 'rotate-180' : ''].join(
            ' '
          )}
        />
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={dropRef}
            id={areaListboxId}
            key="dropdown"
            initial={{ opacity: 0, y: -6, scaleY: 0.95 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -4, scaleY: 0.95 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            style={{
              ...dropdownStyle,
              transformOrigin: 'top',
            }}
            className="overflow-y-auto bg-white rounded-xl border border-gray-200 shadow-2xl shadow-black/10"
            role="listbox"
          >
            {filtered.length > 0 ? (
              filtered.map((area) => {
                const highlighted = highlightMatch(area.label, search);
                const parts = highlighted.split(/\u0000|\u0001/);
                const isMatch = highlighted.includes('\u0000');
                return (
                  <button
                    key={area.suburb}
                    type="button"
                    onClick={() => handleSelect(area.label)}
                    className={[
                      'w-full text-left px-4 py-3 text-sm transition-colors flex items-center gap-2.5',
                      value === area.label ? 'bg-violet-50 text-violet-700 font-medium' : 'text-gray-700 hover:bg-gray-50',
                    ].join(' ')}
                    role="option"
                    aria-selected={value === area.label}
                  >
                    <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    {isMatch ? (
                      <span>
                        {parts.map((part, i) => (
                          <span key={`${area.suburb}-part-${i}`} className={i === 1 ? 'font-semibold text-violet-600' : ''}>
                            {part}
                          </span>
                        ))}
                      </span>
                    ) : (
                      <span>{area.label}</span>
                    )}
                    {value === area.label && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-violet-500 ml-auto flex-shrink-0" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-4 text-center">
                <MapPin className="w-5 h-5 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500 font-medium">No areas found</p>
                {search.length > 0 && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    <span>No results for &quot;</span>
                    <span className="font-medium">{search}</span>
                    <span>&quot;</span>
                  </p>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export interface BookingStep1CleaningProps {
  data: BookingFormData;
  setData: React.Dispatch<React.SetStateAction<BookingFormData>>;
  onContinue: () => void;
  /** Leave booking (step 1 has no previous step in the flow) */
  onBack?: () => void;
  /** Live total from API-backed pricing (ZAR) */
  liveTotalZar: number;
  durationLabel: string;
  /** When set, sidebar line items come from `pricing_config` (not illustrative constants) */
  dbPricingRows?: { id: string; label: string; value: number }[];
  /** From `/api/booking/form-data` — replaces hardcoded service card and stepper amounts */
  servicePricing?: Record<string, { base: number; bedroom: number; bathroom: number; extraRoom: number }> | null;
  /** DB extra price for carpet “extra cleaner”, when configured */
  extraCleanerPriceZar?: number;
  /** Present when live pricing uses the cost-plus engine — for breakdown footnotes only. */
  engineMeta?: {
    estimatedHours?: number;
    hoursPerCleaner: number;
    marginRateBoostApplied: number;
    teamSize?: number;
    estimatedJobHours?: number;
  } | null;
  /** Shown under the total explainer (duration / team). */
  pricingContext?: { estimatedJobHours?: number; teamSize?: number } | null;
  /** Right-rail copy + breakdown density */
  summaryTone?: 'basic' | 'premium';
  /** V2 pricing snapshot (minimum tier, fees) — basic uses accurate `isMinimumApplied`. */
  pricingV2?: PricingResult | null;
  /** Server Quick Clean V4 config (hourly rate, extra time slice, caps). */
  quickCleanSettings?: QuickCleanSettings;
  /** Indicates Step 1 total uses earliest available-slot backend pricing. */
  earliestSlotPriceHint?: boolean;
}

export function BookingStep1Cleaning({
  data,
  setData,
  onContinue,
  onBack,
  liveTotalZar,
  durationLabel,
  dbPricingRows,
  servicePricing,
  extraCleanerPriceZar,
  engineMeta = null,
  pricingContext = null,
  summaryTone = 'premium',
  pricingV2 = null,
  quickCleanSettings,
  earliestSlotPriceHint = false,
}: BookingStep1CleaningProps) {
  const selectedService = serviceToStepId(data.service);
  const propertyType = data.propertyType as StepPropertyType;
  const location = data.workingArea;

  const bedrooms = data.bedrooms;
  const bathrooms = data.bathrooms;
  const extraRooms = data.extraRooms;

  const boardrooms = data.officeBoardrooms ?? 1;
  const privateOffices = data.officePrivateOffices ?? 1;
  const openAreas = data.officeOpenAreas ?? 1;
  const officeBathrooms = data.officeBathrooms ?? 1;
  const kitchens = data.officeKitchens ?? 1;
  const hasReception = data.officeHasReception ?? false;

  const carpetRooms = data.carpetRooms ?? 1;
  const carpetRugs = data.carpetRugs ?? 0;
  const extraCleaner = data.carpetExtraCleaner ?? false;

  const [attempted, setAttempted] = useState(false);
  const [timeOnPage, setTimeOnPage] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeOnPage((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isCarpet = selectedService === 'carpet';
  const isOffice = propertyType === 'office';
  const isStudio = propertyType === 'studio';

  const servicesResolved = useMemo(() => mergeServicesWithPricing(servicePricing), [servicePricing]);

  const selectedServiceData = selectedService
    ? servicesResolved.find((s) => s.id === selectedService)
    : null;

  const extraCleanerUnitZar = extraCleanerPriceZar ?? EXTRA_CLEANER_PRICE;

  const officeFactor =
    selectedServiceData && selectedService && !isCarpet
      ? (() => {
          const tmpl = SERVICE_DEFAULTS.find((s) => s.id === selectedService);
          if (!tmpl || tmpl.basePrice <= 0) return 1;
          return selectedServiceData.basePrice / tmpl.basePrice;
        })()
      : 1;
  const scaledOfficeBathroom = Math.round(OFFICE_BATHROOM_PRICE * officeFactor);
  const scaledOfficeKitchen = Math.round(OFFICE_KITCHEN_PRICE * officeFactor);
  const scaledOfficeReception = Math.round(OFFICE_RECEPTION_PRICE * officeFactor);

  const effectiveBedrooms = isStudio ? 0 : bedrooms;
  const effectiveBathrooms = isStudio ? Math.max(1, bathrooms) : bathrooms;

  const illustrativePrice = (() => {
    if (!selectedServiceData) return 0;
    if (isCarpet)
      return calcCarpetPrice(
        carpetRooms,
        carpetRugs,
        extraCleaner,
        selectedServiceData.bedroomPrice,
        selectedServiceData.bathroomPrice,
        extraCleanerUnitZar
      );
    if (isOffice)
      return calcOfficePrice(
        selectedServiceData,
        boardrooms,
        privateOffices,
        openAreas,
        officeBathrooms,
        kitchens,
        hasReception,
        {
          bath: scaledOfficeBathroom,
          kitchen: scaledOfficeKitchen,
          reception: scaledOfficeReception,
        }
      );
    return calcResidentialPrice(selectedServiceData, effectiveBedrooms, effectiveBathrooms, extraRooms);
  })();

  /** Quick Clean V4: tier base hours + extras — not catalog illustrative ZAR. */
  const basicWizardPricing = useMemo(
    () => getBasicPlannedWizardPricing(data, quickCleanSettings),
    [
      data.service,
      data.bedrooms,
      data.bathrooms,
      data.extraRooms,
      data.tipAmount,
      data.promoCode,
      data.pricingMode,
      data.scheduleEquipmentPref,
      data.extras,
      data.extrasQuantities,
      quickCleanSettings,
    ]
  );

  const quickCleanPreview = useMemo(() => {
    if (data.pricingMode !== 'basic') return null;
    if (data.service !== 'standard' && data.service !== 'airbnb') return null;
    const uni = calculateBookingUnified({
      service_type: data.service === 'standard' ? 'standard' : 'airbnb',
      pricing_mode: 'quick',
      bedrooms: Math.max(1, data.bedrooms),
      bathrooms: Math.max(0, data.bathrooms ?? 0),
      extra_rooms: Math.max(0, data.extraRooms ?? 0),
      extras: data.extras ?? [],
      extrasQuantities: data.extrasQuantities,
      has_extra_cleaner: false,
    });
    return {
      totalHours: uni.hours,
      finalPriceZar: uni.final_price_zar,
      extrasCapped: false,
    };
  }, [
    data.pricingMode,
    data.service,
    data.bedrooms,
    data.bathrooms,
    data.extraRooms,
    data.extras,
    data.extrasQuantities,
  ]);

  const v4Upsell = useMemo(() => {
    if (data.pricingMode !== 'basic') return null;
    if (data.service !== 'standard' && data.service !== 'airbnb') return null;
    const uni = calculateBookingUnified({
      service_type: data.service === 'standard' ? 'standard' : 'airbnb',
      pricing_mode: 'quick',
      bedrooms: Math.max(1, data.bedrooms),
      bathrooms: Math.max(0, data.bathrooms ?? 0),
      extra_rooms: Math.max(0, data.extraRooms ?? 0),
      extras: data.extras ?? [],
      extrasQuantities: data.extrasQuantities,
      has_extra_cleaner: false,
    });
    const nextB = nextTierBedroomsForUpsell(data.bedrooms);
    if (nextB === null) return null;
    const nextUni = calculateBookingUnified({
      service_type: data.service === 'standard' ? 'standard' : 'airbnb',
      pricing_mode: 'quick',
      bedrooms: Math.max(1, nextB),
      bathrooms: Math.max(0, data.bathrooms ?? 0),
      extra_rooms: Math.max(0, data.extraRooms ?? 0),
      extras: data.extras ?? [],
      extrasQuantities: data.extrasQuantities,
      has_extra_cleaner: false,
    });
    const gapZar = nextUni.final_price_zar - uni.final_price_zar;
    const PRICE_CONVERGENCE_ZAR = 40;
    if (gapZar > 0 && gapZar <= PRICE_CONVERGENCE_ZAR) {
      return {
        type: 'price_close' as const,
        message: `Upgrade for just R${Math.round(gapZar)} more`,
        gapZar,
        nextBedrooms: nextB,
      };
    }
    return null;
  }, [
    data.pricingMode,
    data.service,
    data.bedrooms,
    data.bathrooms,
    data.extraRooms,
    data.extras,
    data.extrasQuantities,
  ]);

  const estimatedHoursBasic = quickCleanPreview?.totalHours ?? data.basicPlannedHours ?? 0;
  const qcHoursVal = quickCleanPreview?.totalHours ?? 0;
  const qcPriceVal = quickCleanPreview?.finalPriceZar ?? 0;

  /** Premium card: visual emphasis only (does not change selection). */
  const suggestPremiumVisual =
    data.pricingMode === 'basic' && (bedrooms >= 4 || estimatedHoursBasic >= 4.5);
  /** Big job upsell: larger homes or long basic job */
  const showBigJobPremiumUpsell =
    data.pricingMode === 'basic' && (bedrooms >= 4 || estimatedHoursBasic >= 4.5);
  /** Softer copy tier for Premium nudge (3–4 beds vs 5+). */
  const premiumNudgeStrength = bedrooms >= 5 ? 'strong' : bedrooms >= 3 ? 'soft' : 'none';

  const [premiumCue, setPremiumCue] = useState(false);
  useEffect(() => {
    if (!suggestPremiumVisual || data.pricingMode !== 'basic') {
      setPremiumCue(false);
      return;
    }
    const id = window.setTimeout(() => setPremiumCue(true), 2600);
    return () => window.clearTimeout(id);
  }, [suggestPremiumVisual, data.pricingMode]);

  /** When true: “Only a few slots left today” — wire from availability RPC / demand signal */
  const highDemandSlots = false;
  /** When true and `areaShortLabel` is set: “Fills up fast in {area}” — wire from surge / area demand */
  const showAreaDemandUrgency = false;
  /** When true: “Popular in {area} today” */
  const popularInAreaToday = false;
  const areaShortLabel = location?.split(',')[0]?.trim() || location?.trim() || '';

  const basicStartZar = Math.max(
    199,
    Math.round(quickCleanSettings?.minCalloutPrice ?? DEFAULT_QUICK_CLEAN_SETTINGS.minCalloutPrice)
  );

  const displayTotal =
    basicWizardPricing != null
      ? basicWizardPricing.total
      : liveTotalZar > 0
        ? liveTotalZar
        : illustrativePrice;

  const animatedDisplayTotal = useCountUp(displayTotal);

  const effectiveDbPricingRows = basicWizardPricing?.dbPricingRows ?? dbPricingRows;
  const effectivePricingV2 = basicWizardPricing?.v2Breakdown ?? pricingV2;
  const effectiveEngineMeta = basicWizardPricing?.engineMeta ?? engineMeta;

  const effectivePricingContext =
    basicWizardPricing?.engineMeta != null
      ? {
          estimatedJobHours:
            basicWizardPricing.engineMeta.estimatedHours ??
            basicWizardPricing.engineMeta.estimatedJobHours,
          teamSize: basicWizardPricing.engineMeta.teamSize,
        }
      : pricingContext;

  const useDbBreakdown = Boolean(
    effectiveDbPricingRows && effectiveDbPricingRows.length > 0
  );
  const duration = durationLabel || calcDuration(selectedService, carpetRooms);

  const isPremiumMode = data.pricingMode === 'premium';
  const serviceError = attempted && isPremiumMode && !selectedService;
  const locationError = attempted && !location;
  const propertyTypeError = attempted && isPremiumMode && !propertyType;
    const maxBasicH = 9;
  const isValid =
    !!location?.trim() &&
    (data.pricingMode === 'basic'
      ? data.basicPlannedHours != null &&
        data.basicPlannedHours >= 2 &&
        data.basicPlannedHours <= maxBasicH
      : !!(selectedService && propertyType));

  const patch = useCallback(
    (partial: Partial<BookingFormData>) => {
      setData((prev) => ({ ...prev, ...partial }));
    },
    [setData]
  );

  const selectExperience = useCallback(
    (mode: PricingMode) => {
      if (mode === 'basic') {
        patch({
          pricingMode: 'basic',
          service: 'standard',
          extras: [],
          extrasQuantities: {},
          basicPlannedHours: data.basicPlannedHours ?? 3,
          propertyType: 'apartment',
          scheduleEquipmentPref: 'own',
          numberOfCleaners: 1,
          teamSizeUserOverride: false,
        });
      } else {
        patch({
          pricingMode: 'premium',
          basicPlannedHours: null,
        });
      }
    },
    [patch, data.basicPlannedHours]
  );

  const upsellContent = useMemo(() => {
    if (data.pricingMode !== 'basic') return null;
    if (v4Upsell?.type === 'price_close') {
      return {
        title: 'Need more time?',
        body: `+R${Math.round(v4Upsell.gapZar)} for next size`,
        cta: 'Get more time →',
      };
    }
    if (v4Upsell?.type === 'limit_hit') {
      return {
        title: '6h limit',
        body: 'Remove an add-on or go Premium.',
        cta: 'See options →',
      };
    }
    if (v4Upsell?.type === 'premium') {
      return {
        title: 'Bigger clean?',
        body: v4Upsell.message,
        cta: 'Premium →',
      };
    }
    const trigger = getUpsellTrigger({
      hours: quickCleanPreview?.totalHours ?? data.basicPlannedHours ?? 0,
      isMinimumApplied: false,
      timeOnPage,
    });
    return trigger ? getUpsellContent(trigger) : null;
  }, [
    data.pricingMode,
    data.basicPlannedHours,
    quickCleanPreview?.totalHours,
    timeOnPage,
    v4Upsell,
  ]);

  const handleUpsellUpgrade = useCallback(() => {
    if (v4Upsell?.type === 'price_close' || v4Upsell?.type === 'limit_hit') {
      patch({ bedrooms: v4Upsell.nextBedrooms });
    } else {
      selectExperience('premium');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectExperience, v4Upsell, patch]);

  const handleServiceSelect = useCallback(
    (id: ServiceId) => {
      const svc = stepIdToService(id);
      patch({
        service: svc,
        ...(id !== 'standard' && id !== 'airbnb' ? { pricingMode: 'premium' as PricingMode } : {}),
      });
    },
    [patch]
  );

  const handlePropertyTypeSelect = useCallback(
    (pt: StepPropertyType) => {
      if (pt === 'studio') {
        patch({
          propertyType: pt,
          officeSize: '',
          bedrooms: 0,
          bathrooms: Math.max(1, data.bathrooms),
        });
      } else if (pt === 'office') {
        patch({
          propertyType: pt,
          officeSize: data.officeSize || 'Medium (100-250m²)',
        });
      } else {
        patch({
          propertyType: pt,
          officeSize: '',
          bedrooms: data.bedrooms < 1 ? 1 : data.bedrooms,
        });
      }
    },
    [patch, data.officeSize, data.bathrooms, data.bedrooms]
  );

  const handleContinue = () => {
    setAttempted(true);
    if (!isValid) return;
    onContinue();
  };

  const studioSteppers: StepperRowConfig[] = [
    {
      id: 'bathrooms',
      label: 'Bathrooms',
      sublabel: '',
      icon: <Bath className="w-4 h-4" />,
      value: effectiveBathrooms,
      onChange: (v) => patch({ bathrooms: v }),
      min: 1,
      max: 4,
      accentClass: 'border-violet-500 bg-violet-50 text-violet-600 active:bg-violet-100',
    },
    {
      id: 'extraRooms',
      label: 'Extra rooms',
      sublabel: '',
      icon: <LayoutGrid className="w-4 h-4" />,
      value: extraRooms,
      onChange: (v) => patch({ extraRooms: v }),
      min: 0,
      max: 10,
      accentClass: 'border-violet-500 bg-violet-50 text-violet-600 active:bg-violet-100',
    },
  ];

  const residentialSteppers: StepperRowConfig[] = [
    {
      id: 'bedrooms',
      label: 'Rooms',
      sublabel: '',
      icon: <BedDouble className="w-4 h-4" />,
      value: bedrooms,
      onChange: (v) => patch({ bedrooms: v }),
      min: 0,
      max: 10,
      accentClass: 'border-violet-500 bg-violet-50 text-violet-600 active:bg-violet-100',
    },
    {
      id: 'bathrooms',
      label: 'Bathrooms',
      sublabel: '',
      icon: <Bath className="w-4 h-4" />,
      value: bathrooms,
      onChange: (v) => patch({ bathrooms: v }),
      min: 0,
      max: 8,
      accentClass: 'border-violet-500 bg-violet-50 text-violet-600 active:bg-violet-100',
    },
    {
      id: 'extraRooms',
      label: 'Extra rooms',
      sublabel: '',
      icon: <LayoutGrid className="w-4 h-4" />,
      value: extraRooms,
      onChange: (v) => patch({ extraRooms: v }),
      min: 0,
      max: 10,
      accentClass: 'border-violet-500 bg-violet-50 text-violet-600 active:bg-violet-100',
    },
  ];

  const officeSteppers: StepperRowConfig[] = [
    {
      id: 'boardrooms',
      label: 'Boardrooms',
      sublabel: selectedServiceData ? `${formatPrice(selectedServiceData.boardroomPrice)} each` : '',
      icon: <Users className="w-4 h-4" />,
      value: boardrooms,
      onChange: (v) => patch({ officeBoardrooms: v }),
      min: 0,
      max: 10,
      accentClass: 'border-indigo-500 bg-indigo-50 text-indigo-600 active:bg-indigo-100',
    },
    {
      id: 'privateOffices',
      label: 'Private Offices',
      sublabel: selectedServiceData ? `${formatPrice(selectedServiceData.privateOfficePrice)} each` : '',
      icon: <LampDesk className="w-4 h-4" />,
      value: privateOffices,
      onChange: (v) => patch({ officePrivateOffices: v }),
      min: 0,
      max: 20,
      accentClass: 'border-indigo-500 bg-indigo-50 text-indigo-600 active:bg-indigo-100',
    },
    {
      id: 'openAreas',
      label: 'Open Work Areas',
      sublabel: selectedServiceData ? `${formatPrice(selectedServiceData.openAreaPrice)} each` : '',
      icon: <Sofa className="w-4 h-4" />,
      value: openAreas,
      onChange: (v) => patch({ officeOpenAreas: v }),
      min: 0,
      max: 10,
      accentClass: 'border-indigo-500 bg-indigo-50 text-indigo-600 active:bg-indigo-100',
    },
    {
      id: 'officeBathrooms',
      label: 'Bathrooms',
      sublabel: `${formatPrice(scaledOfficeBathroom)} each`,
      icon: <Bath className="w-4 h-4" />,
      value: officeBathrooms,
      onChange: (v) => patch({ officeBathrooms: v }),
      min: 0,
      max: 10,
      accentClass: 'border-indigo-500 bg-indigo-50 text-indigo-600 active:bg-indigo-100',
    },
    {
      id: 'kitchens',
      label: 'Kitchen / Breakroom',
      sublabel: `${formatPrice(scaledOfficeKitchen)} each`,
      icon: <Coffee className="w-4 h-4" />,
      value: kitchens,
      onChange: (v) => patch({ officeKitchens: v }),
      min: 0,
      max: 5,
      accentClass: 'border-indigo-500 bg-indigo-50 text-indigo-600 active:bg-indigo-100',
    },
  ];

  const validationMessage =
    !location?.trim()
      ? 'Please select your area'
      : data.pricingMode === 'basic'
        ? data.basicPlannedHours == null ||
            data.basicPlannedHours < 2 ||
            data.basicPlannedHours > maxBasicH
          ? 'Complete your selections to continue'
          : 'Complete your selections to continue'
        : !selectedService
          ? 'Please select a service'
          : !propertyType
            ? 'Please select a property type'
            : 'Please enter your location';

  const serviceTitle =
    data.pricingMode === 'basic'
      ? 'Basic Clean'
      : selectedServiceData?.label ?? 'Cleaning';

  const mobileStickyPriceSummary = useMemo(() => {
    if (displayTotal <= 0) return null;
    if (data.pricingMode === 'basic' && quickCleanPreview != null) {
      return (
        <div className="space-y-3 text-sm">
          <div className="rounded-xl border border-gray-100 bg-gray-50/90 p-3 space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Quick Clean</p>
            <div className="flex justify-between items-start gap-3">
              <span className="text-gray-600">Planned hours</span>
              <span className="font-semibold text-gray-900 tabular-nums text-right">
                {Math.min(6, qcHoursVal).toFixed(1)} h
              </span>
            </div>
            <div className="flex justify-between items-start gap-3">
              <span className="text-gray-600">Estimated service</span>
              <span className="font-semibold text-gray-900 tabular-nums text-right">
                {formatPrice(qcPriceVal)}
              </span>
            </div>
            {location?.trim() ? (
              <div className="flex justify-between items-start gap-3 text-xs">
                <span className="text-gray-500">Area</span>
                <span className="font-medium text-gray-700 text-right">{location.trim()}</span>
              </div>
            ) : null}
          </div>
          <div className="flex justify-between items-center gap-3 text-base font-bold text-gray-900 pt-1 border-t border-gray-200">
            <span>Total</span>
            <span className="tabular-nums">{formatPrice(displayTotal)}</span>
          </div>
        </div>
      );
    }
    if (summaryTone === 'basic') {
      return (
        <div className="text-sm text-gray-600 py-2">
          <p>Complete your Quick Clean selections to see a full breakdown.</p>
        </div>
      );
    }
    if (!useDbBreakdown || !effectiveDbPricingRows?.length) {
      return <p className="text-sm text-gray-500 text-center py-6">Loading price…</p>;
    }
    return (
      <div className="space-y-3 text-sm">
        <div className="rounded-xl border border-gray-100 bg-gray-50/90 p-3 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Breakdown</p>
          <div className="space-y-2">
            {effectiveDbPricingRows
              .filter((r) => r.value !== 0)
              .map((row) => (
                <div key={row.id} className="flex justify-between items-start gap-3">
                  <span className="text-gray-600">{row.label}</span>
                  <span className="font-semibold text-gray-900 tabular-nums text-right shrink-0">
                    {row.id === 'v2_service' ? `+ ${formatPrice(row.value)}` : formatPrice(row.value)}
                  </span>
                </div>
              ))}
            <div className="flex justify-between items-start gap-3 text-base font-bold text-gray-900 pt-2 border-t border-gray-200">
              <span>Total</span>
              <span className="tabular-nums">{formatPrice(displayTotal)}</span>
            </div>
          </div>
          {effectiveEngineMeta && effectiveEngineMeta.marginRateBoostApplied > 0 ? (
            <p className="text-[11px] text-amber-900 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1.5">
              Includes a pricing safeguard for cleaners.
            </p>
          ) : null}
        </div>
      </div>
    );
  }, [
    data.pricingMode,
    displayTotal,
    effectiveDbPricingRows,
    effectiveEngineMeta,
    location,
    qcHoursVal,
    qcPriceVal,
    quickCleanPreview,
    summaryTone,
    useDbBreakdown,
  ]);

  return (
    <div className="min-h-screen bg-[#f0f2f5] font-sans">
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex flex-nowrap sm:flex-wrap items-center justify-between gap-3 sm:gap-4 min-w-0">
        <div className="flex items-center gap-3 min-w-0 flex-1 sm:flex-initial">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
              aria-label="Back"
            >
              <ArrowLeft size={18} className="text-gray-500" />
            </button>
          ) : (
            <span className="w-8 shrink-0 sm:hidden" aria-hidden />
          )}
          <div className="min-w-0 hidden sm:block">
            <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">Shalean Cleaning Services</p>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">Choose your service</h1>
            <p className="text-xs text-gray-500 mt-0.5">Step 1 of 4 · Takes ~1 min</p>
          </div>
        </div>
        <div className="shrink-0">
          <BookingFlowStepIndicator activeStep={1} stepHint="Takes ~1 min" />
        </div>
      </div>

      <BookingFlowLayout
        sidebar={
          <BookingSummary
            mode="preview"
            step={1}
            summaryTone={summaryTone}
            previewAnchor={undefined}
            priceReassurance
            pricingContext={effectivePricingContext}
            serviceTitle={serviceTitle}
            bookingDetails={{
              where:
                [data.address?.trim(), location?.trim()].filter(Boolean).join(' · ') ||
                location?.trim() ||
                'Add your area',
              what: serviceTitle,
              when: 'Next: date & time',
            }}
            onEditBookingDetail={(key) => {
              if (key === 'where') {
                document.getElementById('booking-location-anchor')?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start',
                });
              } else if (key === 'what') {
                document.getElementById('booking-service-section')?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start',
                });
              } else if (key === 'when') {
                if (isValid) handleContinue();
                else {
                  document.getElementById('booking-location-anchor')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  });
                }
              }
            }}
            priceSubline={
              (() => {
                const base =
                  summaryTone === 'basic' && quickCleanPreview != null
                    ? `${Math.min(6, qcHoursVal).toFixed(1)}h · 1 cleaner`
                    : effectivePricingContext?.estimatedJobHours != null
                      ? `Estimated time: ${effectivePricingContext.estimatedJobHours.toFixed(1)}h · Team: ${effectivePricingContext.teamSize ?? 1} ${(effectivePricingContext.teamSize ?? 1) === 1 ? 'cleaner' : 'cleaners'}`
                      : duration !== '—'
                        ? duration
                        : null;
                if (!base) {
                  return earliestSlotPriceHint ? 'Based on earliest available time slot' : null;
                }
                return earliestSlotPriceHint ? `${base} · Based on earliest available time slot` : base;
              })()
            }
            propertySummary={
              data.pricingMode === 'basic'
                ? location || undefined
                : [propertyType, location].filter(Boolean).length
                  ? [propertyType, location].filter(Boolean).join(' · ')
                  : undefined
            }
            extrasSummary={data.extras.length > 0 ? `${data.extras.length} add-on(s)` : undefined}
            totalZar={displayTotal}
            previewPricingMode="default"
            details={
              summaryTone === 'basic' ? (
                null
              ) : (
                <>
                  {!selectedService && (
                    <p className="text-xs text-gray-400 text-center py-2">Pick a service</p>
                  )}

                  {propertyType && (
                    <div className="flex items-center gap-2 pb-1">
                      <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Property</span>
                      <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full capitalize">
                        {propertyType}
                      </span>
                    </div>
                  )}

                  {useDbBreakdown && (
                    <div className="rounded-xl border border-gray-100 bg-gray-50/90 p-3 space-y-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Breakdown</p>
                      <div className="space-y-2">
                        {effectiveDbPricingRows!
                          .filter((r) => r.value !== 0)
                          .map((row) => (
                            <div key={row.id} className="flex justify-between items-start gap-3 text-sm">
                              <span className="text-gray-600">{row.label}</span>
                              <motion.span
                                key={`${row.id}-${row.value}`}
                                initial={{ opacity: 0.5, y: -2 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="font-semibold text-gray-900 tabular-nums text-right shrink-0"
                              >
                                {row.id === 'v2_service' ? `+ ${formatPrice(row.value)}` : formatPrice(row.value)}
                              </motion.span>
                            </div>
                          ))}
                        {displayTotal > 0 ? (
                          <div className="flex justify-between items-start gap-3 text-sm font-bold text-gray-900 pt-1 border-t border-gray-200">
                            <span>Total</span>
                            <span className="tabular-nums">{formatPrice(displayTotal)}</span>
                          </div>
                        ) : null}
                      </div>
                      {effectiveEngineMeta && effectiveEngineMeta.marginRateBoostApplied > 0 ? (
                        <p className="text-[11px] text-amber-900 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1">
                          Includes a pricing safeguard for cleaners.
                        </p>
                      ) : null}
                    </div>
                  )}

                  {!useDbBreakdown && selectedService && (
                    <p className="text-xs text-gray-500 text-center py-2">Loading price…</p>
                  )}

                </>
              )
            }
            footer={
              <>
                <motion.button
                  type="button"
                  onClick={handleContinue}
                  animate={isValid ? { opacity: 1 } : { opacity: 0.45 }}
                  whileTap={isValid ? { scale: 0.97 } : {}}
                  disabled={!isValid}
                  className={[
                    'w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 mt-1',
                    isValid
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25 hover:bg-primary/90 cursor-pointer'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed',
                  ].join(' ')}
                >
                  {isValid ? (
                    <>
                      Check availability <ArrowRight size={16} className="opacity-90" aria-hidden />
                    </>
                  ) : (
                    <span className="text-sm">Add details</span>
                  )}
                </motion.button>
                {isValid ? (
                  <p className="text-center text-[11px] text-gray-500 mt-2">Next: Pick a date &amp; time</p>
                ) : null}
                {attempted && !isValid && <p className="text-xs text-red-500 text-center">{validationMessage}</p>}
              </>
            }
          />
        }
      >
          <section
            id="booking-service-section"
            aria-labelledby="experience-heading"
            className="space-y-3 scroll-mt-24"
          >
            <h2 id="experience-heading" className="sr-only">
              Choose your service
            </h2>
            {suggestPremiumVisual && data.pricingMode === 'basic' ? (
              <p className="text-center text-xs font-semibold text-amber-900 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                Recommended for your home size
              </p>
            ) : null}
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <motion.button
                type="button"
                onClick={() => selectExperience('basic')}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.995 }}
                className={cn(
                  'relative text-left rounded-xl sm:rounded-2xl border-2 p-3 sm:p-5 md:p-6 transition-all duration-200 min-h-[140px] sm:min-h-0',
                  data.pricingMode === 'basic'
                    ? 'border-violet-500 bg-white shadow-xl shadow-violet-200/40 ring-2 ring-violet-400/20'
                    : 'border-gray-200 bg-white hover:border-violet-300 hover:shadow-md'
                )}
              >
                <span className="absolute top-2 right-2 sm:top-3 sm:right-3 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide text-violet-700 bg-violet-100/90 px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-full max-w-[4.5rem] sm:max-w-none leading-tight text-center">
                  Most booked
                </span>
                <div className="flex items-start justify-between gap-1 pr-11 sm:pr-16">
                  <span className="text-sm sm:text-xl font-bold text-gray-900 leading-tight">Basic Clean</span>
                </div>
                <p className="text-lg sm:text-3xl font-extrabold text-violet-700 mt-2 sm:mt-3 tabular-nums tracking-tight leading-none">
                  <span className="hidden sm:inline">Starts at </span>
                  <span className="sm:hidden">From </span>
                  {formatPrice(basicStartZar)}+
                </p>
                <p className="text-xs text-gray-500 mt-1 hidden sm:block">Based on your home size</p>
                <p className="text-[10px] sm:hidden text-gray-600 mt-2 leading-snug">1 cleaner · max 6h</p>
                <ul className="mt-3 sm:mt-4 space-y-2 text-sm font-medium text-gray-700 hidden md:block">
                  <li className="flex gap-2 items-center">
                    <CheckCircle2 className="w-4 h-4 text-violet-500 shrink-0" aria-hidden />
                    1 cleaner
                  </li>
                  <li className="flex gap-2 items-center">
                    <CheckCircle2 className="w-4 h-4 text-violet-500 shrink-0" aria-hidden />
                    Max 6 hrs
                  </li>
                </ul>
              </motion.button>

              <motion.button
                type="button"
                onClick={() => selectExperience('premium')}
                animate={
                  suggestPremiumVisual && data.pricingMode === 'basic' && premiumCue
                    ? { boxShadow: '0 12px 40px -8px rgba(251, 191, 36, 0.45)' }
                    : undefined
                }
                transition={{ duration: 0.45, ease: 'easeOut' }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.995 }}
                className={cn(
                  'relative text-left rounded-xl sm:rounded-2xl border-2 p-3 sm:p-5 md:p-6 transition-all duration-200 min-h-[140px] sm:min-h-0',
                  data.pricingMode === 'premium'
                    ? 'border-violet-500 bg-white shadow-xl shadow-violet-200/50 scale-[1.01]'
                    : 'border-gray-200 bg-white hover:border-violet-300 hover:shadow-md',
                  suggestPremiumVisual && data.pricingMode === 'basic'
                    ? 'bg-gradient-to-br from-amber-50/90 to-white border-amber-200/90 scale-[1.02] shadow-md shadow-amber-100/50'
                    : '',
                  suggestPremiumVisual && data.pricingMode === 'basic' && premiumCue
                    ? 'ring-2 ring-amber-400/45'
                    : ''
                )}
              >
                <span className="absolute top-2 right-2 sm:top-3 sm:right-3 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide text-amber-800 bg-amber-100/90 px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-full max-w-[4.5rem] sm:max-w-none leading-tight text-center">
                  Best results
                </span>
                <div className="flex items-start justify-between gap-1 pr-11 sm:pr-16">
                  <span className="text-sm sm:text-xl font-bold text-gray-900 leading-tight">Premium Clean</span>
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-violet-500 shrink-0 hidden sm:block" aria-hidden />
                </div>
                <p className="text-lg sm:text-3xl font-extrabold text-violet-700 mt-2 sm:mt-3 tabular-nums tracking-tight leading-none">
                  From R250+
                </p>
                <p className="text-[10px] sm:hidden text-gray-600 mt-2 leading-snug">Team clean · deep detail</p>
                <ul className="mt-3 sm:mt-4 space-y-2 text-sm font-medium text-gray-700 hidden md:block">
                  <li className="flex gap-2 items-center">
                    <CheckCircle2 className="w-4 h-4 text-violet-500 shrink-0" aria-hidden />
                    Team service
                  </li>
                  <li className="flex gap-2 items-center">
                    <CheckCircle2 className="w-4 h-4 text-violet-500 shrink-0" aria-hidden />
                    Deep clean
                  </li>
                  <li className="flex gap-2 items-center">
                    <CheckCircle2 className="w-4 h-4 text-violet-500 shrink-0" aria-hidden />
                    Custom options
                  </li>
                </ul>
                <p className="text-sm font-semibold text-gray-900 mt-3 hidden md:block">≈ 2–3h ⚡</p>
                <p className="text-xs text-violet-800 font-medium mt-1 hidden md:block">Same hourly rate · finishes faster</p>
                <p className="text-[11px] text-gray-500 mt-2 hidden md:block">Faster than Basic on larger homes</p>
              </motion.button>
            </div>
          </section>

          {data.pricingMode === 'basic' &&
          (highDemandSlots || (showAreaDemandUrgency && areaShortLabel) || (popularInAreaToday && areaShortLabel)) ? (
            <p
              className="text-xs font-medium text-gray-700 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-center"
              role="status"
            >
              {highDemandSlots
                ? 'Only a few slots left today'
                : showAreaDemandUrgency
                  ? `Fills up fast in ${areaShortLabel}`
                  : `Popular in ${areaShortLabel} today`}
            </p>
          ) : null}

          {data.pricingMode === 'basic' && (
            <section className="rounded-2xl border border-violet-100/80 bg-white p-5 shadow-md shadow-violet-100/40 space-y-5">
              <div>
                <div id="booking-location-anchor" className="scroll-mt-28">
                  <label className="block text-base font-bold text-gray-900 mb-2">Location</label>
                  <AreaDropdown
                    value={location}
                    onSelect={(v) => patch({ workingArea: v })}
                    error={locationError}
                  />
                </div>
                <div className="mt-4">
                  <Stepper
                    variant="card"
                    cardSingleRow
                    label="Rooms"
                    icon={<BedDouble className="w-4 h-4" />}
                    value={data.bedrooms}
                    onChange={(v) => patch({ bedrooms: v })}
                    min={0}
                    max={8}
                    accentClass="border-violet-500 bg-violet-50 text-violet-700 active:bg-violet-100"
                  />
                  <p className="text-[11px] text-gray-500 mt-2">More rooms = more cleaning time</p>
                </div>
                {quickCleanPreview?.extrasCapped ? (
                  <p className="text-xs font-medium text-amber-900 mt-2">6h max — adjust add-ons or upgrade.</p>
                ) : null}
                <SavingsMessage variant="basic" />
              </div>
              {data.pricingMode === 'basic' && upsellContent && (
                <UpsellCard content={upsellContent} onUpgrade={handleUpsellUpgrade} />
              )}
              {showBigJobPremiumUpsell ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28 }}
                  className={cn(
                    'rounded-xl border bg-gradient-to-br from-violet-50 to-white p-4',
                    premiumNudgeStrength === 'strong'
                      ? 'border-violet-300 shadow-sm shadow-violet-100'
                      : 'border-violet-100'
                  )}
                >
                  <p className="text-base font-bold text-gray-900">Big job?</p>
                  <p className="mt-1 text-sm text-gray-700">Finish in half the time with a team</p>
                  <p className="mt-2 text-[11px] text-gray-500">Same price per hour</p>
                  <button
                    type="button"
                    onClick={() => selectExperience('premium')}
                    className="mt-4 w-full rounded-lg bg-violet-600 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
                  >
                    Upgrade to Premium →
                  </button>
                </motion.div>
              ) : null}
            </section>
          )}

          {data.pricingMode === 'premium' && (
            <>
              <SavingsMessage variant="premium" />
              <div
                className={[
                  'bg-white rounded-xl shadow-sm p-4 sm:p-5 space-y-4 border border-gray-100 transition-all duration-200',
                  serviceError ? 'ring-2 ring-red-300 ring-offset-2' : '',
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 id="service-heading" className="text-lg font-bold text-gray-900">
                      Service
                    </h2>
                  </div>
                  {serviceError && (
                    <motion.span
                      initial={{ opacity: 0, x: 6 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-1 text-xs text-red-500 font-medium flex-shrink-0"
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Required</span>
                    </motion.span>
                  )}
                </div>
                <div
                  className={cn(
                    'grid gap-2 sm:gap-3',
                    // Mobile: 4 columns → items wrap into rows (e.g. 8 services = 4×2)
                    'grid-cols-4',
                    servicesResolved.length <= 4 ? 'sm:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-5'
                  )}
                >
                  {servicesResolved.map((service) => (
                    <Tooltip
                      key={service.id}
                      content={<span>From {formatPrice(service.basePrice)}</span>}
                    >
                      <button
                        type="button"
                        onClick={() => handleServiceSelect(service.id)}
                        className={cn(
                          'flex flex-col items-center text-center min-w-0 w-full rounded-lg sm:rounded-xl border-2 p-2 sm:p-4 transition-all',
                          selectedService === service.id
                            ? 'border-violet-600 bg-violet-50/90 shadow-md shadow-violet-500/10 ring-1 ring-violet-500/15'
                            : 'border-gray-100 bg-white hover:border-violet-200 hover:bg-slate-50/80'
                        )}
                      >
                        <div
                          className={cn(
                            'w-8 h-8 sm:w-11 sm:h-11 shrink-0 rounded-lg sm:rounded-xl flex items-center justify-center mb-1.5 sm:mb-3 transition-colors [&_svg]:w-4 [&_svg]:h-4 sm:[&_svg]:w-5 sm:[&_svg]:h-5',
                            selectedService === service.id
                              ? 'bg-white text-violet-700 shadow-sm shadow-violet-900/5'
                              : 'bg-slate-100 text-slate-600'
                          )}
                        >
                          {service.icon}
                        </div>
                        <p className="text-[10px] sm:text-sm font-bold text-gray-900 leading-tight w-full hyphens-auto">
                          {service.label}
                        </p>
                      </button>
                    </Tooltip>
                  ))}
                </div>
              </div>

          <section
            aria-labelledby="space-heading"
            className={[
              'bg-white rounded-xl shadow-sm border transition-all duration-200',
              propertyTypeError ? 'border-red-300 ring-2 ring-red-100' : 'border-gray-100',
            ].join(' ')}
          >
            <div className="px-5 py-4 border-b border-gray-100 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 id="space-heading" className="text-lg font-bold text-gray-900">
                    Your space
                  </h2>
                </div>
                {propertyTypeError && (
                  <motion.span
                    initial={{ opacity: 0, x: 6 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-1 text-xs text-red-500 font-medium"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Required</span>
                  </motion.span>
                )}
              </div>
            </div>

            <div className="px-5 py-4 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2.5">Property type</label>
                <div className="flex gap-2 flex-wrap">
                  {PROPERTY_TYPES.map((pt) => (
                    <motion.button
                      key={pt.id}
                      type="button"
                      whileTap={{ scale: 0.96 }}
                      onClick={() => handlePropertyTypeSelect(pt.id)}
                      className={[
                        'flex items-center gap-1.5 px-4 py-2.5 rounded-full border-2 text-sm font-medium transition-all duration-150 select-none',
                        propertyType === pt.id
                          ? 'border-violet-500 bg-violet-600 text-white shadow-md shadow-violet-200'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300',
                      ].join(' ')}
                      aria-pressed={propertyType === pt.id}
                    >
                      {pt.icon}
                      <span>{pt.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-base font-bold text-gray-900 mb-2">
                  <span>Location</span>
                  {locationError && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="ml-2 text-xs text-red-500 font-normal">
                      Required
                    </motion.span>
                  )}
                </label>
                <AreaDropdown
                  value={location}
                  onSelect={(v) => patch({ workingArea: v })}
                  error={locationError}
                />
              </div>
            </div>
          </section>

          <AnimatePresence mode="wait">
            {isCarpet && (
              <motion.section
                key="carpet-rooms"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                aria-labelledby="carpet-heading"
                className="bg-white rounded-xl shadow-sm border border-teal-200 overflow-hidden"
              >
                <div className="px-5 py-4 border-b border-teal-100 bg-teal-50">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-teal-600" />
                    <h2 id="carpet-heading" className="text-base font-bold text-gray-900">
                      Carpet Details
                    </h2>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">Adjust quantities for your exact quote</p>
                </div>
                <div className="px-5 py-2">
                  <Stepper
                    label="Carpeted rooms"
                    sublabel={`${formatPrice(selectedServiceData?.bedroomPrice ?? 0)} per room`}
                    icon={<Layers className="w-4 h-4" />}
                    value={carpetRooms}
                    onChange={(v) => patch({ carpetRooms: v })}
                    min={1}
                    max={20}
                    accentClass="border-teal-500 bg-teal-50 text-teal-600 active:bg-teal-100"
                  />
                  <Stepper
                    label="Loose rugs"
                    sublabel={`${formatPrice(selectedServiceData?.bathroomPrice ?? 0)} per rug`}
                    icon={<LayoutGrid className="w-4 h-4" />}
                    value={carpetRugs}
                    onChange={(v) => patch({ carpetRugs: v })}
                    min={0}
                    max={10}
                    accentClass="border-teal-500 bg-teal-50 text-teal-600 active:bg-teal-100"
                  />
                  <ToggleRow
                    label="Extra cleaner"
                    sublabel={`Faster service · ${formatPrice(extraCleanerUnitZar)} add-on`}
                    icon={<Star className="w-4 h-4" />}
                    value={extraCleaner}
                    onChange={(v) => patch({ carpetExtraCleaner: v })}
                    activeColor="bg-teal-500"
                  />
                </div>
              </motion.section>
            )}

            {!isCarpet && isOffice && selectedService && (
              <motion.section
                key="office-rooms"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                aria-labelledby="office-heading"
                className="bg-white rounded-xl shadow-sm border border-indigo-200 overflow-hidden"
              >
                <div className="px-5 py-4 border-b border-indigo-100 bg-indigo-50">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-indigo-600" />
                    <h2 id="office-heading" className="text-base font-bold text-gray-900">
                      Office Details
                    </h2>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">Tell us about your commercial space for a precise quote</p>
                </div>
                <div className="px-5 py-2">
                  {officeSteppers.map((row) => (
                    <Stepper
                      key={row.id}
                      label={row.label}
                      sublabel={row.sublabel}
                      icon={row.icon}
                      value={row.value}
                      onChange={row.onChange}
                      min={row.min}
                      max={row.max}
                      accentClass={row.accentClass}
                    />
                  ))}
                  <ToggleRow
                    label="Reception Area"
                    sublabel={`Include reception · ${formatPrice(scaledOfficeReception)} add-on`}
                    icon={<PhoneCall className="w-4 h-4" />}
                    value={hasReception}
                    onChange={(v) => patch({ officeHasReception: v })}
                    activeColor="bg-indigo-500"
                  />
                </div>
              </motion.section>
            )}

            {!isCarpet && isStudio && selectedService && (
              <motion.section
                key="studio-rooms"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                aria-labelledby="studio-heading"
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <div className="px-5 py-4 border-b border-gray-100 bg-violet-50/70">
                  <div className="flex items-center gap-2">
                    {selectedServiceData?.icon && (
                      <div className="w-5 h-5 text-violet-700">{selectedServiceData.icon}</div>
                    )}
                    <h2 id="studio-heading" className="text-lg font-bold text-gray-900">
                      Home size
                    </h2>
                  </div>
                </div>
                <div className="px-5 py-2">
                  {studioSteppers.map((row) => (
                    <Stepper
                      key={row.id}
                      label={row.label}
                      sublabel={row.sublabel}
                      icon={row.icon}
                      value={row.value}
                      onChange={row.onChange}
                      min={row.min}
                      max={row.max}
                      accentClass={row.accentClass}
                    />
                  ))}
                </div>
              </motion.section>
            )}

            {!isCarpet && !isOffice && !isStudio && selectedService && (
              <motion.section
                key="standard-rooms"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                aria-labelledby="rooms-heading"
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <div className="px-5 py-4 border-b border-gray-100 bg-violet-50/70">
                  <div className="flex items-center gap-2">
                    {selectedServiceData?.icon && (
                      <div className="w-5 h-5 text-violet-700">{selectedServiceData.icon}</div>
                    )}
                    <h2 id="rooms-heading" className="text-lg font-bold text-gray-900">
                      Home size
                    </h2>
                  </div>
                </div>
                <div className="px-4 py-3 lg:px-5 lg:py-4">
                  <div className="grid grid-cols-1 gap-2 lg:grid-cols-3 lg:gap-4">
                    {residentialSteppers.map((row) => (
                      <Stepper
                        key={row.id}
                        variant="card"
                        label={row.label}
                        sublabel={row.sublabel}
                        icon={row.icon}
                        value={row.value}
                        onChange={row.onChange}
                        min={row.min}
                        max={row.max}
                        accentClass={row.accentClass}
                      />
                    ))}
                  </div>
                </div>
              </motion.section>
            )}
          </AnimatePresence>
            </>
          )}
      </BookingFlowLayout>

      <StickyCTA
        totalLabel={displayTotal > 0 ? `R ${Math.round(animatedDisplayTotal).toLocaleString('en-ZA')}` : undefined}
        buttonLabel={isValid ? 'See available times' : data.pricingMode === 'basic' ? 'Choose area' : 'Complete fields'}
        onClick={handleContinue}
        disabled={!isValid}
        helperText={attempted && !isValid ? validationMessage : 'Trusted by 100+ homes in Cape Town'}
        priceSummary={mobileStickyPriceSummary ?? undefined}
        priceSummaryTitle="Price summary"
      />
    </div>
  );
}
