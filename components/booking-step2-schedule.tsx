'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  CheckCircle2,
  Layers,
  PenLine,
  Warehouse,
  Trees,
  Sofa,
  AppWindow,
  Zap,
  MessageSquare,
  Phone,
} from 'lucide-react';
import type { BookingFormData } from '@/components/booking-system-types';
import { BookingFlowStepIndicator } from '@/components/booking-flow-step-indicator';
import { SUPPORT_PHONE_DISPLAY, SUPPORT_PHONE_HREF, SUPPORT_WHATSAPP_URL } from '@/lib/contact';

type Extra = {
  id: string;
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  price: number;
};
type TimeSlot = {
  id: string;
  label: string;
  available: boolean;
};

/** Maps UI extra ids to `BookingFormData.extras` ids (deep / move services). */
const EXTRA_UI_ID_TO_BOOKING: Record<string, string> = {
  carpet: 'carpet_deep',
  ceiling: 'ceiling',
  garage: 'garage',
  balcony: 'balcony',
  couch: 'couch',
  windows: 'exterior_windows',
};

const BOOKING_TO_UI_ID: Record<string, string> = Object.fromEntries(
  Object.entries(EXTRA_UI_ID_TO_BOOKING).map(([ui, booking]) => [booking, ui])
);

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

const EXTRAS: Extra[] = [
  {
    id: 'carpet',
    icon: <Layers size={26} />,
    label: 'Carpet',
    sublabel: 'Cleaning',
    price: 150,
  },
  {
    id: 'ceiling',
    icon: <PenLine size={26} />,
    label: 'Ceiling',
    sublabel: 'Cleaning',
    price: 120,
  },
  {
    id: 'garage',
    icon: <Warehouse size={26} />,
    label: 'Garage',
    sublabel: 'Cleaning',
    price: 200,
  },
  {
    id: 'balcony',
    icon: <Trees size={26} />,
    label: 'Balcony',
    sublabel: 'Cleaning',
    price: 100,
  },
  {
    id: 'couch',
    icon: <Sofa size={26} />,
    label: 'Couch',
    sublabel: 'Cleaning',
    price: 180,
  },
  {
    id: 'windows',
    icon: <AppWindow size={26} />,
    label: 'Windows',
    sublabel: 'Cleaning',
    price: 130,
  },
];

const TIME_SLOTS: TimeSlot[] = [
  { id: '07:00', label: '7:00 AM', available: true },
  { id: '08:00', label: '8:00 AM', available: true },
  { id: '09:00', label: '9:00 AM', available: true },
  { id: '10:00', label: '10:00 AM', available: false },
  { id: '11:00', label: '11:00 AM', available: true },
  { id: '12:00', label: '12:00 PM', available: true },
  { id: '13:00', label: '1:00 PM', available: false },
  { id: '14:00', label: '2:00 PM', available: true },
  { id: '15:00', label: '3:00 PM', available: true },
  { id: '16:00', label: '4:00 PM', available: false },
];

const DAYS_OF_WEEK = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const isToday = (date: Date) => isSameDay(date, TODAY);
const formatSelectedDate = (date: Date) =>
  date.toLocaleDateString('en-ZA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseDateStr(dateStr: string): Date | null {
  if (!dateStr) return null;
  const [y, mo, d] = dateStr.split('-').map(Number);
  if (!y || !mo || !d) return null;
  return new Date(y, mo - 1, d);
}

function uiExtrasFromBookingExtras(extras: string[]): string[] {
  return extras.map((id) => BOOKING_TO_UI_ID[id]).filter((x): x is string => !!x);
}

/** Furthest day (inclusive) from today that can be booked in this UI. */
const MAX_BOOKING_DAYS_FROM_TODAY = 365;

function daysFromTodayStart(d: Date): number {
  const a = new Date(TODAY);
  const b = new Date(d);
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  return Math.round((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000));
}

function isAllowedBookingDate(parsed: Date): boolean {
  const n = daysFromTodayStart(parsed);
  return n >= 0 && n <= MAX_BOOKING_DAYS_FROM_TODAY;
}

/** First day index (0 = today) of a 7-day row that contains `parsed`. */
function offsetForDateToBeVisible(parsed: Date): number {
  const n = daysFromTodayStart(parsed);
  if (n < 0) return 0;
  return Math.floor(n / 7) * 7;
}

/** Seven consecutive days starting `offset` days after today (offset is multiple of 7). */
function getSevenDaysStartingOffset(offsetFromToday: number): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(TODAY);
    d.setDate(TODAY.getDate() + offsetFromToday + i);
    return d;
  });
}

function formatWeekRangeLabel(dates: Date[]): string {
  if (dates.length === 0) return '';
  const a = dates[0];
  const b = dates[dates.length - 1];
  const sameMonth = a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
  if (sameMonth) {
    return `${a.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })} – ${b.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  }
  return `${a.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })} – ${b.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

export interface BookingStep2ScheduleProps {
  data: BookingFormData;
  setData: React.Dispatch<React.SetStateAction<BookingFormData>>;
  onBack: () => void;
  onContinue: () => void;
  pricing: {
    basePrice: number;
    bedroomAdd: number;
    bathroomAdd: number;
    extraRoomAdd: number;
    extrasTotal: number;
    total: number;
  };
  serviceTitle: string;
}

export function BookingStep2Schedule({
  data,
  setData,
  onBack,
  onContinue,
  pricing,
  serviceTitle,
}: BookingStep2ScheduleProps) {
  const [weekStartOffset, setWeekStartOffset] = useState(() => {
    const parsed = parseDateStr(data.date);
    return parsed && isAllowedBookingDate(parsed) ? offsetForDateToBeVisible(parsed) : 0;
  });
  const selectableDates = useMemo(() => getSevenDaysStartingOffset(weekStartOffset), [weekStartOffset]);

  const [selectedDate, setSelectedDate] = useState<Date | null>(() => parseDateStr(data.date));
  const [selectedTime, setSelectedTime] = useState<string | null>(() => (data.time ? data.time : null));

  const selectedExtras = useMemo(() => uiExtrasFromBookingExtras(data.extras), [data.extras]);

  const addonsLine = pricing.bedroomAdd + pricing.bathroomAdd + pricing.extraRoomAdd;
  const totalEstimate = pricing.total;
  const canContinue = selectedDate !== null && selectedTime !== null;

  const canGoDatePrev = weekStartOffset > 0;
  const canGoDateNext = weekStartOffset + 13 <= MAX_BOOKING_DAYS_FROM_TODAY;

  useEffect(() => {
    const parsed = parseDateStr(data.date);
    if (!parsed) {
      setSelectedDate(null);
      setSelectedTime(data.time || null);
      return;
    }
    if (!isAllowedBookingDate(parsed)) {
      setData((prev) => ({ ...prev, date: '', time: '' }));
      setSelectedDate(null);
      setSelectedTime(null);
      setWeekStartOffset(0);
      return;
    }
    setSelectedDate(parsed);
    setSelectedTime(data.time || null);
    setWeekStartOffset(offsetForDateToBeVisible(parsed));
  }, [data.date, data.time, setData]);

  useEffect(() => {
    if (data.service !== 'standard' && data.service !== 'airbnb') return;
    setData((prev) => {
      if (prev.scheduleEquipmentPref === 'bring' || prev.scheduleEquipmentPref === 'own') return prev;
      return { ...prev, scheduleEquipmentPref: 'own' };
    });
  }, [data.service, setData]);

  const toggleExtra = (id: string) => {
    const bookingId = EXTRA_UI_ID_TO_BOOKING[id];
    if (!bookingId) return;
    setData((prev) => {
      const has = prev.extras.includes(bookingId);
      if (has) {
        return { ...prev, extras: prev.extras.filter((e) => e !== bookingId) };
      }
      return { ...prev, extras: [...prev.extras, bookingId] };
    });
  };

  const handleDateSelect = (date: Date) => {
    if (!isAllowedBookingDate(date)) return;
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const goDatePrev = () => {
    if (!canGoDatePrev) return;
    setWeekStartOffset((o) => Math.max(0, o - 7));
  };

  const goDateNext = () => {
    if (!canGoDateNext) return;
    setWeekStartOffset((o) => o + 7);
  };

  const handleContinue = () => {
    if (!canContinue || !selectedDate || !selectedTime) return;
    setData((prev) => ({
      ...prev,
      date: toDateStr(selectedDate),
      time: selectedTime,
    }));
    onContinue();
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] font-sans">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={18} className="text-gray-500" />
          </button>
          <div>
            <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">
              Shalean Cleaning Services
            </p>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">Extras & Schedule</h1>
          </div>
        </div>

        <BookingFlowStepIndicator activeStep={2} />
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 flex gap-6 items-start">
        <div className="flex-1 min-w-0 flex flex-col gap-6">
          <p className="text-xs font-bold tracking-widest text-violet-600 uppercase">Step 2 of 4</p>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-start gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center flex-shrink-0">
                <Zap size={18} className="text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Enhance Your Service</h2>
                <p className="text-sm text-gray-500">
                  Additional services — optional; selections appear in your estimate
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {EXTRAS.map((extra) => {
                const isSelected = selectedExtras.includes(extra.id);
                return (
                  <motion.button
                    key={extra.id}
                    type="button"
                    onClick={() => toggleExtra(extra.id)}
                    whileTap={{ scale: 0.94 }}
                    className={[
                      'flex flex-col items-center gap-2 py-4 px-2 rounded-xl border-2 cursor-pointer transition-all duration-200',
                      isSelected
                        ? 'border-violet-500 bg-violet-50 shadow-sm shadow-violet-100'
                        : 'border-gray-200 bg-white hover:border-violet-300 hover:bg-violet-50/40',
                    ].join(' ')}
                  >
                    <div
                      className={[
                        'w-14 h-14 rounded-full flex items-center justify-center border-2 transition-colors',
                        isSelected ? 'border-violet-500 text-violet-600' : 'border-gray-300 text-gray-500',
                      ].join(' ')}
                    >
                      {extra.icon}
                    </div>
                    <div className="text-center leading-tight">
                      <p
                        className={['text-xs font-semibold', isSelected ? 'text-violet-700' : 'text-gray-700'].join(
                          ' '
                        )}
                      >
                        {extra.label}
                      </p>
                      <p className="text-[10px] text-gray-400">{extra.sublabel}</p>
                    </div>
                    {isSelected && (
                      <span className="text-[10px] font-bold text-violet-600 bg-violet-100 px-2 py-0.5 rounded-full">
                        +R{extra.price}
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-start gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
                <Calendar size={18} className="text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Schedule</h2>
                <p className="text-sm text-gray-500">Pick a date and preferred start time</p>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <Calendar size={14} className="text-gray-400" />
              <span className="text-sm font-semibold text-gray-600">Date</span>
              {selectedDate && (
                <span className="ml-auto text-xs font-medium text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-200">
                  {formatSelectedDate(selectedDate)}
                </span>
              )}
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50/40">
              <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-3 border-b border-gray-100 bg-gray-50/60">
                <button
                  type="button"
                  onClick={goDatePrev}
                  disabled={!canGoDatePrev}
                  aria-label="Previous dates"
                  className="w-9 h-9 shrink-0 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-white hover:shadow-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={18} className="text-gray-700" />
                </button>
                <div className="min-w-0 text-center flex-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pick a week</p>
                  <p className="text-sm font-bold text-gray-800 mt-0.5 truncate">{formatWeekRangeLabel(selectableDates)}</p>
                </div>
                <button
                  type="button"
                  onClick={goDateNext}
                  disabled={!canGoDateNext}
                  aria-label="Next dates"
                  className="w-9 h-9 shrink-0 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-white hover:shadow-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={18} className="text-gray-700" />
                </button>
              </div>

              <div className="p-3 sm:p-4">
                <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                  {selectableDates.map((cellDate) => {
                    const dow = DAYS_OF_WEEK[cellDate.getDay()];
                    const dayNum = cellDate.getDate();
                    const todayCell = isToday(cellDate);
                    const isSelected = selectedDate ? isSameDay(cellDate, selectedDate) : false;
                    return (
                      <motion.button
                        key={toDateStr(cellDate)}
                        type="button"
                        onClick={() => handleDateSelect(cellDate)}
                        whileTap={{ scale: 0.94 }}
                        className={[
                          'flex flex-col items-center justify-center rounded-xl py-2.5 px-1 sm:py-3 sm:px-2 min-h-[4.25rem] transition-all duration-150',
                          isSelected
                            ? 'bg-violet-600 text-white shadow-md shadow-violet-200'
                            : todayCell
                              ? 'ring-2 ring-violet-400 bg-white text-violet-700 font-bold hover:bg-violet-50'
                              : 'bg-white text-gray-700 border border-gray-200 hover:border-violet-300 hover:bg-violet-50/50',
                        ].join(' ')}
                      >
                        <span
                          className={[
                            'text-[9px] sm:text-[10px] font-bold tracking-wider',
                            isSelected ? 'text-violet-100' : 'text-gray-400',
                          ].join(' ')}
                        >
                          {dow}
                        </span>
                        <span className="text-base sm:text-lg font-bold tabular-nums leading-tight mt-0.5">{dayNum}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={14} className="text-gray-400" />
              <span className="text-sm font-semibold text-gray-600">Start Time</span>
              {selectedDate && (
                <span className="ml-auto text-xs text-gray-400">
                  {selectedTime ? (
                    <span className="text-violet-600 font-semibold">
                      {TIME_SLOTS.find((t) => t.id === selectedTime)?.label}
                    </span>
                  ) : (
                    'Choose a time below'
                  )}
                </span>
              )}
            </div>

            <AnimatePresence mode="wait">
              {!selectedDate ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 py-8 flex flex-col items-center gap-2"
                >
                  <Calendar size={28} className="text-gray-300" />
                  <p className="text-sm text-gray-400 font-medium">Select a date first to see available times</p>
                </motion.div>
              ) : (
                <motion.div
                  key="slots"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="grid grid-cols-5 gap-2"
                >
                  {TIME_SLOTS.map((slot) => (
                    <motion.button
                      key={slot.id}
                      type="button"
                      onClick={() => slot.available && setSelectedTime(slot.id)}
                      disabled={!slot.available}
                      whileTap={slot.available ? { scale: 0.93 } : {}}
                      className={[
                        'py-2.5 px-2 rounded-xl text-xs font-semibold border-2 transition-all duration-150',
                        !slot.available
                          ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed line-through'
                          : selectedTime === slot.id
                            ? 'border-violet-600 bg-violet-600 text-white shadow-sm shadow-violet-200'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-violet-400 hover:text-violet-700 hover:bg-violet-50',
                      ].join(' ')}
                    >
                      {slot.label}
                      {!slot.available && (
                        <span className="block text-[9px] font-normal mt-0.5 no-underline text-gray-300">Booked</span>
                      )}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="w-72 flex-shrink-0 sticky top-6 flex flex-col gap-4">
          <div className="rounded-2xl overflow-hidden shadow-md">
            <div className="bg-gradient-to-br from-violet-600 to-violet-800 px-5 py-5">
              <p className="text-violet-200 text-xs font-semibold tracking-widest uppercase mb-1">Your Estimate</p>
              <motion.p
                key={totalEstimate}
                initial={{ scale: 1.06, opacity: 0.7 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-4xl font-extrabold text-white tracking-tight"
              >
                R {totalEstimate.toLocaleString()}
              </motion.p>
              <p className="text-violet-300 text-sm mt-1 font-medium">{serviceTitle}</p>
            </div>

            <div className="bg-white px-5 py-4 flex flex-col gap-3">
              <div className="flex justify-between text-sm text-gray-600">
                <span>{serviceTitle}</span>
                <span className="font-semibold text-gray-800">R {pricing.basePrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Home size & add-ons</span>
                <span className="font-semibold text-gray-800">R {addonsLine.toLocaleString()}</span>
              </div>

              <AnimatePresence>
                {selectedExtras.map((id) => {
                  const extra = EXTRAS.find((e) => e.id === id);
                  if (!extra) return null;
                  return (
                    <motion.div
                      key={id}
                      initial={{ opacity: 0, height: 0, y: -4 }}
                      animate={{ opacity: 1, height: 'auto', y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -4 }}
                      transition={{ duration: 0.2 }}
                      className="flex justify-between text-sm text-gray-600 overflow-hidden"
                    >
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 inline-block" />
                        {extra.label} Cleaning
                      </span>
                      <span className="font-semibold text-violet-600">+R{extra.price}</span>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              <div className="border-t border-gray-100 pt-3 flex justify-between text-sm font-bold text-gray-900">
                <span>Total estimate</span>
                <motion.span key={totalEstimate} initial={{ scale: 1.1 }} animate={{ scale: 1 }}>
                  R {totalEstimate.toLocaleString()}
                </motion.span>
              </div>

              <motion.button
                type="button"
                onClick={handleContinue}
                animate={canContinue ? { opacity: 1 } : { opacity: 0.45 }}
                whileTap={canContinue ? { scale: 0.97 } : {}}
                disabled={!canContinue}
                className={[
                  'w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 mt-1',
                  canContinue
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-200 hover:bg-violet-700 cursor-pointer'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed',
                ].join(' ')}
              >
                {canContinue ? (
                  <>
                    Continue to Step 3 <ArrowRight size={16} />
                  </>
                ) : (
                  <>Pick a date & time to continue</>
                )}
              </motion.button>

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

              <div className="border-t border-gray-100 pt-3 mt-1">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Need help?</p>
                <div className="flex flex-col gap-2">
                  <a
                    href={SUPPORT_WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-xl border border-gray-200 bg-emerald-50/80 px-3 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-100/80 transition-colors"
                  >
                    <MessageSquare size={16} className="text-emerald-600 flex-shrink-0" aria-hidden />
                    WhatsApp us
                  </a>
                  <a
                    href={SUPPORT_PHONE_HREF}
                    className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
                  >
                    <Phone size={16} className="text-violet-600 flex-shrink-0" aria-hidden />
                    Call {SUPPORT_PHONE_DISPLAY}
                  </a>
                </div>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {(selectedDate || selectedTime) && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col gap-2"
              >
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Your Selection</p>
                {selectedDate && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Calendar size={14} className="text-violet-500" />
                    <span>{formatSelectedDate(selectedDate)}</span>
                  </div>
                )}
                {selectedTime && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Clock size={14} className="text-violet-500" />
                    <span>{TIME_SLOTS.find((t) => t.id === selectedTime)?.label}</span>
                  </div>
                )}
                {!selectedTime && selectedDate && (
                  <p className="text-xs text-amber-500 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                    Still need a start time
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
