'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
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

import type { BookingFormData } from './booking-system-types';
import { BookingFlowStepIndicator } from '@/components/booking-flow-step-indicator';
import { getAllSuburbsForCity } from '@/lib/location-data';

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
interface BreakdownRow {
  id: string;
  label: string;
  value: number;
}

const SERVICES: ServiceOption[] = [
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
    bedroomPrice: 0,
    bathroomPrice: 0,
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
const PROPERTY_TYPES: { id: StepPropertyType; label: string; icon: React.ReactNode }[] = [
  { id: 'apartment', label: 'Apartment', icon: <Building2 className="w-4 h-4" /> },
  { id: 'house', label: 'House', icon: <Home className="w-4 h-4" /> },
  { id: 'studio', label: 'Studio', icon: <StudioIcon className="w-4 h-4" /> },
  { id: 'office', label: 'Office', icon: <Briefcase className="w-4 h-4" /> },
];
/** Suburbs should match entries in cleaner `areas` in Supabase; `/api/cleaners/available` unions suburb+city and sorts by rating/reliability. */
const AREAS: AreaOption[] = getAllSuburbsForCity('Cape Town')
  .map((s) => ({ label: s.name, suburb: s.name }))
  .sort((a, b) => a.label.localeCompare(b.label, 'en-ZA'));
const CARPET_PRICE_PER_ROOM = 55;
const CARPET_PRICE_PER_RUG = 35;
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
  hasReception: boolean
): number =>
  service.basePrice +
  boardrooms * service.boardroomPrice +
  privateOffices * service.privateOfficePrice +
  openAreas * service.openAreaPrice +
  officeBathrooms * OFFICE_BATHROOM_PRICE +
  kitchens * OFFICE_KITCHEN_PRICE +
  (hasReception ? OFFICE_RECEPTION_PRICE : 0);

const calcCarpetPrice = (rooms: number, rugs: number, extra: boolean): number =>
  rooms * CARPET_PRICE_PER_ROOM + rugs * CARPET_PRICE_PER_RUG + (extra ? EXTRA_CLEANER_PRICE : 0);

const calcDuration = (serviceId: ServiceId | null, carpetRooms: number): string => {
  if (!serviceId) return '—';
  if (serviceId === 'carpet') {
    const hrs = Math.max(1, carpetRooms) * 0.75;
    return `~${hrs.toFixed(1)} hrs`;
  }
  return DURATION_MAP[serviceId];
};

const ServiceCard = ({
  service,
  selected,
  onSelect,
}: {
  service: ServiceOption;
  selected: boolean;
  onSelect: (id: ServiceId) => void;
}) => (
  <motion.button
    type="button"
    whileTap={{ scale: 0.97 }}
    onClick={() => onSelect(service.id)}
    className={[
      'relative w-full text-left rounded-2xl border-2 p-4 flex items-start gap-3 transition-all duration-200 cursor-pointer shadow-sm',
      selected
        ? `${service.borderSelected} ${service.bgSelected} shadow-md`
        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md',
    ].join(' ')}
    aria-pressed={selected}
  >
    <div
      className={[
        'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-200',
        selected ? `${service.bgSelected} ${service.selectedColor}` : `bg-gray-100 ${service.color}`,
      ].join(' ')}
    >
      {service.icon}
    </div>
    <div className="flex-1 min-w-0">
      <p
        className={['font-semibold text-sm leading-tight', selected ? 'text-gray-900' : 'text-gray-800'].join(' ')}
      >
        {service.label}
      </p>
      <p className="text-xs text-gray-500 mt-0.5 leading-snug">{service.tagline}</p>
      <p className={['text-xs font-bold mt-1', selected ? service.selectedColor : 'text-gray-600'].join(' ')}>
        {service.id === 'carpet'
          ? `From ${formatPrice(CARPET_PRICE_PER_ROOM)}/room`
          : `From ${formatPrice(service.basePrice + service.bedroomPrice)}`}
      </p>
    </div>
    <AnimatePresence>
      {selected && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className={['flex-shrink-0 mt-0.5', service.selectedColor].join(' ')}
        >
          <CheckCircle2 className="w-5 h-5" />
        </motion.div>
      )}
    </AnimatePresence>
  </motion.button>
);

const Stepper = ({
  label,
  sublabel,
  icon,
  value,
  onChange,
  min,
  max,
  accentClass,
}: {
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  accentClass?: string;
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
    <div className="flex items-center gap-3">
      <motion.button
        type="button"
        whileTap={{ scale: 0.88 }}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed active:bg-gray-100 transition-colors"
        aria-label={`Decrease ${label}`}
      >
        <Minus className="w-4 h-4" />
      </motion.button>
      <motion.span
        key={value}
        initial={{ scale: 1.25, opacity: 0.6 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-7 text-center text-base font-bold text-gray-900 tabular-nums"
      >
        {value}
      </motion.span>
      <motion.button
        type="button"
        whileTap={{ scale: 0.88 }}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className={[
          'w-10 h-10 rounded-full border-2 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors',
          accentClass || 'border-violet-500 bg-violet-50 text-violet-600 active:bg-violet-100',
        ].join(' ')}
        aria-label={`Increase ${label}`}
      >
        <Plus className="w-4 h-4" />
      </motion.button>
    </div>
  </div>
);

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
      <div
        className={[
          'flex items-center gap-2 w-full px-4 py-3 rounded-xl border-2 bg-white transition-all duration-150',
          open ? 'border-violet-500 ring-2 ring-violet-100' : error ? 'border-red-400' : 'border-gray-200',
        ].join(' ')}
      >
        <MapPin
          className={['w-4 h-4 flex-shrink-0 transition-colors', open ? 'text-violet-500' : 'text-gray-400'].join(' ')}
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
          placeholder="Enter your suburb or area"
          className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none min-w-0"
          aria-label="Location search"
          aria-expanded={open}
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
}

export function BookingStep1Cleaning({
  data,
  setData,
  onContinue,
  onBack,
  liveTotalZar,
  durationLabel,
  dbPricingRows,
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
  const isCarpet = selectedService === 'carpet';
  const isOffice = propertyType === 'office';
  const isStudio = propertyType === 'studio';
  const selectedServiceData = selectedService ? SERVICES.find((s) => s.id === selectedService) : null;

  const effectiveBedrooms = isStudio ? 0 : bedrooms;
  const effectiveBathrooms = isStudio ? Math.max(1, bathrooms) : bathrooms;

  const illustrativePrice = (() => {
    if (!selectedServiceData) return 0;
    if (isCarpet) return calcCarpetPrice(carpetRooms, carpetRugs, extraCleaner);
    if (isOffice)
      return calcOfficePrice(
        selectedServiceData,
        boardrooms,
        privateOffices,
        openAreas,
        officeBathrooms,
        kitchens,
        hasReception
      );
    return calcResidentialPrice(selectedServiceData, effectiveBedrooms, effectiveBathrooms, extraRooms);
  })();

  const displayTotal = liveTotalZar > 0 ? liveTotalZar : illustrativePrice;
  const useDbBreakdown = Boolean(dbPricingRows && dbPricingRows.length > 0);
  const duration = durationLabel || calcDuration(selectedService, carpetRooms);

  const serviceError = attempted && !selectedService;
  const locationError = attempted && !location;
  const propertyTypeError = attempted && !propertyType;
  const isValid = !!selectedService && !!location && !!propertyType;

  const patch = useCallback(
    (partial: Partial<BookingFormData>) => {
      setData((prev) => ({ ...prev, ...partial }));
    },
    [setData]
  );

  const handleServiceSelect = useCallback(
    (id: ServiceId) => {
      patch({ service: stepIdToService(id) });
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
          ? `Kitchen, lounge, dining · ${formatPrice(selectedServiceData.extraRoomPrice)} each`
          : 'Kitchen, lounge, dining',
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
          ? `Kitchen, lounge, dining · ${formatPrice(selectedServiceData.extraRoomPrice)} each`
          : 'Kitchen, lounge, dining',
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
      sublabel: `${formatPrice(OFFICE_BATHROOM_PRICE)} each`,
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
      sublabel: `${formatPrice(OFFICE_KITCHEN_PRICE)} each`,
      icon: <Coffee className="w-4 h-4" />,
      value: kitchens,
      onChange: (v) => patch({ officeKitchens: v }),
      min: 0,
      max: 5,
      accentClass: 'border-indigo-500 bg-indigo-50 text-indigo-600 active:bg-indigo-100',
    },
  ];

  const residentialBreakdown: BreakdownRow[] =
    selectedServiceData && !isCarpet
      ? [
          { id: 'base', label: 'Base rate', value: selectedServiceData.basePrice },
          { id: 'bed', label: `Bedrooms (${effectiveBedrooms})`, value: effectiveBedrooms * selectedServiceData.bedroomPrice },
          {
            id: 'bath',
            label: `Bathrooms (${effectiveBathrooms})`,
            value: effectiveBathrooms * selectedServiceData.bathroomPrice,
          },
          { id: 'extra', label: `Extra rooms (${extraRooms})`, value: extraRooms * selectedServiceData.extraRoomPrice },
        ]
      : [];

  const officeBreakdown: BreakdownRow[] =
    selectedServiceData && !isCarpet && isOffice
      ? [
          { id: 'base', label: 'Base rate', value: selectedServiceData.basePrice },
          { id: 'board', label: `Boardrooms (${boardrooms})`, value: boardrooms * selectedServiceData.boardroomPrice },
          {
            id: 'priv',
            label: `Private offices (${privateOffices})`,
            value: privateOffices * selectedServiceData.privateOfficePrice,
          },
          { id: 'open', label: `Open areas (${openAreas})`, value: openAreas * selectedServiceData.openAreaPrice },
          { id: 'obath', label: `Bathrooms (${officeBathrooms})`, value: officeBathrooms * OFFICE_BATHROOM_PRICE },
          { id: 'kit', label: `Kitchen / Breakroom (${kitchens})`, value: kitchens * OFFICE_KITCHEN_PRICE },
          { id: 'recep', label: 'Reception area', value: hasReception ? OFFICE_RECEPTION_PRICE : 0 },
        ]
      : [];

  const validationMessage = !selectedService
    ? 'Please select a service'
    : !propertyType
      ? 'Please select a property type'
      : 'Please enter your location';

  const serviceTitle = selectedServiceData?.label ?? 'Cleaning';

  return (
    <div className="min-h-screen bg-[#f0f2f5] font-sans">
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
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
            <h1 className="text-lg font-bold text-gray-900 leading-tight">Service & property</h1>
          </div>
        </div>
        <BookingFlowStepIndicator activeStep={1} />
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col lg:flex-row gap-6 items-start pb-40 lg:pb-8">
        <div className="flex-1 min-w-0 flex flex-col gap-6 w-full">
          <p className="text-xs font-bold tracking-widest text-violet-600 uppercase">Step 1 of 4</p>

          <div
            className={['bg-white rounded-2xl shadow-sm border border-gray-100 p-6 transition-all duration-200', serviceError ? 'ring-2 ring-red-300 ring-offset-2' : ''].join(' ')}
          >
            <div className="flex items-start justify-between gap-3 mb-5">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center flex-shrink-0">
                  <Sparkles size={18} className="text-white" />
                </div>
                <div>
                  <h2 id="service-heading" className="text-base font-bold text-gray-900">
                    Choose a service
                  </h2>
                  <p className="text-sm text-gray-500">Pick the cleaning package that fits your needs</p>
                </div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {SERVICES.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  selected={selectedService === service.id}
                  onSelect={handleServiceSelect}
                />
              ))}
            </div>
          </div>

          <section
            aria-labelledby="space-heading"
            className={[
              'bg-white rounded-2xl shadow-sm border transition-all duration-200',
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
                className="bg-white rounded-2xl shadow-sm border border-teal-200 overflow-hidden"
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
                    sublabel={`${formatPrice(CARPET_PRICE_PER_ROOM)} per room`}
                    icon={<Layers className="w-4 h-4" />}
                    value={carpetRooms}
                    onChange={(v) => patch({ carpetRooms: v })}
                    min={1}
                    max={20}
                    accentClass="border-teal-500 bg-teal-50 text-teal-600 active:bg-teal-100"
                  />
                  <Stepper
                    label="Loose rugs"
                    sublabel={`${formatPrice(CARPET_PRICE_PER_RUG)} per rug`}
                    icon={<LayoutGrid className="w-4 h-4" />}
                    value={carpetRugs}
                    onChange={(v) => patch({ carpetRugs: v })}
                    min={0}
                    max={10}
                    accentClass="border-teal-500 bg-teal-50 text-teal-600 active:bg-teal-100"
                  />
                  <ToggleRow
                    label="Extra cleaner"
                    sublabel={`Faster service · ${formatPrice(EXTRA_CLEANER_PRICE)} add-on`}
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
                className="bg-white rounded-2xl shadow-sm border border-indigo-200 overflow-hidden"
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
                    sublabel={`Include reception · ${formatPrice(OFFICE_RECEPTION_PRICE)} add-on`}
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
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
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
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
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
                <div className="px-5 py-2">
                  {residentialSteppers.map((row) => (
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
          </AnimatePresence>
        </div>

        <aside
          className="hidden lg:flex w-full lg:w-72 flex-shrink-0 lg:sticky lg:top-6 flex-col gap-4"
          aria-label="Pricing summary"
        >
          <div className="rounded-2xl overflow-hidden shadow-md">
            <div className="bg-gradient-to-br from-violet-600 to-violet-800 px-5 py-5">
              <p className="text-violet-200 text-xs font-semibold tracking-widest uppercase mb-1">Your Estimate</p>
              <motion.p
                key={displayTotal}
                initial={{ scale: 1.06, opacity: 0.7 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-4xl font-extrabold text-white tracking-tight"
              >
                {displayTotal > 0 ? `R ${displayTotal.toLocaleString()}` : '—'}
              </motion.p>
              <p className="text-violet-300 text-sm mt-1 font-medium">
                {selectedService ? (
                  <>
                    {serviceTitle}
                    {displayTotal > 0 && duration !== '—' ? ` · ${duration}` : ''}
                  </>
                ) : (
                  'Select a service'
                )}
              </p>
            </div>

            <div className="bg-white px-5 py-4 flex flex-col gap-3">
                {!selectedService && <p className="text-xs text-gray-400 text-center py-3">Select a service to see pricing</p>}

                {propertyType && (
                  <div className="flex items-center gap-2 pb-1">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Property</span>
                    <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full capitalize">
                      {propertyType}
                    </span>
                  </div>
                )}

                {useDbBreakdown && (
                  <div className="space-y-2">
                    {dbPricingRows!
                      .filter((r) => r.value !== 0)
                      .map((row) => (
                        <div key={row.id} className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">{row.label}</span>
                          <motion.span
                            key={`${row.id}-${row.value}`}
                            initial={{ opacity: 0.5, y: -2 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-sm font-semibold text-gray-900"
                          >
                            {formatPrice(row.value)}
                          </motion.span>
                        </div>
                      ))}
                  </div>
                )}

                {!useDbBreakdown && selectedServiceData && !isCarpet && isOffice && (
                  <div className="space-y-2">
                    {officeBreakdown
                      .filter((r) => r.value > 0)
                      .map((row) => (
                        <div key={row.id} className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">{row.label}</span>
                          <motion.span
                            key={`${row.id}-${row.value}`}
                            initial={{ opacity: 0.5, y: -2 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-sm font-semibold text-gray-900"
                          >
                            {formatPrice(row.value)}
                          </motion.span>
                        </div>
                      ))}
                  </div>
                )}

                {!useDbBreakdown && selectedServiceData && !isCarpet && !isOffice && (
                  <div className="space-y-2">
                    {residentialBreakdown
                      .filter((r) => r.value > 0)
                      .map((row) => (
                        <div key={row.id} className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">{row.label}</span>
                          <motion.span
                            key={`${row.id}-${row.value}`}
                            initial={{ opacity: 0.5, y: -2 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-sm font-semibold text-gray-900"
                          >
                            {formatPrice(row.value)}
                          </motion.span>
                        </div>
                      ))}
                  </div>
                )}

                {!useDbBreakdown && isCarpet && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">
                        Carpeted rooms ({carpetRooms})
                      </span>
                      <motion.span
                        key={carpetRooms}
                        initial={{ opacity: 0.5, y: -2 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm font-semibold text-gray-900"
                      >
                        {formatPrice(carpetRooms * CARPET_PRICE_PER_ROOM)}
                      </motion.span>
                    </div>
                    {carpetRugs > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Loose rugs ({carpetRugs})</span>
                        <motion.span
                          key={carpetRugs}
                          initial={{ opacity: 0.5, y: -2 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-sm font-semibold text-gray-900"
                        >
                          {formatPrice(carpetRugs * CARPET_PRICE_PER_RUG)}
                        </motion.span>
                      </div>
                    )}
                    {extraCleaner && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Extra cleaner</span>
                        <span className="text-sm font-semibold text-gray-900">{formatPrice(EXTRA_CLEANER_PRICE)}</span>
                      </div>
                    )}
                  </div>
                )}

                {location && (
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-sm text-gray-500">Area</span>
                    <span className="text-sm font-semibold text-gray-900 truncate max-w-40 text-right">{location}</span>
                  </div>
                )}

                {displayTotal > 0 && (
                  <div className="border-t border-gray-100 pt-3 flex justify-between text-sm font-bold text-gray-900">
                    <span>Total estimate</span>
                    <motion.span key={displayTotal} initial={{ scale: 1.1 }} animate={{ scale: 1 }}>
                      R {displayTotal.toLocaleString()}
                    </motion.span>
                  </div>
                )}

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
            </div>
          </div>
        </aside>
      </div>

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
                  {selectedService ? (
                    <>
                      {serviceTitle}
                      {displayTotal > 0 && duration !== '—' ? ` · ${duration}` : ''}
                    </>
                  ) : (
                    'Select a service & property'
                  )}
                </p>
                {propertyType ? (
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
              <>Complete service, property & area to continue</>
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
