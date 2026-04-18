'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  ChevronLeft,
  Star,
  Clock,
  MapPin,
  Check,
  Loader2,
  AlertCircle,
  Home,
  Sparkles,
  Truck,
  Wind,
  Gift,
  Headphones,
  Plus,
  Minus,
  Refrigerator,
  WashingMachine,
  UtensilsCrossed,
  Shirt,
  Package,
  Sofa,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BookingStep, FlowCleaner, FlowExtra, FlowService, FlowTimeSlot } from './types';
import type { BookingFormData } from '@/lib/useBookingFormData';
import {
  DAYS_OF_WEEK,
  formatWeekRangeLabel,
  formatSelectedDateLong,
  toDateStr,
  isAllowedBookingDate,
  daysFromTodayStart,
} from '@/shared/booking-engine/booking-dates';
import {
  getAvailabilityStyle,
  getAvailabilityUrgencyLabel,
  type BookingAbVariant,
} from '@/lib/booking-slot-availability-styles';

const CLEANER_GRADIENTS = [
  'from-blue-500 to-blue-600',
  'from-violet-500 to-violet-600',
  'from-emerald-500 to-emerald-600',
  'from-amber-500 to-amber-600',
  'from-rose-500 to-rose-600',
  'from-cyan-500 to-cyan-600',
];

export function serviceVisual(id: string): {
  bg: string;
  color: string;
  active: string;
  popular?: boolean;
  Icon: React.ComponentType<{ className?: string; size?: number }>;
} {
  switch (id) {
    case 'Standard':
      return {
        bg: 'bg-blue-50',
        color: 'text-blue-600',
        active: 'border-blue-500 shadow-blue-100',
        Icon: Home,
      };
    case 'Deep':
      return {
        bg: 'bg-violet-50',
        color: 'text-violet-600',
        active: 'border-violet-500 shadow-violet-100',
        popular: true,
        Icon: Sparkles,
      };
    case 'Airbnb':
      return {
        bg: 'bg-amber-50',
        color: 'text-amber-600',
        active: 'border-amber-500 shadow-amber-100',
        Icon: Star,
      };
    case 'Move In/Out':
      return {
        bg: 'bg-emerald-50',
        color: 'text-emerald-600',
        active: 'border-emerald-500 shadow-emerald-100',
        Icon: Truck,
      };
    case 'Carpet':
      return {
        bg: 'bg-rose-50',
        color: 'text-rose-600',
        active: 'border-rose-500 shadow-rose-100',
        Icon: Wind,
      };
    default:
      return {
        bg: 'bg-gray-50',
        color: 'text-gray-700',
        active: 'border-gray-500 shadow-gray-100',
        Icon: Home,
      };
  }
}

function ExtraVisual({ name, id }: { name: string; id: string }) {
  const n = `${name} ${id}`.toLowerCase();
  if (n.includes('fridge')) return <Refrigerator className="w-[18px] h-[18px]" />;
  if (n.includes('laundry') || n.includes('wash'))
    return <WashingMachine className="w-[18px] h-[18px]" />;
  if (n.includes('oven')) return <UtensilsCrossed className="w-[18px] h-[18px]" />;
  if (n.includes('iron')) return <Shirt className="w-[18px] h-[18px]" />;
  if (n.includes('cabinet')) return <Package className="w-[18px] h-[18px]" />;
  if (n.includes('upholstery') || n.includes('sofa')) return <Sofa className="w-[18px] h-[18px]" />;
  return <Sparkles className="w-[18px] h-[18px]" />;
}

function extraStyle(name: string, id: string): { color: string; bg: string } {
  const n = `${name} ${id}`.toLowerCase();
  if (n.includes('fridge')) return { color: 'text-cyan-600', bg: 'bg-cyan-50' };
  if (n.includes('laundry')) return { color: 'text-violet-600', bg: 'bg-violet-50' };
  if (n.includes('oven')) return { color: 'text-orange-600', bg: 'bg-orange-50' };
  if (n.includes('iron')) return { color: 'text-rose-600', bg: 'bg-rose-50' };
  if (n.includes('cabinet')) return { color: 'text-emerald-600', bg: 'bg-emerald-50' };
  if (n.includes('upholstery') || n.includes('sofa')) return { color: 'text-blue-600', bg: 'bg-blue-50' };
  return { color: 'text-gray-600', bg: 'bg-gray-50' };
}

export type BookingFlowViewProps = {
  steps: BookingStep[];
  step: number;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  onBack: () => void;
  formatZar: (n: number) => string;
  /** Service */
  services: FlowService[];
  selectedService: string;
  onSelectService: (svc: FlowService) => void;
  formData: BookingFormData | null;
  /** Rooms (step 1 configure + summary) */
  bedrooms: number;
  bathrooms: number;
  extraRooms: number;
  setBedrooms: (n: number) => void;
  setBathrooms: (n: number) => void;
  setExtraRooms: (n: number) => void;
  isCarpet: boolean;
  /** Date & time */
  goDatePrev: () => void;
  goDateNext: () => void;
  canGoDatePrev: boolean;
  canGoDateNext: boolean;
  selectableDates: Date[];
  stateDate: string;
  setDateAndClearTime: (iso: string) => void;
  parsedSummaryDate: Date | null;
  timeSlots: FlowTimeSlot[];
  slotOcc: { status: 'idle' | 'loading' | 'success' | 'error'; errorMessage: string | null };
  stateTime: string;
  setTime: (id: string) => void;
  firstAvailableSlotId: string | null;
  abVariant: BookingAbVariant | null;
  onContinueFromStep2: () => void;
  /** Cleaners */
  isTeamService: boolean;
  cleanersLoading: boolean;
  teamsLoading: boolean;
  flowCleaners: FlowCleaner[];
  stateCleanerId: string | null;
  setCleanerId: (id: string) => void;
  /** Extras */
  extrasList: FlowExtra[];
  selectedExtraIds: string[];
  toggleExtra: (id: string) => void;
  provideEquipment: boolean;
  setProvideEquipment: (v: boolean) => void;
  equipmentCharge: number;
  showEquipmentOption: boolean;
  /** Payment */
  paymentError: string | null;
  displayAddress: string;
  hasCustomerAddress: boolean;
  profilePhoneOk: boolean;
  paying: boolean;
  onPay: () => void;
  displayTotalZar: number;
  linePricing: {
    subtotal: number;
    serviceFee: number;
    frequencyDiscount: number;
  } | null;
  checkoutFinalZar: number | null;
  currentService: FlowService | undefined;
  currentCleaner: FlowCleaner | undefined;
  rewardPoints: number;
  supportWhatsAppHref: string;
};

export function BookingFlowView({
  steps,
  step,
  setStep,
  onBack,
  formatZar,
  services,
  selectedService,
  onSelectService,
  formData,
  bedrooms,
  bathrooms,
  extraRooms,
  setBedrooms,
  setBathrooms,
  setExtraRooms,
  isCarpet,
  goDatePrev,
  goDateNext,
  canGoDatePrev,
  canGoDateNext,
  selectableDates,
  stateDate,
  setDateAndClearTime,
  parsedSummaryDate,
  timeSlots,
  slotOcc,
  stateTime,
  setTime,
  firstAvailableSlotId,
  abVariant,
  onContinueFromStep2,
  isTeamService,
  cleanersLoading,
  teamsLoading,
  flowCleaners,
  stateCleanerId,
  setCleanerId,
  extrasList,
  selectedExtraIds,
  toggleExtra,
  provideEquipment,
  setProvideEquipment,
  equipmentCharge,
  showEquipmentOption,
  paymentError,
  displayAddress,
  hasCustomerAddress,
  profilePhoneOk,
  paying,
  onPay,
  displayTotalZar,
  linePricing,
  checkoutFinalZar,
  currentService,
  currentCleaner,
  rewardPoints,
  supportWhatsAppHref,
}: BookingFlowViewProps) {
  const summaryDateShort =
    parsedSummaryDate &&
    parsedSummaryDate.toLocaleDateString('en-ZA', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const selectedTimeLabel = timeSlots.find((t) => t.id === stateTime)?.time ?? '—';

  const canProceed =
    step === 1
      ? !!selectedService
      : step === 2
        ? !!stateDate && !!stateTime
        : step === 3
          ? !!stateCleanerId
          : step === 4
            ? true
            : step === 5
              ? profilePhoneOk && hasCustomerAddress
              : false;

  const footerDisabled =
    !canProceed ||
    paying ||
    (step === 5 && (!hasCustomerAddress || !profilePhoneOk));

  return (
    <div className="flex flex-col min-h-0 bg-[#f0f2f8]">
      <div className="px-4 sm:px-6 lg:px-8 pt-4 pb-2 flex-shrink-0 bg-[#f0f2f8]">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide">
          {steps.map((s, index) => {
            const stepNum = s.id;
            const isCompleted = stepNum < step;
            const isActive = stepNum === step;
            return (
              <React.Fragment key={s.id}>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <div
                    className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-[10.5px] font-bold transition-all flex-shrink-0',
                      isCompleted
                        ? 'bg-emerald-500 text-white'
                        : isActive
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                          : 'bg-gray-100 text-gray-400'
                    )}
                  >
                    {isCompleted ? <Check className="w-3 h-3" /> : <span>{stepNum}</span>}
                  </div>
                  <span
                    className={cn(
                      'text-[11.5px] font-semibold whitespace-nowrap',
                      isActive ? 'text-blue-600' : isCompleted ? 'text-emerald-600' : 'text-gray-400'
                    )}
                  >
                    {s.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 min-w-[12px] h-px mx-1.5',
                      stepNum < step ? 'bg-emerald-300' : 'bg-gray-200'
                    )}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-5 px-4 sm:px-6 lg:px-8 pb-28 lg:pb-8 pt-2 min-h-0 overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-y-auto">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-3 pb-4"
              >
                <div>
                  <h2 className="text-[20px] font-bold text-gray-900">Choose a service</h2>
                  <p className="text-[12.5px] text-gray-400 mt-0.5">
                    Select the type of clean that fits your needs
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
                  {services.map((svc) => {
                    const vis = serviceVisual(svc.id);
                    const Icon = vis.Icon;
                    const isSelected = selectedService === svc.id;
                    return (
                      <motion.button
                        key={svc.id}
                        type="button"
                        onClick={() => onSelectService(svc)}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        className={cn(
                          'relative text-left p-3.5 rounded-2xl border-2 transition-all duration-200 bg-white',
                          isSelected
                            ? `${vis.active} border-2 shadow-lg`
                            : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'
                        )}
                      >
                        {vis.popular && (
                          <span className="absolute -top-2 left-2.5 bg-gradient-to-r from-violet-600 to-blue-600 text-white text-[8.5px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                            Popular
                          </span>
                        )}
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-2.5 right-2.5 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center"
                          >
                            <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                          </motion.div>
                        )}
                        <div
                          className={cn(
                            'w-9 h-9 rounded-xl flex items-center justify-center mb-2.5',
                            vis.bg,
                            vis.color
                          )}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <p className="text-[12.5px] font-bold text-gray-900 leading-tight">{svc.name}</p>
                        <p className="text-[10.5px] text-gray-400 leading-snug mt-0.5 mb-2 line-clamp-2">
                          {svc.description}
                        </p>
                        <p className="text-[11px] text-gray-400 flex items-center gap-1 mb-1">
                          <Clock className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{svc.duration}</span>
                        </p>
                        <p
                          className={cn(
                            'text-[13.5px] font-extrabold',
                            isSelected ? vis.color : 'text-gray-700'
                          )}
                        >
                          {svc.price}
                        </p>
                      </motion.button>
                    );
                  })}
                </div>

                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <p className="text-[10.5px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                    Configure your home
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      {
                        key: 'bed',
                        label: isCarpet ? 'Fitted carpet rooms' : 'Bedrooms',
                        value: bedrooms,
                        set: setBedrooms,
                        min: isCarpet ? 0 : 1,
                      },
                      {
                        key: 'bath',
                        label: isCarpet ? 'Loose rugs' : 'Bathrooms',
                        value: bathrooms,
                        set: setBathrooms,
                        min: isCarpet ? 0 : 1,
                      },
                      {
                        key: 'extra',
                        label: 'Extra rooms',
                        value: extraRooms,
                        set: setExtraRooms,
                        min: 0,
                        hide: isCarpet,
                      },
                    ]
                      .filter((x) => !('hide' in x && x.hide))
                      .map((row) => (
                        <div
                          key={row.key}
                          className="flex items-center justify-between bg-gray-50 rounded-xl px-3.5 py-2.5"
                        >
                          <div>
                            <p className="text-[12px] font-semibold text-gray-700">{row.label}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => row.set(Math.max(row.min, row.value - 1))}
                              className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:border-blue-400 hover:text-blue-600 transition-all shadow-sm"
                            >
                              <Minus className="w-2.5 h-2.5" />
                            </button>
                            <span className="text-[14px] font-bold text-gray-900 w-5 text-center tabular-nums">
                              {row.value}
                            </span>
                            <button
                              type="button"
                              onClick={() => row.set(Math.min(20, row.value + 1))}
                              className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:border-blue-400 hover:text-blue-600 transition-all shadow-sm"
                            >
                              <Plus className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2 mt-auto">
                  <button
                    type="button"
                    onClick={onBack}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-gray-200 text-[13px] font-semibold text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-all"
                  >
                    <ChevronLeft className="w-[15px] h-[15px]" />
                    <span>Cancel</span>
                  </button>
                  <motion.button
                    type="button"
                    whileHover={selectedService ? { scale: 1.01 } : {}}
                    whileTap={selectedService ? { scale: 0.98 } : {}}
                    disabled={!selectedService}
                    onClick={() => selectedService && setStep(2)}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-bold transition-all',
                      selectedService
                        ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-200 hover:shadow-xl'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    )}
                  >
                    <span>Continue</span>
                    <ChevronRight className="w-[15px] h-[15px]" />
                  </motion.button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-3 pb-4"
              >
                <div>
                  <h2 className="text-[20px] font-bold text-gray-900">Pick a date &amp; time</h2>
                  <p className="text-[12.5px] text-gray-400 mt-0.5">
                    Select when you&apos;d like your cleaner to arrive
                  </p>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                  <p className="text-[10.5px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                    Date
                  </p>
                  <div className="flex items-center justify-between mb-3">
                    <button
                      type="button"
                      onClick={goDatePrev}
                      disabled={!canGoDatePrev}
                      className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center hover:border-blue-400 hover:text-blue-600 transition-all disabled:opacity-30"
                    >
                      <ChevronLeft className="w-[13px] h-[13px]" />
                    </button>
                    <div className="text-center px-2">
                      <p className="text-[9.5px] font-bold text-gray-400 uppercase tracking-widest">
                        Pick a week
                      </p>
                      <p className="text-[12.5px] font-bold text-gray-800">
                        {formatWeekRangeLabel(selectableDates)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={goDateNext}
                      disabled={!canGoDateNext}
                      className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center hover:border-blue-400 hover:text-blue-600 transition-all disabled:opacity-30"
                    >
                      <ChevronRight className="w-[13px] h-[13px]" />
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {selectableDates.map((cellDate) => {
                      const iso = toDateStr(cellDate);
                      const dow = DAYS_OF_WEEK[cellDate.getDay()];
                      const isSelected = stateDate === iso;
                      const isTodayCell = daysFromTodayStart(cellDate) === 0;
                      const allowed = isAllowedBookingDate(cellDate);
                      return (
                        <button
                          key={iso}
                          type="button"
                          disabled={!allowed}
                          onClick={() => allowed && setDateAndClearTime(iso)}
                          className={cn(
                            'flex flex-col items-center py-2.5 px-1 rounded-xl transition-all duration-150',
                            !allowed && 'opacity-30 cursor-not-allowed',
                            isSelected
                              ? 'bg-gradient-to-b from-blue-600 to-violet-600 text-white shadow-md shadow-blue-200'
                              : isTodayCell
                                ? 'ring-2 ring-blue-400 bg-white text-blue-700 font-bold'
                                : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                          )}
                        >
                          <span
                            className={cn(
                              'text-[9.5px] font-bold uppercase tracking-wide',
                              isSelected ? 'text-blue-200' : 'text-gray-400'
                            )}
                          >
                            {dow}
                          </span>
                          <span
                            className={cn(
                              'text-[17px] font-extrabold leading-tight mt-0.5',
                              isSelected ? 'text-white' : 'text-gray-800'
                            )}
                          >
                            {cellDate.getDate()}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {parsedSummaryDate && (
                    <p className="text-[12.5px] font-bold text-blue-600 mt-3">
                      {formatSelectedDateLong(parsedSummaryDate)}
                    </p>
                  )}
                </div>

                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-[13px] text-gray-400" />
                    <p className="text-[10.5px] font-bold text-gray-400 uppercase tracking-widest">
                      Time
                    </p>
                  </div>
                  {slotOcc.status === 'error' && slotOcc.errorMessage ? (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-2">
                      {slotOcc.errorMessage}
                    </p>
                  ) : null}
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {timeSlots.map((slot) => {
                      const showFullStyle = slotOcc.status === 'success' && !slot.available;
                      const occupancyReady = slotOcc.status === 'success';
                      const subline =
                        slotOcc.status === 'loading'
                          ? 'Loading…'
                          : slotOcc.status === 'error'
                            ? '—'
                            : getAvailabilityUrgencyLabel(slot.remaining ?? 0, abVariant ?? 'A');
                      const isRecommended =
                        occupancyReady && slot.available && firstAvailableSlotId === slot.id;
                      const isSelected = stateTime === slot.id;
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          disabled={!slot.available}
                            onClick={() => {
                            if (slot.available) {
                              setTime(slot.id);
                            }
                          }}
                          className={cn(
                            'relative flex flex-col items-center justify-center py-3 px-2 rounded-xl border transition-all duration-150 min-h-[4.25rem]',
                            showFullStyle || !slot.available
                              ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed line-through'
                              : isSelected
                                ? 'bg-gradient-to-b from-blue-600 to-violet-600 border-transparent text-white shadow-md shadow-blue-200'
                                : 'bg-gray-50 border-gray-100 hover:border-blue-200 hover:bg-blue-50'
                          )}
                        >
                          {isRecommended && slot.available && (
                            <span
                              className={cn(
                                'text-[8px] font-bold uppercase tracking-wide mb-0.5',
                                isSelected ? 'text-blue-200' : 'text-blue-500'
                              )}
                            >
                              Rec.
                            </span>
                          )}
                          <span
                            className={cn(
                              'text-[12.5px] font-bold',
                              isSelected ? 'text-white' : 'text-gray-800'
                            )}
                          >
                            {slot.time}
                          </span>
                          <span
                            className={cn(
                              'text-[9.5px] font-medium mt-0.5 text-center px-0.5',
                              isSelected ? 'text-blue-200' : 'text-emerald-600'
                            )}
                          >
                            {occupancyReady ? (
                              <span
                                className={cn(
                                  'rounded px-1 py-0.5',
                                  !isSelected && getAvailabilityStyle(slot.remaining ?? 0)
                                )}
                              >
                                {subline}
                              </span>
                            ) : (
                              subline
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-gray-200 text-[13px] font-semibold text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-all"
                  >
                    <ChevronLeft className="w-[15px] h-[15px]" />
                    <span>Back</span>
                  </button>
                  <motion.button
                    type="button"
                    whileHover={stateDate && stateTime ? { scale: 1.01 } : {}}
                    whileTap={stateDate && stateTime ? { scale: 0.98 } : {}}
                    disabled={!stateDate || !stateTime}
                    onClick={onContinueFromStep2}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-bold transition-all',
                      stateDate && stateTime
                        ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-200 hover:shadow-xl'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    )}
                  >
                    <span>Continue</span>
                    <ChevronRight className="w-[15px] h-[15px]" />
                  </motion.button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-3 pb-4"
              >
                <div>
                  <h2 className="text-[20px] font-bold text-gray-900">
                    {isTeamService ? 'Choose your team' : 'Choose your cleaner'}
                  </h2>
                  <p className="text-[12.5px] text-gray-400 mt-0.5">
                    {isTeamService
                      ? 'Deep and move bookings use a coordinated crew'
                      : 'Available cleaners for your area and time slot'}
                  </p>
                </div>

                {(cleanersLoading && !isTeamService) || (teamsLoading && isTeamService) ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500 py-12 justify-center">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {isTeamService ? 'Loading team availability…' : 'Loading cleaners…'}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {flowCleaners.length === 0 && isTeamService ? (
                      <p className="col-span-full text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl p-4">
                        No teams are free for this date — all crews are already booked. Try another day.
                      </p>
                    ) : flowCleaners.length === 0 && !isTeamService ? (
                      <p className="col-span-full text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl p-4">
                        No cleaners available for this slot. Try another date or time.
                      </p>
                    ) : (
                      flowCleaners.map((cleaner, idx) => {
                        const isSelected = stateCleanerId === cleaner.id;
                        const grad = CLEANER_GRADIENTS[idx % CLEANER_GRADIENTS.length];
                        return (
                          <motion.button
                            key={cleaner.id}
                            type="button"
                            onClick={() => setCleanerId(cleaner.id)}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.97 }}
                            className={cn(
                              'relative text-left p-3.5 rounded-2xl border-2 bg-white transition-all duration-200 flex flex-col gap-2 min-h-[9rem]',
                              isSelected
                                ? 'border-blue-500 shadow-lg shadow-blue-100'
                                : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'
                            )}
                          >
                            {idx === 0 && isTeamService && (
                              <span className="absolute -top-2 left-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white text-[8.5px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                                Available
                              </span>
                            )}
                            <div className="flex items-start justify-between">
                              <div
                                className={cn(
                                  'w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-[13px] shadow-md flex-shrink-0',
                                  grad
                                )}
                              >
                                {cleaner.initial}
                              </div>
                              <motion.div
                                initial={false}
                                animate={{ scale: isSelected ? 1 : 0.7, opacity: isSelected ? 1 : 0 }}
                                className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0"
                              >
                                <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                              </motion.div>
                            </div>
                            <div>
                              <p className="text-[11.5px] font-bold text-gray-900 leading-tight line-clamp-2">
                                {cleaner.name.split(' ')[0]}
                              </p>
                              <p className="text-[10px] text-gray-400 mt-0.5 leading-snug line-clamp-2">
                                {cleaner.specialty}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 mt-auto min-h-[1rem]">
                              {cleaner.rating && cleaner.rating !== '—' ? (
                                <>
                                  <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400 flex-shrink-0" />
                                  <span className="text-[11px] font-bold text-gray-800">{cleaner.rating}</span>
                                  <span className="text-[10px] text-gray-400">· {cleaner.reviews}</span>
                                </>
                              ) : (
                                <span className="text-[10px] text-gray-500">
                                  {cleaner.reviews?.trim() ? cleaner.reviews : 'Team booking'}
                                </span>
                              )}
                            </div>
                          </motion.button>
                        );
                      })
                    )}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-gray-200 text-[13px] font-semibold text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-all"
                  >
                    <ChevronLeft className="w-[15px] h-[15px]" />
                    <span>Back</span>
                  </button>
                  <motion.button
                    type="button"
                    whileHover={stateCleanerId ? { scale: 1.01 } : {}}
                    whileTap={stateCleanerId ? { scale: 0.98 } : {}}
                    disabled={!stateCleanerId}
                    onClick={() => stateCleanerId && setStep(4)}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-bold transition-all',
                      stateCleanerId
                        ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-200 hover:shadow-xl'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    )}
                  >
                    <span>Continue</span>
                    <ChevronRight className="w-[15px] h-[15px]" />
                  </motion.button>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-3 pb-4"
              >
                <div>
                  <h2 className="text-[20px] font-bold text-gray-900">Add extras</h2>
                  <p className="text-[12.5px] text-gray-400 mt-0.5">
                    Enhance your clean with optional add-ons
                  </p>
                </div>

                {extrasList.length === 0 ? (
                  <p className="text-sm text-gray-500">No optional extras for this service type.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {extrasList.map((extra) => {
                      const isSelected = selectedExtraIds.includes(extra.id);
                      const st = extraStyle(extra.name, extra.id);
                      return (
                        <motion.button
                          key={extra.id}
                          type="button"
                          onClick={() => toggleExtra(extra.id)}
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.97 }}
                          className={cn(
                            'relative text-left p-3.5 rounded-2xl border-2 bg-white transition-all duration-200 flex flex-col gap-2 min-h-[10rem]',
                            isSelected
                              ? 'border-blue-500 shadow-lg shadow-blue-100'
                              : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'
                          )}
                        >
                          {extra.name.toLowerCase().includes('fridge') && (
                            <span className="absolute -top-2 left-3 bg-gradient-to-r from-violet-600 to-blue-600 text-white text-[8.5px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                              Popular
                            </span>
                          )}
                          <div className="flex items-start justify-between">
                            <div
                              className={cn(
                                'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0',
                                st.bg,
                                st.color
                              )}
                            >
                              <ExtraVisual name={extra.name} id={extra.id} />
                            </div>
                            <motion.div
                              initial={false}
                              animate={{ scale: isSelected ? 1 : 0.7, opacity: isSelected ? 1 : 0 }}
                              className={cn(
                                'w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0',
                                isSelected ? 'bg-blue-600' : 'bg-gray-100'
                              )}
                            >
                              <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                            </motion.div>
                          </div>
                          <div>
                            <p className="text-[11.5px] font-bold text-gray-900 leading-tight line-clamp-2">
                              {extra.name}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5 leading-snug line-clamp-3">
                              Add-on from your service catalog
                            </p>
                          </div>
                          <p
                            className={cn(
                              'text-[12px] font-extrabold mt-auto',
                              isSelected ? 'text-blue-600' : 'text-gray-700'
                            )}
                          >
                            +{extra.price}
                          </p>
                        </motion.button>
                      );
                    })}
                  </div>
                )}

                {showEquipmentOption && formData?.equipment && (
                  <label className="flex items-start gap-3 cursor-pointer bg-white border-2 rounded-2xl px-4 py-3.5 border-gray-100 shadow-sm">
                    <input
                      type="checkbox"
                      className="mt-1 rounded border-gray-300"
                      checked={provideEquipment}
                      onChange={(e) => setProvideEquipment(e.target.checked)}
                    />
                    <div>
                      <p className="text-sm font-bold text-gray-900">Bring cleaning supplies kit</p>
                      <p className="text-xs text-gray-500">+{formatZar(equipmentCharge)}</p>
                    </div>
                  </label>
                )}

                {selectedExtraIds.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 flex items-center justify-between"
                  >
                    <span className="text-[12px] font-semibold text-blue-700">
                      {selectedExtraIds.length} add-on{selectedExtraIds.length > 1 ? 's' : ''} selected
                    </span>
                  </motion.div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-gray-200 text-[13px] font-semibold text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-all"
                  >
                    <ChevronLeft className="w-[15px] h-[15px]" />
                    <span>Back</span>
                  </button>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setStep(5)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-bold bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-200 hover:shadow-xl transition-all"
                  >
                    <span>Continue</span>
                    <ChevronRight className="w-[15px] h-[15px]" />
                  </motion.button>
                </div>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-3 pb-4"
              >
                <div>
                  <h2 className="text-[20px] font-bold text-gray-900">Payment</h2>
                  <p className="text-[12.5px] text-gray-400 mt-0.5">
                    Complete payment securely via Paystack (card, bank, mobile)
                  </p>
                </div>

                {paymentError && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-3 flex gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{paymentError}</span>
                  </div>
                )}

                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                  <p className="text-[10.5px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                    Checkout
                  </p>
                  <p className="text-[13px] text-gray-600 leading-relaxed">
                    We use Paystack for card and other payment methods. When you continue, you&apos;ll be
                    redirected to complete payment. Your booking stays pending until payment succeeds.
                  </p>
                  <div className="mt-3 flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                    <span className="text-[10px] text-gray-400 font-medium">
                      PCI-compliant checkout · Your card details are handled by Paystack
                    </span>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-blue-700">Service address</p>
                    <p className="text-xs text-blue-600 mt-0.5 break-words">{displayAddress}</p>
                  </div>
                </div>

                {!hasCustomerAddress && (
                  <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-xl p-3">
                    Add a full street address in Profile before paying — we need it for the booking.
                  </p>
                )}
                {hasCustomerAddress && !profilePhoneOk && (
                  <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-xl p-3">
                    Add a valid phone number in Profile before paying (8–15 digits).
                  </p>
                )}

                <div className="lg:hidden bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                    Total due
                  </p>
                  <p className="text-2xl font-extrabold text-blue-600">
                    {linePricing ? formatZar(displayTotalZar) : '—'}
                  </p>
                  {step === 5 && checkoutFinalZar == null && linePricing && (
                    <p className="text-[10px] text-gray-400 mt-1">Confirming surge pricing for your date…</p>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-gray-200 text-[13px] font-semibold text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-all"
                  >
                    <ChevronLeft className="w-[15px] h-[15px]" />
                    <span>Back</span>
                  </button>
                  <motion.button
                    type="button"
                    whileHover={!footerDisabled ? { scale: 1.01 } : {}}
                    whileTap={!footerDisabled ? { scale: 0.98 } : {}}
                    disabled={footerDisabled}
                    onClick={onPay}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-bold transition-all',
                      !footerDisabled
                        ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-200 hover:shadow-xl'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    )}
                  >
                    {paying && <Loader2 className="w-4 h-4 animate-spin" />}
                    <Lock className="w-[13px] h-[13px]" />
                    <span>{paying ? 'Redirecting…' : `Pay ${linePricing ? formatZar(displayTotalZar) : '—'} with Paystack`}</span>
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <aside className="w-full lg:w-[268px] lg:min-w-[268px] flex flex-col gap-3 lg:overflow-y-auto pb-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
              Booking Summary
            </p>

            <div className="mb-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                Home size
              </p>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-gray-500">
                    {isCarpet ? 'Fitted carpet rooms' : 'Bedrooms'}
                  </span>
                  <span className="text-[12px] font-bold text-gray-900">{bedrooms}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-gray-500">
                    {isCarpet ? 'Loose rugs' : 'Bathrooms'}
                  </span>
                  <span className="text-[12px] font-bold text-gray-900">{bathrooms}</span>
                </div>
                {!isCarpet && (
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-gray-500">Extra rooms</span>
                    <span className="text-[12px] font-bold text-gray-900">{extraRooms}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3 mb-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12px] text-gray-500">Service</span>
                <AnimatePresence mode="wait">
                  {currentService ? (
                    <motion.span
                      key={currentService.name}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      className={cn(
                        'text-[11.5px] font-bold text-right',
                        serviceVisual(currentService.id).color
                      )}
                    >
                      {currentService.name}
                    </motion.span>
                  ) : (
                    <span className="text-[11.5px] text-gray-300">Not selected</span>
                  )}
                </AnimatePresence>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12px] text-gray-500">{isTeamService ? 'Team' : 'Cleaner'}</span>
                <AnimatePresence mode="wait">
                  {currentCleaner ? (
                    <motion.span
                      key={currentCleaner.name}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-[11.5px] font-bold text-gray-800 text-right"
                    >
                      {currentCleaner.name.split(' ')[0]}
                    </motion.span>
                  ) : (
                    <span className="text-[11.5px] text-gray-300">Not selected</span>
                  )}
                </AnimatePresence>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12px] text-gray-500">Date</span>
                <motion.span
                  key={summaryDateShort ?? 'none'}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-[11.5px] font-semibold text-gray-800 text-right"
                >
                  {summaryDateShort ?? 'Not selected'}
                </motion.span>
              </div>
              {step >= 2 && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] text-gray-500">Time</span>
                  <motion.span
                    key={stateTime}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-[11.5px] font-semibold text-gray-800"
                  >
                    {selectedTimeLabel}
                  </motion.span>
                </div>
              )}
            </div>

            <AnimatePresence>
              {linePricing && currentService && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-gray-100 pt-3 mb-3 space-y-1.5"
                >
                  <div className="flex justify-between text-[11px] text-gray-400">
                    <span>Subtotal</span>
                    <span className="text-gray-600 font-medium">{formatZar(linePricing.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-400">
                    <span>Service fee</span>
                    <span className="text-gray-600 font-medium">{formatZar(linePricing.serviceFee)}</span>
                  </div>
                  {linePricing.frequencyDiscount > 0 && (
                    <div className="flex justify-between text-[11px] text-gray-400">
                      <span>Frequency discount</span>
                      <span className="text-gray-600 font-medium">
                        −{formatZar(linePricing.frequencyDiscount)}
                      </span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {selectedExtraIds.length > 0 && (
              <div className="border-t border-gray-100 pt-3 mb-3 space-y-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Extras</p>
                {extrasList
                  .filter((e) => selectedExtraIds.includes(e.id))
                  .map((e) => (
                    <div key={e.id} className="flex items-center justify-between">
                      <p className="text-[11px] text-gray-500 truncate pr-2">{e.name}</p>
                      <p className="text-[11px] font-bold text-gray-700 flex-shrink-0">{e.price}</p>
                    </div>
                  ))}
                {provideEquipment && showEquipmentOption && (
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-gray-500">Supplies kit</p>
                    <p className="text-[11px] font-bold text-gray-700">+{formatZar(equipmentCharge)}</p>
                  </div>
                )}
              </div>
            )}

            {provideEquipment && selectedExtraIds.length === 0 && showEquipmentOption && (
              <div className="border-t border-gray-100 pt-3 mb-3 space-y-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Extras</p>
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-gray-500">Supplies kit</p>
                  <p className="text-[11px] font-bold text-gray-700">+{formatZar(equipmentCharge)}</p>
                </div>
              </div>
            )}

            <div className="border-t border-gray-100 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-bold text-gray-800">Total</span>
                <AnimatePresence mode="wait">
                  {linePricing ? (
                    <motion.span
                      key={displayTotalZar}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-[17px] font-extrabold text-blue-600"
                    >
                      {formatZar(displayTotalZar)}
                    </motion.span>
                  ) : (
                    <span className="text-[13px] text-gray-300 font-medium">—</span>
                  )}
                </AnimatePresence>
              </div>
              {step === 5 && checkoutFinalZar == null && linePricing && (
                <p className="text-[10px] text-gray-400 mt-1">Confirming surge pricing for your date…</p>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-violet-600 rounded-2xl p-3.5 text-white">
            <div className="flex items-center gap-2 mb-1.5">
              <Gift className="w-[13px] text-blue-200" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-200">Rewards</p>
            </div>
            <p className="text-[12.5px] font-bold leading-snug">
              Points are credited when your clean is completed.
            </p>
            <p className="text-[10.5px] text-blue-200 mt-0.5">You have {rewardPoints.toLocaleString()} pts</p>
          </div>

          <a
            href={supportWhatsAppHref}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-sm flex items-center gap-3 hover:border-blue-200 transition-colors"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
              <Headphones className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[11.5px] font-bold text-gray-800">Need help choosing?</p>
              <p className="text-[10.5px] text-gray-400">Chat with our team on WhatsApp</p>
            </div>
            <ChevronRight className="w-3 h-3 text-gray-300 ml-auto flex-shrink-0" />
          </a>
        </aside>
      </div>
    </div>
  );
}
