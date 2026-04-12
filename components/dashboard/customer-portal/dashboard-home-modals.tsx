'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Clock,
  MessageCircle,
  Navigation,
  Phone,
  Star,
  X,
  XCircle,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCounter } from './hooks';
import type { Booking, FilterId, StatItem } from './types';
import { cleanerTelHref, cleanerWhatsAppHref, supportTelHref, supportWhatsAppHref } from './booking-contact';

export const STATUS_FILTER_OPTIONS: Array<{ id: FilterId; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

export const TRUST_BADGES: Array<{
  id: string;
  text: string;
  type: 'shield' | 'check' | 'spark';
}> = [
  { id: 'tb-ssl', text: 'Payments are 256-bit SSL encrypted', type: 'shield' },
  { id: 'tb-cancel', text: 'Free cancellation up to 24 hrs before', type: 'check' },
  { id: 'tb-fees', text: 'No hidden fees — ever', type: 'spark' },
];

export function StatusBadge({ status }: { status: Booking['status'] }) {
  const map = {
    upcoming: {
      label: 'Upcoming',
      icon: <Clock className="w-3 h-3" />,
      cls: 'bg-blue-50 text-blue-600 border-blue-200',
    },
    completed: {
      label: 'Completed',
      icon: <CheckCircle2 className="w-3 h-3" />,
      cls: 'bg-green-50 text-green-600 border-green-200',
    },
    cancelled: {
      label: 'Cancelled',
      icon: <XCircle className="w-3 h-3" />,
      cls: 'bg-red-50 text-red-500 border-red-200',
    },
  };
  const { label, icon, cls } = map[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[11px] font-bold border rounded-full px-2.5 py-1 leading-none',
        cls
      )}
    >
      {icon}
      <span>{label}</span>
    </span>
  );
}

export function StatCounter({ stat }: { stat: StatItem }) {
  const value = useCounter(stat.value);
  return (
    <div className="flex-1 min-w-0 text-center">
      <p className={cn('text-2xl font-extrabold leading-none', stat.color)}>
        <span>{value}</span>
        <span className="text-lg">{stat.suffix}</span>
      </p>
      <p className="text-xs text-gray-400 mt-1 font-medium">{stat.label}</p>
    </div>
  );
}

export function BookingSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-100 rounded w-2/3" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
          <div className="h-3 bg-gray-100 rounded w-3/4" />
        </div>
        <div className="h-4 bg-gray-100 rounded w-12" />
      </div>
    </div>
  );
}

export function TrackCleanerModal({
  booking,
  onClose,
}: {
  booking: Booking;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.97 }}
        transition={{ duration: 0.22 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-extrabold text-gray-900">Tracking Cleaner</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {booking.service} · {booking.date}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5">
          <div className="w-full h-44 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl flex items-center justify-center mb-4 relative overflow-hidden border border-blue-100">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center mx-auto mb-2 shadow-lg">
                <Navigation className="w-6 h-6 text-white" />
              </div>
              <p className="text-xs font-bold text-blue-700">Live tracking active</p>
              <p className="text-[10px] text-blue-500 mt-0.5">Map integration ready for production</p>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-base flex-shrink-0">
              {booking.cleanerInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900">{booking.cleaner}</p>
              <p className="text-xs text-blue-600 font-semibold mt-0.5">
                {booking.dbStatus === 'on_my_way'
                  ? '🟢 En route'
                  : booking.pipelineStatus || 'Status updates appear here'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <a
              href={cleanerTelHref(booking) || supportTelHref() || '#'}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 text-xs font-bold hover:border-gray-300 transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call Cleaner</span>
            </a>
            <a
              href={cleanerWhatsAppHref(booking) || supportWhatsAppHref() || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function ContactModal({
  booking,
  onClose,
}: {
  booking: Booking;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.97 }}
        transition={{ duration: 0.22 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm font-extrabold text-gray-900">Contact {booking.cleaner}</p>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <a
            href={cleanerTelHref(booking) || supportTelHref() || '#'}
            className="flex items-center gap-3 w-full p-4 rounded-2xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Phone className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-gray-900">Call Cleaner</p>
              <p className="text-xs text-gray-400">
                {booking.cleanerPhone?.trim() || process.env.NEXT_PUBLIC_SUPPORT_PHONE || 'Add NEXT_PUBLIC_SUPPORT_PHONE'}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 ml-auto" />
          </a>
          <a
            href={cleanerWhatsAppHref(booking) || supportWhatsAppHref() || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 w-full p-4 rounded-2xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-gray-900">WhatsApp</p>
              <p className="text-xs text-emerald-600">Message your assigned cleaner</p>
            </div>
            <ChevronRight className="w-4 h-4 text-emerald-300 ml-auto" />
          </a>
        </div>
      </motion.div>
    </div>
  );
}

export function CancelConfirmModal({
  booking,
  onConfirm,
  onClose,
}: {
  booking: Booking;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const handleConfirm = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    onConfirm();
    onClose();
    setLoading(false);
  };
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.18 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6"
      >
        <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7 text-red-500" />
        </div>
        <h3 className="text-base font-extrabold text-gray-900 text-center mb-1">Cancel Booking?</h3>
        <p className="text-xs text-gray-400 text-center mb-1">
          <span>{booking.service}</span>
          <span className="mx-1.5">·</span>
          <span>{booking.date}</span>
        </p>
        <p className="text-xs text-gray-400 text-center mb-6">
          This action cannot be undone. A cancellation fee may apply within 24 hrs.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-sm font-bold text-gray-600 hover:border-gray-300 transition-colors"
          >
            Keep Booking
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : null}
            <span>{loading ? 'Cancelling…' : 'Yes, Cancel'}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export function ReviewModal({
  booking,
  onSubmit,
  onClose,
}: {
  booking: Booking;
  onSubmit: (rating: number) => void;
  onClose: () => void;
}) {
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const handleSubmit = () => {
    if (!selected) return;
    setSubmitted(true);
    setTimeout(() => {
      onSubmit(selected);
      onClose();
    }, 1000);
  };
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.18 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 relative"
      >
        {submitted ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-green-50 border-4 border-green-100 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-7 h-7 text-green-500" />
            </div>
            <p className="text-sm font-extrabold text-gray-900">Thanks for your review!</p>
            <p className="text-xs text-gray-400 mt-1">Your feedback helps us improve.</p>
          </div>
        ) : (
          <div>
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <p className="text-base font-extrabold text-gray-900 mb-1">Rate your experience</p>
            <p className="text-xs text-gray-400 mb-5">
              <span>{booking.service}</span>
              <span className="mx-1.5">·</span>
              <span>{booking.cleaner}</span>
            </p>
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={`review-star-${i}`}
                  type="button"
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setSelected(i)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      'w-8 h-8 transition-colors',
                      i <= (hovered || selected)
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-gray-200 fill-gray-200'
                    )}
                  />
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!selected}
              className="w-full py-3 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Submit Review
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
