'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  ChevronRight,
  Star,
  Clock,
  MapPin,
  CreditCard,
  Check,
  ChevronLeft,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProfile } from '@/components/dashboard/customer-portal/hooks';
import { useBookingForm } from './hooks';
import type { BookingStep } from './types';

const STEPS: BookingStep[] = [
  { id: 1, label: 'Service' },
  { id: 2, label: 'Date & Time' },
  { id: 3, label: 'Cleaner' },
  { id: 4, label: 'Extras' },
  { id: 5, label: 'Payment' },
];

function useNextSevenDays() {
  return useMemo(() => {
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthLabels = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const start = new Date();
    const out: Array<{ id: string; day: string; date: string; month: string }> = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      out.push({
        id: `date-${iso}`,
        day: dayLabels[d.getDay()],
        date: String(d.getDate()),
        month: monthLabels[d.getMonth()],
      });
    }
    return out;
  }, []);
}

export interface BookingFlowProps {
  onBack: () => void;
  /** Shown on the payment step; falls back to a demo address */
  addressLine?: string | null;
}

export function BookingFlow({ onBack, addressLine }: BookingFlowProps) {
  const { services, cleaners, timeSlots, extras, isInitialLoading } = useBookingForm();
  const { user } = useProfile();
  const DATE_OPTIONS = useNextSevenDays();

  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedCleaner, setSelectedCleaner] = useState('');
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    setSelectedDate((prev) => prev || DATE_OPTIONS[0]?.id || '');
  }, [DATE_OPTIONS]);

  const currentService = services.find((s) => s.id === selectedService);
  const currentCleaner = cleaners.find((c) => c.id === selectedCleaner);
  const extrasTotal = extras
    .filter((e) => selectedExtras.includes(e.id))
    .reduce((sum, e) => sum + parseInt(e.price.replace('+R', ''), 10), 0);
  const basePrice = currentService ? parseInt(currentService.price.replace('R', ''), 10) : 0;
  const total = basePrice + extrasTotal;

  const canProceed = () => {
    if (step === 1) return !!selectedService;
    if (step === 2) return !!selectedDate && !!selectedTime;
    if (step === 3) return !!selectedCleaner;
    if (step === 4) return true;
    if (step === 5) return true;
    return false;
  };

  const toggleExtra = (id: string) => {
    setSelectedExtras((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    setPaying(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setPaying(false);
    setSubmitted(true);
  };

  const displayAddress =
    addressLine?.trim() || '12 Main Rd, Sea Point, Cape Town';

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center px-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" aria-hidden />
        <span className="sr-only">Loading booking options</span>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center px-4 pb-24 lg:pb-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center"
        >
          <div className="w-20 h-20 rounded-full bg-green-50 border-4 border-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-xl font-extrabold text-gray-900 mb-2">Booking Confirmed!</h2>
          <p className="text-sm text-gray-500 mb-1">
            <span>{currentService?.name}</span>
            <span className="mx-1.5 text-gray-300">·</span>
            <span>{currentCleaner?.name}</span>
          </p>
          <p className="text-2xl font-extrabold text-blue-600 mt-4 mb-6">R{total}</p>
          <p className="text-xs text-gray-400 mb-8">
            A confirmation will be sent to{' '}
            <strong className="text-gray-600">{user.email}</strong>
          </p>
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onBack}
            className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 px-4 sm:px-6 lg:px-8 py-4">
        <div className="w-full">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {STEPS.map((s, idx) => (
              <div key={s.id} className="flex items-center gap-2 flex-shrink-0">
                <div
                  className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-extrabold transition-all',
                    step > s.id
                      ? 'bg-blue-600 text-white'
                      : step === s.id
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                        : 'bg-gray-100 text-gray-400'
                  )}
                >
                  {step > s.id ? <Check className="w-3 h-3" /> : <span>{s.id}</span>}
                </div>
                <span
                  className={cn(
                    'text-xs font-semibold transition-colors',
                    step === s.id
                      ? 'text-blue-600'
                      : step > s.id
                        ? 'text-gray-400'
                        : 'text-gray-300'
                  )}
                >
                  {s.label}
                </span>
                {idx < STEPS.length - 1 && (
                  <ChevronRight className="w-3 h-3 text-gray-200 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-7 pb-32 lg:pb-16 lg:grid lg:grid-cols-[1fr_300px] lg:gap-8 lg:items-start">
        <div>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-lg font-extrabold text-gray-900 mb-1">Choose a service</h2>
                <p className="text-sm text-gray-400 mb-5">Select the type of clean that fits your needs</p>
                <div className="space-y-3">
                  {services.map((svc) => (
                    <motion.button
                      key={svc.id}
                      type="button"
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setSelectedService(svc.id)}
                      className={cn(
                        'w-full text-left bg-white border-2 rounded-2xl p-4 transition-all',
                        selectedService === svc.id
                          ? 'border-blue-500 shadow-md shadow-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900">{svc.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{svc.description}</p>
                          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{svc.duration}</span>
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-base font-extrabold text-blue-600">{svc.price}</p>
                          {selectedService === svc.id && (
                            <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center ml-auto mt-1">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-lg font-extrabold text-gray-900 mb-1">Pick a date &amp; time</h2>
                <p className="text-sm text-gray-400 mb-5">
                  Select when you&apos;d like your cleaner to arrive
                </p>

                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Date</p>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 mb-6">
                  {DATE_OPTIONS.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setSelectedDate(d.id)}
                      className={cn(
                        'flex-shrink-0 flex flex-col items-center w-14 py-3 rounded-2xl border-2 transition-all',
                        selectedDate === d.id
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                      )}
                    >
                      <span
                        className={cn(
                          'text-[10px] font-semibold',
                          selectedDate === d.id ? 'text-blue-200' : 'text-gray-400'
                        )}
                      >
                        {d.day}
                      </span>
                      <span className="text-lg font-extrabold leading-tight">{d.date}</span>
                      <span
                        className={cn(
                          'text-[10px] font-semibold',
                          selectedDate === d.id ? 'text-blue-200' : 'text-gray-400'
                        )}
                      >
                        {d.month}
                      </span>
                    </button>
                  ))}
                </div>

                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Time</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      disabled={!slot.available}
                      onClick={() => slot.available && setSelectedTime(slot.id)}
                      className={cn(
                        'py-2.5 rounded-xl border-2 text-xs font-bold transition-all',
                        !slot.available
                          ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed'
                          : selectedTime === slot.id
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                      )}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-lg font-extrabold text-gray-900 mb-1">Choose your cleaner</h2>
                <p className="text-sm text-gray-400 mb-5">All cleaners are background-checked and verified</p>
                <div className="space-y-3">
                  {cleaners.map((cleaner) => (
                    <motion.button
                      key={cleaner.id}
                      type="button"
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setSelectedCleaner(cleaner.id)}
                      className={cn(
                        'w-full text-left bg-white border-2 rounded-2xl p-4 transition-all',
                        selectedCleaner === cleaner.id
                          ? 'border-blue-500 shadow-md shadow-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-lg flex-shrink-0">
                          {cleaner.initial}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900">{cleaner.name}</p>
                          <p className="text-xs text-gray-400">{cleaner.specialty}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                            <span className="text-xs font-bold text-gray-700">{cleaner.rating}</span>
                            <span className="text-xs text-gray-400">({cleaner.reviews} reviews)</span>
                          </div>
                        </div>
                        {selectedCleaner === cleaner.id && (
                          <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-lg font-extrabold text-gray-900 mb-1">Add extras</h2>
                <p className="text-sm text-gray-400 mb-5">Optional add-ons to get an even deeper clean</p>
                <div className="space-y-3">
                  {extras.map((extra) => (
                    <button
                      key={extra.id}
                      type="button"
                      onClick={() => toggleExtra(extra.id)}
                      className={cn(
                        'w-full flex items-center justify-between bg-white border-2 rounded-2xl px-4 py-3.5 transition-all',
                        selectedExtras.includes(extra.id)
                          ? 'border-blue-500 shadow-md shadow-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <p className="text-sm font-bold text-gray-900">{extra.name}</p>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-sm font-extrabold text-blue-600">{extra.price}</span>
                        <div
                          className={cn(
                            'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
                            selectedExtras.includes(extra.id)
                              ? 'bg-blue-600 border-blue-600'
                              : 'border-gray-300'
                          )}
                        >
                          {selectedExtras.includes(extra.id) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div
                key="step-5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-lg font-extrabold text-gray-900 mb-1">Payment</h2>
                <p className="text-sm text-gray-400 mb-5">Review your booking and complete payment</p>

                <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Card Details</p>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1.5">Card Number</label>
                      <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                        <CreditCard className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <input
                          type="text"
                          placeholder="4242 4242 4242 4242"
                          className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-300 outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1.5">Expiry</label>
                        <input
                          type="text"
                          placeholder="MM / YY"
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-300 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1.5">CVV</label>
                        <input
                          type="text"
                          placeholder="···"
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-300 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-blue-700">Address</p>
                    <p className="text-xs text-blue-500 mt-0.5">{displayAddress}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-gray-200 text-sm font-bold text-gray-600 hover:border-gray-300 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}
            {step === 1 && (
              <button
                type="button"
                onClick={onBack}
                className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-gray-200 text-sm font-bold text-gray-600 hover:border-gray-300 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            )}
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={!canProceed() || paying}
              onClick={() => (step < 5 ? setStep((s) => s + 1) : handleSubmit())}
              className={cn(
                'flex-1 py-3 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 transition-all',
                canProceed() && !paying
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-100'
                  : 'bg-gray-100 text-gray-300 cursor-not-allowed'
              )}
            >
              {paying && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{paying ? 'Processing…' : step === 5 ? 'Confirm & Pay' : 'Continue'}</span>
              {step < 5 && !paying && <ChevronRight className="w-4 h-4" />}
            </motion.button>
          </div>
        </div>

        <div className="hidden lg:block">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 sticky top-28">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Booking Summary</p>
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">Service</p>
                <p className="text-xs font-bold text-gray-900 text-right">
                  {currentService ? (
                    currentService.name
                  ) : (
                    <span className="text-gray-300">Not selected</span>
                  )}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">Cleaner</p>
                <p className="text-xs font-bold text-gray-900 text-right">
                  {currentCleaner ? (
                    currentCleaner.name
                  ) : (
                    <span className="text-gray-300">Not selected</span>
                  )}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">Date</p>
                <p className="text-xs font-bold text-gray-900 text-right">
                  {selectedDate ? (
                    <span>
                      {DATE_OPTIONS.find((d) => d.id === selectedDate)?.day},{' '}
                      {DATE_OPTIONS.find((d) => d.id === selectedDate)?.date}{' '}
                      {DATE_OPTIONS.find((d) => d.id === selectedDate)?.month}
                    </span>
                  ) : (
                    <span className="text-gray-300">Not selected</span>
                  )}
                </p>
              </div>
            </div>

            {selectedExtras.length > 0 && (
              <div className="border-t border-gray-100 pt-3 mb-3 space-y-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Extras</p>
                {extras
                  .filter((e) => selectedExtras.includes(e.id))
                  .map((e) => (
                    <div key={e.id} className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">{e.name}</p>
                      <p className="text-xs font-bold text-gray-700">{e.price}</p>
                    </div>
                  ))}
              </div>
            )}

            <div className="border-t border-gray-100 pt-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-extrabold text-gray-900">Total</p>
                <p className="text-lg font-extrabold text-blue-600">
                  {total > 0 ? (
                    `R${total}`
                  ) : (
                    <span className="text-gray-300 text-sm">—</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
