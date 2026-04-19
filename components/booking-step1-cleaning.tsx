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
  Info,
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
import { Tooltip } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

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
}) => {
  const decrease = (
    <motion.button
      type="button"
      whileTap={{ scale: 0.88 }}
      onClick={() => onChange(Math.max(min, value - 1))}
      disabled={value <= min}
      className="min-h-10 min-w-10 h-10 w-10 shrink-0 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed active:bg-gray-100 transition-colors touch-manipulation"
      aria-label={`Decrease ${label}`}
    >
      <Minus className="w-4 h-4" aria-hidden />
    </motion.button>
  );

  const increase = (
    <motion.button
      type="button"
      whileTap={{ scale: 0.88 }}
      onClick={() => onChange(Math.min(max, value + 1))}
      disabled={value >= max}
      className={[
        'min-h-10 min-w-10 h-10 w-10 shrink-0 rounded-full border-2 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors touch-manipulation',
        accentClass || 'border-violet-500 bg-violet-50 text-violet-600 active:bg-violet-100',
      ].join(' ')}
      aria-label={`Increase ${label}`}
    >
      <Plus className="w-4 h-4" aria-hidden />
    </motion.button>
  );

  const valueDisplay = (
    <motion.span
      key={value}
      initial={{ scale: 1.25, opacity: 0.6 }}
      animate={{ scale: 1, opacity: 1 }}
      className={[
        'text-center text-base font-bold text-gray-900 tabular-nums',
        variant === 'card' ? 'min-w-[2.5rem] flex-1' : 'w-7',
      ].join(' ')}
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
        className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm flex flex-col gap-3"
      >
        <div className="flex items-start gap-2 min-w-0">
          {icon && (
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
              {icon}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-800">{label}</p>
            {sublabel && <p className="text-sm text-gray-500 mt-0.5 leading-snug">{sublabel}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 w-full">
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

  /** Basic Clean: always derive from `calculateBasicV2` + equipment — not catalog illustrative ZAR or stale parent totals. */
  const basicWizardPricing = useMemo(
    () => getBasicPlannedWizardPricing(data),
    [
      data.service,
      data.tipAmount,
      data.promoCode,
      data.pricingMode,
      data.scheduleEquipmentPref,
      data.basicPlannedHours,
      data.extras,
    ]
  );

  const displayTotal =
    basicWizardPricing != null
      ? basicWizardPricing.total
      : liveTotalZar > 0
        ? liveTotalZar
        : illustrativePrice;

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
  const maxBasicH = data.extras.length > 0 ? 8 : 5;
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
    const trigger = getUpsellTrigger({
      hours: data.basicPlannedHours ?? 0,
      isMinimumApplied: effectivePricingV2?.isMinimumApplied,
      timeOnPage,
    });
    return trigger ? getUpsellContent(trigger) : null;
  }, [data.pricingMode, data.basicPlannedHours, effectivePricingV2?.isMinimumApplied, timeOnPage]);

  const handleUpsellUpgrade = useCallback(() => {
    selectExperience('premium');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectExperience]);

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
      sublabel: selectedServiceData && !isCarpet ? `${formatPrice(selectedServiceData.bathroomPrice)} per bathroom` : '',
      icon: <Bath className="w-4 h-4" />,
      value: effectiveBathrooms,
      onChange: (v) => patch({ bathrooms: v }),
      min: 1,
      max: 4,
      accentClass: 'border-violet-500 bg-violet-50 text-violet-600 active:bg-violet-100',
    },
    {
      id: 'extraRooms',
      label: 'Extra Rooms',
      sublabel:
        selectedServiceData && !isCarpet
          ? `${formatPrice(selectedServiceData.extraRoomPrice)} per extra room`
          : '',
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
      label: 'Bedrooms',
      sublabel: selectedServiceData && !isCarpet ? `${formatPrice(selectedServiceData.bedroomPrice)} per room` : '',
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
      sublabel: selectedServiceData && !isCarpet ? `${formatPrice(selectedServiceData.bathroomPrice)} per bathroom` : '',
      icon: <Bath className="w-4 h-4" />,
      value: bathrooms,
      onChange: (v) => patch({ bathrooms: v }),
      min: 0,
      max: 8,
      accentClass: 'border-violet-500 bg-violet-50 text-violet-600 active:bg-violet-100',
    },
    {
      id: 'extraRooms',
      label: 'Extra Rooms',
      sublabel:
        selectedServiceData && !isCarpet
          ? `${formatPrice(selectedServiceData.extraRoomPrice)} per extra room`
          : '',
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
          ? `Choose how many hours (2–${maxBasicH})`
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

  return (
    <div className="min-h-screen bg-[#f0f2f5] font-sans">
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors flex-shrink-0"
            >
              <ArrowLeft size={18} className="text-gray-500" />
            </button>
          ) : null}
          <div className="min-w-0">
            <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">Shalean Cleaning Services</p>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">Book your clean</h1>
          </div>
        </div>
        <BookingFlowStepIndicator activeStep={1} />
      </div>

      <BookingFlowLayout
        sidebar={
          <BookingSummary
            mode="preview"
            step={1}
            summaryTone={summaryTone}
            previewAnchor={
              data.pricingMode === 'premium' ? 'Most homes like yours cost R800–R1400' : undefined
            }
            pricingContext={effectivePricingContext}
            serviceTitle={serviceTitle}
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
              <>
                {!selectedService && data.pricingMode !== 'basic' && (
                  <p className="text-xs text-gray-400 text-center py-2">Select a service to see pricing</p>
                )}

                {propertyType && data.pricingMode !== 'basic' && (
                  <div className="flex items-center gap-2 pb-1">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Property</span>
                    <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full capitalize">
                      {propertyType}
                    </span>
                  </div>
                )}

                {useDbBreakdown && (
                  <div className="rounded-xl border border-gray-100 bg-gray-50/90 p-4 space-y-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Price breakdown</p>
                    {summaryTone === 'basic' && effectivePricingV2?.isMinimumApplied ? (
                      <div className="rounded-lg border border-amber-100 bg-amber-50/90 px-3 py-2 text-xs text-amber-950">
                        <p className="font-semibold">Minimum booking applied</p>
                        <p className="text-amber-900/90 mt-0.5">
                          Includes up to {data.basicPlannedHours} hours of cleaning time.
                        </p>
                      </div>
                    ) : summaryTone === 'basic' && data.basicPlannedHours != null ? (
                      <p className="text-xs text-gray-600">
                        Estimated price based on your selected hours
                      </p>
                    ) : null}
                    <div className="space-y-2.5">
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
                          <span>Total Due</span>
                          <span className="tabular-nums">{formatPrice(displayTotal)}</span>
                        </div>
                      ) : null}
                    </div>
                    {effectiveEngineMeta && effectiveEngineMeta.marginRateBoostApplied > 0 ? (
                      <p className="text-[11px] text-amber-900 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5 leading-snug">
                        Includes a pricing safeguard so payouts stay sustainable for cleaners.
                      </p>
                    ) : null}
                    {effectiveEngineMeta ? (
                      <p className="text-[11px] text-gray-500 leading-snug space-y-0.5">
                        <span className="block">
                          Estimated duration:{' '}
                          {(effectiveEngineMeta.estimatedHours ?? effectiveEngineMeta.estimatedJobHours ?? 0).toFixed(1)} hours
                        </span>
                        {effectiveEngineMeta.teamSize != null && effectiveEngineMeta.teamSize > 0 ? (
                          <span className="block">Team size: {effectiveEngineMeta.teamSize} cleaners</span>
                        ) : null}
                        {summaryTone !== 'basic' ? (
                          <span className="block">
                            Est. {effectiveEngineMeta.hoursPerCleaner.toFixed(1)}h per cleaner · time-based total
                          </span>
                        ) : (
                          <span className="block">Quick clean · 1 cleaner · all-in estimate + service fee</span>
                        )}
                      </p>
                    ) : null}
                  </div>
                )}

                {!useDbBreakdown && selectedService && (
                  <p className="text-xs text-gray-500 text-center py-2">
                    Price details appear when your booking configuration is loaded.
                  </p>
                )}

                {location && (
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-sm text-gray-500">Area</span>
                    <span className="text-sm font-semibold text-gray-900 truncate max-w-40 text-right">{location}</span>
                  </div>
                )}
              </>
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
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-200 hover:bg-violet-700 cursor-pointer'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed',
                  ].join(' ')}
                >
                  {isValid ? (
                    <>
                      Continue to Step 2 <ArrowRight size={16} />
                    </>
                  ) : (
                    <>Complete service, property & area to continue</>
                  )}
                </motion.button>
                {attempted && !isValid && <p className="text-xs text-red-500 text-center">{validationMessage}</p>}

                <div className="flex flex-col gap-1.5 pt-1">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <CheckCircle2 size={13} className="text-green-500 flex-shrink-0" />
                    No payment required to book
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <CheckCircle2 size={13} className="text-green-500 flex-shrink-0" />
                    Free cancellation up to 24 hrs before
                  </div>
                </div>
              </>
            }
          />
        }
      >
          <p className="text-xs font-bold tracking-widest text-violet-600 uppercase">Step 1 of 4</p>

          <section aria-labelledby="experience-heading" className="space-y-3">
            <h2 id="experience-heading" className="text-lg font-bold text-gray-900">
              Choose cleaning experience
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => selectExperience('basic')}
                className={cn(
                  'text-left rounded-2xl border-2 p-5 md:p-6 transition-all duration-200',
                  data.pricingMode === 'basic'
                    ? 'border-violet-500 bg-white shadow-lg shadow-violet-200/50 ring-2 ring-violet-400/25'
                    : 'border-gray-200 bg-white hover:border-violet-300'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-lg font-bold text-gray-900">Basic Clean</span>
                  <span className="text-xl leading-none" aria-hidden>
                    🔥
                  </span>
                </div>
                <p className="text-xs font-semibold uppercase tracking-wide text-violet-600 mt-1">
                  Most Affordable
                </p>
                <p className="text-sm text-gray-600 mt-1">Simple, affordable cleaning</p>
                <p className="text-sm font-semibold text-violet-700 mt-3">From R250 · tiered rates (about R50–R65/h)</p>
                <ul className="mt-3 space-y-1.5 text-xs text-gray-600">
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-violet-500 shrink-0 mt-0.5" />
                    1 cleaner
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-violet-500 shrink-0 mt-0.5" />
                    Up to 5 hours
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-violet-500 shrink-0 mt-0.5" />
                    No heavy add-ons
                  </li>
                </ul>
              </button>

              <button
                type="button"
                onClick={() => selectExperience('premium')}
                className={cn(
                  'text-left rounded-2xl border-2 p-5 md:p-6 transition-all duration-200',
                  data.pricingMode === 'premium'
                    ? 'border-violet-500 bg-white shadow-md shadow-violet-100'
                    : 'border-gray-200 bg-white hover:border-violet-300'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-lg font-bold text-gray-900">Premium Clean</span>
                  <Sparkles className="w-5 h-5 text-violet-500 shrink-0" aria-hidden />
                </div>
                <p className="text-sm text-gray-600 mt-2">Thorough, professional service</p>
                <p className="text-sm font-semibold text-violet-700 mt-3">From R800+</p>
                <ul className="mt-3 space-y-1.5 text-xs text-gray-600">
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-violet-500 shrink-0 mt-0.5" />
                    Team of cleaners
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-violet-500 shrink-0 mt-0.5" />
                    Deep cleaning available
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-violet-500 shrink-0 mt-0.5" />
                    Full customization
                  </li>
                </ul>
              </button>
            </div>
          </section>

          {data.pricingMode === 'basic' && (
            <section className="rounded-2xl border border-violet-100/80 bg-white p-5 shadow-md shadow-violet-100/40 space-y-5">
              <div>
                <h3 className="text-base font-bold text-gray-900">How many hours do you need?</h3>
                <div className="flex flex-wrap gap-2 mt-3">
                  {(data.extras.length > 0 ? ([8] as const) : ([2, 3, 4, 5] as const)).map(
                    (h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => patch({ basicPlannedHours: h })}
                      className={cn(
                        'min-w-[4.75rem] rounded-xl border-2 px-4 py-2.5 text-sm font-bold transition-all',
                        data.basicPlannedHours === h
                          ? 'border-violet-600 bg-violet-600 text-white shadow-md'
                          : 'border-gray-200 bg-white text-gray-900 hover:border-violet-300'
                      )}
                    >
                      {h}h
                    </button>
                  ))}
                </div>
                {data.extras.length > 0 ? (
                  <p className="text-xs text-gray-500 mt-2 leading-snug">
                    Add-ons use the full-day Quick Clean bundle (8h, fixed price incl. service fee).
                  </p>
                ) : null}
                <SavingsMessage
                  variant="basic"
                  hours={data.basicPlannedHours}
                  rateUsed={effectivePricingV2?.rateUsed}
                  isExtrasFullDayBundle={effectivePricingV2?.isExtrasFullDayBundle}
                />
                {effectivePricingV2?.isMinimumApplied && (
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum booking: R250 (covers up to 3 hours)
                  </p>
                )}
                {data.basicPlannedHours === 3 && effectivePricingV2?.isMinimumApplied && (
                  <p className="text-xs text-purple-600 mt-1">
                    You&apos;re using the full minimum — add 1 more hour for better value
                  </p>
                )}
              </div>
              {data.pricingMode === 'basic' && upsellContent && (
                <UpsellCard content={upsellContent} onUpgrade={handleUpsellUpgrade} />
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Service location</label>
                <AreaDropdown
                  value={location}
                  onSelect={(v) => patch({ workingArea: v })}
                  error={locationError}
                />
                <p className="text-xs text-gray-400 mt-1.5">We use this to match cleaners near you.</p>
              </div>
              {data.basicPlannedHours != null && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-4"
                >
                  <p className="text-sm font-semibold text-gray-900">Need a deeper clean?</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Upgrade to Premium for teams, deep cleaning, and full customization.
                  </p>
                  <button
                    type="button"
                    onClick={() => selectExperience('premium')}
                    className="mt-3 text-sm font-bold text-violet-700 hover:underline"
                  >
                    Upgrade to Premium →
                  </button>
                  <ul className="mt-2 space-y-1 text-xs text-gray-600">
                    <li>✔ More thorough</li>
                    <li>✔ More cleaners</li>
                    <li>✔ Better results</li>
                  </ul>
                </motion.div>
              )}
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
                    <h2 id="service-heading" className="text-base font-bold text-gray-900">
                      Service type
                    </h2>
                    <p className="text-sm text-gray-500">Swipe on mobile — hover for a price hint</p>
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
                <div className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory [-webkit-overflow-scrolling:touch]">
                  {servicesResolved.map((service) => (
                    <Tooltip
                      key={service.id}
                      content={
                        <span>
                          Est. from {formatPrice(service.basePrice)} — final price depends on rooms &amp; add-ons
                        </span>
                      }
                    >
                      <button
                        type="button"
                        onClick={() => handleServiceSelect(service.id)}
                        className={cn(
                          'snap-start shrink-0 w-[155px] sm:w-[170px] rounded-xl border-2 p-4 text-left transition-all',
                          selectedService === service.id
                            ? 'border-violet-600 bg-violet-50 shadow-md'
                            : 'border-gray-100 bg-white hover:border-violet-200'
                        )}
                      >
                        <div
                          className={cn(
                            'w-10 h-10 rounded-lg flex items-center justify-center mb-2',
                            service.bgSelected
                          )}
                        >
                          {service.icon}
                        </div>
                        <p className="text-sm font-bold text-gray-900 leading-tight">{service.label}</p>
                        <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{service.tagline}</p>
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
                  <h2 id="space-heading" className="text-base font-bold text-gray-900">
                    Your space
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">Help us tailor the service to your property</p>
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
                <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                  <span>Service location</span>
                  {locationError && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="ml-2 text-xs text-red-500 font-normal">
                      — Please select your area
                    </motion.span>
                  )}
                </label>
                <AreaDropdown
                  value={location}
                  onSelect={(v) => patch({ workingArea: v })}
                  error={locationError}
                />
                <p className="text-xs text-gray-400 mt-1.5 ml-1">
                  Cape Town and surrounds — pick the suburb closest to your address (we use it to match cleaners).
                </p>
                {location && (
                  <p className="text-xs text-gray-500 mt-2 ml-1">
                    House Cleaning in {location} available with trusted local cleaners.
                  </p>
                )}
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
                <div className={['px-5 py-4 border-b border-gray-100', selectedServiceData ? selectedServiceData.bgSelected : ''].join(' ')}>
                  <div className="flex items-center gap-2">
                    {selectedServiceData?.icon && (
                      <div className={['w-5 h-5', selectedServiceData.selectedColor].join(' ')}>{selectedServiceData.icon}</div>
                    )}
                    <h2 id="studio-heading" className="text-base font-bold text-gray-900">
                      Studio Details
                    </h2>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">Adjust to match your space for an accurate quote</p>
                </div>
                <div className="mx-5 mt-4 flex items-start gap-2.5 bg-violet-50 border border-violet-100 rounded-xl px-4 py-3">
                  <Info className="w-4 h-4 text-violet-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-violet-800 leading-relaxed">
                    Studios are treated as open-plan spaces with no separate bedroom. Pricing is based on 1 bathroom plus any extra
                    rooms.
                  </p>
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
                <div className={['px-5 py-4 border-b border-gray-100', selectedServiceData ? selectedServiceData.bgSelected : ''].join(' ')}>
                  <div className="flex items-center gap-2">
                    {selectedServiceData?.icon && (
                      <div className={['w-5 h-5', selectedServiceData.selectedColor].join(' ')}>{selectedServiceData.icon}</div>
                    )}
                    <h2 id="rooms-heading" className="text-base font-bold text-gray-900">
                      Home Details
                    </h2>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">Adjust to match your property for an accurate quote</p>
                </div>
                <div className="px-5 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-[0_-4px_32px_rgba(0,0,0,0.08)]">
        <AnimatePresence>
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="overflow-hidden"
          >
            <div className="px-4 pt-3 pb-1 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1 pr-2 space-y-0.5">
                <p className="text-xs text-gray-500 font-medium truncate">
                  {data.pricingMode === 'basic' ? (
                    <>
                      Quick Clean (1 cleaner)
                      {data.basicPlannedHours != null ? ` · ${data.basicPlannedHours}h` : ''}
                    </>
                  ) : selectedService ? (
                    <>
                      {serviceTitle}
                      {displayTotal > 0 && duration !== '—' ? ` · ${duration}` : ''}
                    </>
                  ) : (
                    'Select a service & property'
                  )}
                </p>
                {data.pricingMode === 'basic' ? (
                  location ? (
                    <p className="text-xs font-semibold text-violet-600 truncate">{location}</p>
                  ) : (
                    <p className="text-xs text-gray-400">Area required</p>
                  )
                ) : propertyType ? (
                  <p className="text-xs font-semibold text-violet-600 capitalize truncate">{propertyType}</p>
                ) : (
                  <p className="text-xs text-gray-400">Property &amp; area required</p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <motion.p
                  key={displayTotal}
                  initial={{ y: -4, opacity: 0.6 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-lg font-extrabold text-gray-900"
                >
                  {displayTotal > 0 ? `R ${displayTotal.toLocaleString()}` : '—'}
                </motion.p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">estimated</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <motion.button
            type="button"
            onClick={handleContinue}
            animate={isValid ? { opacity: 1 } : { opacity: 0.45 }}
            whileTap={isValid ? { scale: 0.97 } : {}}
            disabled={!isValid}
            className={[
              'w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-200',
              isValid
                ? 'bg-violet-600 text-white shadow-md shadow-violet-200 hover:bg-violet-700 cursor-pointer'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed',
            ].join(' ')}
          >
            {isValid ? (
              <>
                Continue to Step 2 <ArrowRight size={18} />
              </>
            ) : (
              <>
                {data.pricingMode === 'basic'
                  ? 'Choose hours & area to continue'
                  : 'Complete service, property & area to continue'}
              </>
            )}
          </motion.button>
          {attempted && !isValid && (
            <p className="text-xs text-red-500 text-center mt-2">{validationMessage}</p>
          )}
        </div>
      </div>
    </div>
  );
}
