'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Phone, Star, X, ChevronRight, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCounter } from './hooks';
import type { Booking, FilterId, StatItem } from './types';
import { cleanerTelHref, cleanerWhatsAppHref, supportTelHref, supportWhatsAppHref } from './booking-contact';

export { StatusBadge } from '../shared/status-badge';

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
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-4 space-y-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Visit</p>
            <p className="text-sm font-semibold text-gray-900">
              {booking.date} · {booking.time}
            </p>
            <p className="text-xs text-gray-600 mt-2">
              <span className="font-semibold text-gray-800">Status: </span>
              {booking.pipelineStatus || booking.dbStatus || 'Scheduled'}
            </p>
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
    try {
      await Promise.resolve(onConfirm());
    } finally {
      setLoading(false);
      onClose();
    }
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

type ReviewPayload = {
  overallRating: number;
  qualityRating: number;
  punctualityRating: number;
  professionalismRating: number;
  reviewText?: string;
};

function StarRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="mb-4">
      <p className="text-xs font-semibold text-gray-700 mb-2">{label}</p>
      <div className="flex justify-center gap-1.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={`${label}-${i}`}
            type="button"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(i)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={cn(
                'w-7 h-7 transition-colors',
                i <= (hovered || value) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export function ReviewModal({
  booking,
  onSubmit,
  onClose,
}: {
  booking: Booking;
  onSubmit: (payload: ReviewPayload) => Promise<void>;
  onClose: () => void;
}) {
  const [overall, setOverall] = useState(0);
  const [quality, setQuality] = useState(0);
  const [punctuality, setPunctuality] = useState(0);
  const [professionalism, setProfessionalism] = useState(0);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const canSubmit = overall > 0 && quality > 0 && punctuality > 0 && professionalism > 0;

  const handleSubmit = async () => {
    if (!canSubmit || busy) return;
    setBusy(true);
    try {
      await onSubmit({
        overallRating: overall,
        qualityRating: quality,
        punctualityRating: punctuality,
        professionalismRating: professionalism,
        reviewText: comment.trim() || undefined,
      });
      onClose();
    } finally {
      setBusy(false);
    }
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
        className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl p-6 relative"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        <p className="text-base font-extrabold text-gray-900 mb-1 pr-10">Rate your experience</p>
        <p className="text-xs text-gray-400 mb-4">
          <span>{booking.service}</span>
          <span className="mx-1.5">·</span>
          <span>{booking.cleaner}</span>
        </p>

        <StarRow label="Overall" value={overall} onChange={setOverall} />
        <StarRow label="Quality of clean" value={quality} onChange={setQuality} />
        <StarRow label="Punctuality" value={punctuality} onChange={setPunctuality} />
        <StarRow label="Professionalism" value={professionalism} onChange={setProfessionalism} />

        <label className="block text-xs font-semibold text-gray-700 mb-1">Comment (optional)</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm mb-4"
          placeholder="Tell us what stood out…"
        />

        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={!canSubmit || busy}
          className="w-full py-3 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {busy ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : null}
          Submit review
        </button>
      </motion.div>
    </div>
  );
}
