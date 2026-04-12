'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Calendar,
  Clock,
  Star,
  Shuffle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Booking, PreferredCleanerOption } from './types';

const WEEKDAY_LABELS: string[] = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES: string[] = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
}

const ALL_TIME_SLOTS: TimeSlot[] = [
  { id: 'ts-0800', time: '08:00 AM', available: true },
  { id: 'ts-0900', time: '09:00 AM', available: true },
  { id: 'ts-1000', time: '10:00 AM', available: true },
  { id: 'ts-1100', time: '11:00 AM', available: true },
  { id: 'ts-1300', time: '01:00 PM', available: true },
  { id: 'ts-1400', time: '02:00 PM', available: true },
  { id: 'ts-1500', time: '03:00 PM', available: true },
  { id: 'ts-1600', time: '04:00 PM', available: true },
];

const RESCHEDULE_STEPS: Array<{ id: number; label: string }> = [
  { id: 1, label: 'Date & Time' },
  { id: 2, label: 'Cleaner' },
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatDisplayDate(year: number, month: number, day: number): string {
  const d = new Date(year, month, day);
  return d.toLocaleDateString('en-ZA', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function toIsoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Converts e.g. "09:00 AM" → "09:00", "01:00 PM" → "13:00" for the reschedule API */
function amPmTo24h(display: string): string {
  const m = display.trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) {
    const short = display.match(/(\d{1,2}):(\d{2})/);
    return short ? `${short[1].padStart(2, '0')}:${short[2]}` : display;
  }
  let h = parseInt(m[1], 10);
  const min = m[2];
  const ap = m[3].toUpperCase();
  if (ap === 'PM' && h < 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${min}`;
}

function getSlotsForDay(day: number): TimeSlot[] {
  const blockedIndices = day % 3 === 0 ? [2, 5] : day % 3 === 1 ? [1, 4, 7] : [0, 3, 6];
  return ALL_TIME_SLOTS.map((slot, idx) => ({
    ...slot,
    available: !blockedIndices.includes(idx),
  }));
}

function getCleanersForDay(day: number, currentCleaner: string): PreferredCleanerOption[] {
  const all: PreferredCleanerOption[] = [
    {
      id: 'cl-001',
      name: 'Thandiwe M.',
      initial: 'T',
      rating: 4.9,
      reviews: 128,
      specialty: 'Standard & Deep Clean',
      available: true,
    },
    {
      id: 'cl-002',
      name: 'Nompumelelo K.',
      initial: 'N',
      rating: 4.8,
      reviews: 96,
      specialty: 'Move-Out Specialist',
      available: day % 3 !== 0,
    },
    {
      id: 'cl-003',
      name: 'Zanele D.',
      initial: 'Z',
      rating: 4.7,
      reviews: 74,
      specialty: 'Office & Commercial',
      available: day % 2 !== 0,
    },
    {
      id: 'cl-004',
      name: 'Lerato B.',
      initial: 'L',
      rating: 4.6,
      reviews: 52,
      specialty: 'Standard & Eco Clean',
      available: day % 4 !== 0,
    },
  ];

  return all.map((c) => ({
    ...c,
    available: c.name === currentCleaner ? c.available : c.available,
  }));
}

interface RescheduleDatePickerModalProps {
  booking: Booking;
  /** `newDate` = YYYY-MM-DD, `newTime` = HH:mm (24h), `newCleaner` = display name or "Any available" */
  onConfirm: (bookingId: string, newDate: string, newTime: string, newCleaner: string) => void | Promise<void>;
  onClose: () => void;
}

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 bg-gray-50/60">
      {RESCHEDULE_STEPS.map((s, idx) => (
        <div key={s.id} className="flex items-center gap-2 flex-shrink-0">
          <div
            className={cn(
              'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold transition-all duration-300',
              currentStep > s.id
                ? 'bg-blue-600 text-white'
                : currentStep === s.id
                  ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                  : 'bg-gray-200 text-gray-400'
            )}
          >
            {currentStep > s.id ? <CheckCircle2 className="w-3 h-3" /> : <span>{s.id}</span>}
          </div>
          <span
            className={cn(
              'text-[11px] font-semibold transition-colors',
              currentStep === s.id
                ? 'text-blue-600'
                : currentStep > s.id
                  ? 'text-gray-400'
                  : 'text-gray-300'
            )}
          >
            {s.label}
          </span>
          {idx < RESCHEDULE_STEPS.length - 1 && (
            <ChevronRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
}

export function RescheduleDatePickerModal({
  booking,
  onConfirm,
  onClose,
}: RescheduleDatePickerModalProps) {
  const today = new Date();

  const [step, setStep] = useState(1);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [selectedCleanerId, setSelectedCleanerId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDayOfWeek = getFirstDayOfWeek(viewYear, viewMonth);
  const calendarCells = useMemo<(number | null)[]>(() => {
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [daysInMonth, firstDayOfWeek]);

  const isPastDay = (day: number): boolean => {
    const cellDate = new Date(viewYear, viewMonth, day);
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return cellDate < todayStart;
  };

  const isToday = (day: number): boolean =>
    day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();

  const timeSlots = selectedDay ? getSlotsForDay(selectedDay) : [];
  const selectedSlot = timeSlots.find((s) => s.id === selectedSlotId) ?? null;
  const cleaners = selectedDay ? getCleanersForDay(selectedDay, booking.cleaner) : [];
  const selectedCleaner = cleaners.find((c) => c.id === selectedCleanerId) ?? null;

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
    setSelectedDay(null);
    setSelectedSlotId(null);
    setSelectedCleanerId(null);
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
    setSelectedDay(null);
    setSelectedSlotId(null);
    setSelectedCleanerId(null);
  };

  const handleSelectDay = (day: number) => {
    if (isPastDay(day)) return;
    setSelectedDay(day);
    setSelectedSlotId(null);
    setSelectedCleanerId(null);
  };

  const canGoToStep2 = selectedDay !== null && selectedSlotId !== null;
  const canConfirm =
    canGoToStep2 && selectedCleanerId !== null && !confirming;

  const handleConfirm = async () => {
    if (!selectedDay || !selectedSlotId || !selectedCleanerId || !selectedSlot) return;
    setConfirming(true);
    await new Promise((r) => setTimeout(r, 900));
    setConfirming(false);
    setConfirmed(true);

    const dateIso = toIsoDate(viewYear, viewMonth, selectedDay);
    const time24 = amPmTo24h(selectedSlot.time);
    const newCleanerName =
      selectedCleanerId === 'any'
        ? 'Any available cleaner'
        : selectedCleaner?.name ?? booking.cleaner;

    setTimeout(() => {
      void Promise.resolve(onConfirm(booking.id, dateIso, time24, newCleanerName));
      onClose();
    }, 1200);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.97 }}
        transition={{ duration: 0.24 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl"
      >
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-gray-900">Reschedule</p>
              <p className="text-xs text-gray-400 mt-0.5">{booking.service}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {confirmed ? (
            <motion.div
              key="confirmed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="p-8 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-green-50 border-4 border-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-base font-extrabold text-gray-900 mb-1">Booking Rescheduled!</p>
              {selectedDay && selectedSlot && selectedCleanerId && (
                <div className="space-y-1">
                  <p className="text-xs text-gray-400">
                    <span>{formatDisplayDate(viewYear, viewMonth, selectedDay)}</span>
                    <span className="mx-1.5 text-gray-300">·</span>
                    <span>{selectedSlot.time}</span>
                  </p>
                  <p className="text-xs text-blue-600 font-semibold">
                    {selectedCleanerId === 'any' ? 'Any available cleaner' : selectedCleaner?.name}
                  </p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="steps"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <StepIndicator currentStep={step} />

              <div className="p-5">
                <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 flex items-center gap-2 mb-5">
                  <Clock className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                  <p className="text-xs text-blue-700">
                    <span className="font-semibold">Current: </span>
                    <span>{booking.date}</span>
                    <span className="mx-1.5 text-blue-300">·</span>
                    <span>{booking.time}</span>
                    <span className="mx-1.5 text-blue-300">·</span>
                    <span>{booking.cleaner}</span>
                  </p>
                </div>

                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.div
                      key="step-1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.18 }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <button
                          type="button"
                          onClick={handlePrevMonth}
                          className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
                          aria-label="Previous month"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <p className="text-sm font-extrabold text-gray-900">
                          {MONTH_NAMES[viewMonth]} {viewYear}
                        </p>
                        <button
                          type="button"
                          onClick={handleNextMonth}
                          className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
                          aria-label="Next month"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-7 mb-1">
                        {WEEKDAY_LABELS.map((label) => (
                          <div
                            key={`wl-${label}`}
                            className="text-center text-[11px] font-bold text-gray-400 py-1"
                          >
                            {label}
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-7 gap-y-1 mb-5">
                        {calendarCells.map((day, idx) => {
                          if (day === null) {
                            return <div key={`empty-${idx}`} />;
                          }
                          const past = isPastDay(day);
                          const todayCell = isToday(day);
                          const selected = selectedDay === day;
                          return (
                            <button
                              key={`day-${day}`}
                              type="button"
                              disabled={past}
                              onClick={() => handleSelectDay(day)}
                              className={cn(
                                'mx-auto w-9 h-9 rounded-xl text-xs font-bold flex items-center justify-center transition-all',
                                past && 'text-gray-300 cursor-not-allowed',
                                !past &&
                                  !selected &&
                                  !todayCell &&
                                  'text-gray-700 hover:bg-blue-50 hover:text-blue-600',
                                todayCell && !selected && 'text-blue-600 ring-2 ring-blue-300 ring-offset-0',
                                selected && 'bg-blue-600 text-white shadow-md shadow-blue-200'
                              )}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>

                      <AnimatePresence>
                        {selectedDay !== null && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.22 }}
                            className="overflow-hidden"
                          >
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                              <span>Available times on </span>
                              <span className="text-blue-600 normal-case tracking-normal font-extrabold">
                                {formatDisplayDate(viewYear, viewMonth, selectedDay)}
                              </span>
                            </p>
                            <div className="grid grid-cols-4 gap-2 mb-5">
                              {timeSlots.map((slot) => (
                                <button
                                  key={slot.id}
                                  type="button"
                                  disabled={!slot.available}
                                  onClick={() => slot.available && setSelectedSlotId(slot.id)}
                                  className={cn(
                                    'py-2 rounded-xl border-2 text-[11px] font-bold transition-all',
                                    !slot.available
                                      ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed'
                                      : selectedSlotId === slot.id
                                        ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100'
                                        : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:text-blue-600'
                                  )}
                                >
                                  {slot.time}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <motion.button
                        type="button"
                        whileHover={canGoToStep2 ? { scale: 1.01 } : undefined}
                        whileTap={canGoToStep2 ? { scale: 0.98 } : undefined}
                        disabled={!canGoToStep2}
                        onClick={() => setStep(2)}
                        className={cn(
                          'w-full py-3 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 transition-all',
                          canGoToStep2
                            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-100'
                            : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                        )}
                      >
                        <span>
                          {selectedDay && selectedSlot
                            ? `Continue — ${formatDisplayDate(viewYear, viewMonth, selectedDay)} · ${selectedSlot.time}`
                            : 'Select a date & time'}
                        </span>
                        {canGoToStep2 && <ChevronRight className="w-4 h-4" />}
                      </motion.button>
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div
                      key="step-2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.18 }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-extrabold text-gray-900">Choose your cleaner</h3>
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                          <span>Change date</span>
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mb-4">
                        Availability shown for{' '}
                        <span className="font-semibold text-gray-600">
                          {selectedDay ? formatDisplayDate(viewYear, viewMonth, selectedDay) : '—'}
                        </span>
                      </p>

                      <div className="space-y-2.5 mb-5">
                        <button
                          type="button"
                          onClick={() => setSelectedCleanerId('any')}
                          className={cn(
                            'w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all text-left',
                            selectedCleanerId === 'any'
                              ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-50'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          )}
                        >
                          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <Shuffle className="w-4 h-4 text-gray-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900">Any available cleaner</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              We&apos;ll assign the best match for your slot
                            </p>
                          </div>
                          {selectedCleanerId === 'any' && (
                            <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                              <CheckCircle2 className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </button>

                        <div className="flex items-center gap-3 my-1">
                          <div className="flex-1 h-px bg-gray-100" />
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            or choose specific
                          </p>
                          <div className="flex-1 h-px bg-gray-100" />
                        </div>

                        {cleaners.map((cleaner) => (
                          <button
                            key={cleaner.id}
                            type="button"
                            disabled={!cleaner.available}
                            onClick={() => cleaner.available && setSelectedCleanerId(cleaner.id)}
                            className={cn(
                              'w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all text-left',
                              !cleaner.available
                                ? 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
                                : selectedCleanerId === cleaner.id
                                  ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-50'
                                  : 'border-gray-200 bg-white hover:border-gray-300'
                            )}
                          >
                            <div
                              className={cn(
                                'w-10 h-10 rounded-xl flex items-center justify-center text-sm font-extrabold flex-shrink-0 transition-colors',
                                !cleaner.available
                                  ? 'bg-gray-200 text-gray-400'
                                  : 'bg-blue-600 text-white'
                              )}
                            >
                              {cleaner.initial}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p
                                  className={cn(
                                    'text-sm font-bold',
                                    !cleaner.available ? 'text-gray-400' : 'text-gray-900'
                                  )}
                                >
                                  {cleaner.name}
                                </p>
                                {cleaner.name === booking.cleaner && (
                                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 rounded-full px-2 py-0.5 leading-none">
                                    Current
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-400 mt-0.5 truncate">{cleaner.specialty}</p>
                              <div className="flex items-center gap-1 mt-1">
                                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                <span className="text-xs font-bold text-gray-700">{cleaner.rating}</span>
                                <span className="text-xs text-gray-400">({cleaner.reviews} reviews)</span>
                              </div>
                            </div>

                            {!cleaner.available ? (
                              <span className="flex-shrink-0 text-[10px] font-bold text-gray-400 bg-gray-100 border border-gray-200 rounded-full px-2.5 py-1 leading-none">
                                Unavailable
                              </span>
                            ) : selectedCleanerId === cleaner.id ? (
                              <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                                <CheckCircle2 className="w-3 h-3 text-white" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full border-2 border-gray-200 flex-shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>

                      <motion.button
                        type="button"
                        whileHover={canConfirm ? { scale: 1.01 } : undefined}
                        whileTap={canConfirm ? { scale: 0.98 } : undefined}
                        disabled={!canConfirm}
                        onClick={handleConfirm}
                        className={cn(
                          'w-full py-3 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 transition-all',
                          canConfirm
                            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-100'
                            : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                        )}
                      >
                        {confirming && (
                          <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        )}
                        <span>
                          {confirming
                            ? 'Saving…'
                            : selectedCleanerId
                              ? `Confirm Reschedule${
                                  selectedCleanerId === 'any'
                                    ? ' · Any Cleaner'
                                    : selectedCleaner
                                      ? ` · ${selectedCleaner.name}`
                                      : ''
                                }`
                              : 'Select a cleaner to continue'}
                        </span>
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
