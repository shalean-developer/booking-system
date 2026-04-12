'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Clock,
  XCircle,
  MapPin,
  Star,
  MoreVertical,
  Phone,
  RefreshCw,
  Calendar,
  Download,
  FileText,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Mail,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Home,
  Plus,
  LogOut,
  Edit3,
  X,
  Navigation,
  AlertTriangle,
  Copy,
  Check,
  Save,
  ChevronRight,
} from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import { cn } from '@/lib/utils';
import { useBookings, usePayments, useRewards, useFaqs, useProfile } from './hooks';
import { RescheduleDatePickerModal } from './reschedule-date-picker-modal';
import type { Booking, FilterId, PageId } from './types';
import { cleanerTelHref, cleanerWhatsAppHref, supportTelHref, supportWhatsAppHref } from './booking-contact';

// â”€â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const STATUS_FILTER_OPTIONS: Array<{
  id: FilterId;
  label: string;
}> = [
  { id: 'all', label: 'All' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

const PAYMENT_STATUS_MAP: Record<
  string,
  {
    label: string;
    cls: string;
  }
> = {
  paid: { label: 'Paid', cls: 'bg-green-50 text-green-600 border-green-200' },
  pending: { label: 'Pending', cls: 'bg-amber-50 text-amber-600 border-amber-200' },
  failed: { label: 'Failed', cls: 'bg-red-50 text-red-500 border-red-200' },
};

function getSupportChannels(): Array<{
  id: string;
  icon: string;
  title: string;
  sub: string;
  action: string;
  style: string;
  href: string;
}> {
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || 'support@example.com';
  const phone = process.env.NEXT_PUBLIC_SUPPORT_PHONE?.trim();
  return [
    {
      id: 'ch-whatsapp',
      icon: 'whatsapp',
      title: 'WhatsApp Chat',
      sub: phone ? `Quick replies on ${phone}` : 'Set NEXT_PUBLIC_SUPPORT_PHONE',
      action: 'Chat Now',
      style: 'bg-emerald-500 text-white hover:bg-emerald-600',
      href: supportWhatsAppHref() || '#',
    },
    {
      id: 'ch-email',
      icon: 'email',
      title: 'Email Support',
      sub: supportEmail,
      action: 'Send Email',
      style: 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300',
      href: `mailto:${supportEmail}`,
    },
    {
      id: 'ch-call',
      icon: 'phone',
      title: 'Call Us',
      sub: phone ? `${phone} · Mon–Fri` : 'Set NEXT_PUBLIC_SUPPORT_PHONE',
      action: 'Call Now',
      style: 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300',
      href: supportTelHref() || '#',
    },
  ];
}

// â”€â”€â”€ Shared Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function StatusBadge({ status }: { status: Booking['status'] }) {
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

function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-5">
      <div className="w-full">
        <h1 className="text-xl font-extrabold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

// â”€â”€â”€ Shared Modals â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function TrackCleanerModal({ booking, onClose }: { booking: Booking; onClose: () => void }) {
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
          <div className="w-full h-44 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl flex items-center justify-center mb-4 border border-blue-100">
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

function ContactModal({ booking, onClose }: { booking: Booking; onClose: () => void }) {
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
                {booking.cleanerPhone?.trim() || process.env.NEXT_PUBLIC_SUPPORT_PHONE || 'Configure NEXT_PUBLIC_SUPPORT_PHONE'}
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

function CancelConfirmModal({
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
            {loading && (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            <span>{loading ? 'Cancelling…' : 'Yes, Cancel'}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function ReviewModal({
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
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6"
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
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-base font-extrabold text-gray-900">Rate your experience</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  <span>{booking.service}</span>
                  <span className="mx-1.5">·</span>
                  <span>{booking.cleaner}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
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

function InvoiceModal({
  invoiceId,
  service,
  date,
  amount,
  onClose,
}: {
  invoiceId: string;
  service: string;
  date: string;
  amount: string;
  onClose: () => void;
}) {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const handleDownload = async () => {
    setDownloading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setDownloading(false);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2500);
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
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm font-extrabold text-gray-900">Invoice</p>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5">
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 mb-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">Invoice ID</p>
              <p className="text-xs font-bold text-gray-900 font-mono">{invoiceId}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">Service</p>
              <p className="text-xs font-bold text-gray-900">{service}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">Date</p>
              <p className="text-xs font-bold text-gray-900">{date}</p>
            </div>
            <div className="flex items-center justify-between border-t border-gray-200 pt-3 mt-1">
              <p className="text-sm font-extrabold text-gray-900">Total</p>
              <p className="text-sm font-extrabold text-blue-600">{amount}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="w-full py-3 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {downloading ? (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : downloaded ? (
              <Check className="w-4 h-4" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>{downloading ? 'Generating…' : downloaded ? 'Downloaded!' : 'Download PDF'}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function RedeemModal({
  availablePoints,
  onRedeem,
  onClose,
}: {
  availablePoints: number;
  onRedeem: () => void;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const REDEEM_COST = 100;
  const canRedeem = availablePoints >= REDEEM_COST;
  const handleRedeem = async () => {
    if (!canRedeem) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    setLoading(false);
    setDone(true);
    setTimeout(() => {
      onRedeem();
      onClose();
    }, 1200);
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
        {done ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-amber-50 border-4 border-amber-100 flex items-center justify-center mx-auto mb-3">
              <Star className="w-7 h-7 text-amber-500 fill-amber-400" />
            </div>
            <p className="text-sm font-extrabold text-gray-900">Points Redeemed!</p>
            <p className="text-xs text-gray-400 mt-1">Your R20 discount will be applied at checkout.</p>
          </div>
        ) : (
          <div>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-base font-extrabold text-gray-900">Redeem Points</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  You have <strong className="text-amber-600">{availablePoints} pts</strong> available
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-amber-800">Discount voucher</p>
                <p className="text-xs font-bold text-amber-600">R20 off</p>
              </div>
              <p className="text-xs text-amber-600">Use 100 pts â†’ get R20 off your next booking</p>
            </div>
            {!canRedeem && (
              <p className="text-xs text-red-500 text-center mb-3">You need at least 100 pts to redeem.</p>
            )}
            <button
              type="button"
              onClick={handleRedeem}
              disabled={!canRedeem || loading}
              className="w-full py-3 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              )}
              <span>{loading ? 'Redeeming…' : 'Redeem 100 pts for R20 off'}</span>
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function AddAddressModal({
  onAdd,
  onClose,
}: {
  onAdd: (label: string, address: string) => void;
  onClose: () => void;
}) {
  const [label, setLabel] = useState('');
  const [address, setAddress] = useState('');
  const handleAdd = () => {
    if (!label.trim() || !address.trim()) return;
    onAdd(label.trim(), address.trim());
    onClose();
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
        transition={{ duration: 0.22 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <p className="text-base font-extrabold text-gray-900">Add Address</p>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3 mb-5">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">Label (e.g. Home, Work)</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Home"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-300 outline-none focus:border-blue-300 transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">Full Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="12 Main Rd, Cape Town"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-300 outline-none focus:border-blue-300 transition-colors"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!label.trim() || !address.trim()}
          className="w-full py-3 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Add Address
        </button>
      </motion.div>
    </div>
  );
}

// â”€â”€â”€ Props â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface SubPagesProps {
  page: Exclude<PageId, 'dashboard' | 'book'>;
  onNavigate: (page: PageId) => void;
}

// â”€â”€â”€ BOOKINGS PAGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function BookingsPage({ onNavigate }: { onNavigate: (page: PageId) => void }) {
  const { bookings, loading, cancelBooking, rateBooking, rescheduleBooking } = useBookings();
  const [filter, setFilter] = useState<FilterId>('all');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [trackingBooking, setTrackingBooking] = useState<Booking | null>(null);
  const [contactBooking, setContactBooking] = useState<Booking | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [invoiceTarget, setInvoiceTarget] = useState<Booking | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<Booking | null>(null);
  const PER_PAGE = 4;
  const filtered = filter === 'all' ? bookings : bookings.filter((b) => b.status === filter);
  const paginated = filtered.slice(0, page * PER_PAGE);
  const hasMore = paginated.length < filtered.length;
  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <AnimatePresence>
        {trackingBooking && (
          <TrackCleanerModal booking={trackingBooking} onClose={() => setTrackingBooking(null)} />
        )}
        {contactBooking && (
          <ContactModal booking={contactBooking} onClose={() => setContactBooking(null)} />
        )}
        {cancelTarget && (
          <CancelConfirmModal
            booking={cancelTarget}
            onConfirm={() => cancelBooking(cancelTarget.id)}
            onClose={() => setCancelTarget(null)}
          />
        )}
        {reviewBooking && (
          <ReviewModal
            booking={reviewBooking}
            onSubmit={(rating) => rateBooking(reviewBooking.id, rating)}
            onClose={() => setReviewBooking(null)}
          />
        )}
        {invoiceTarget && (
          <InvoiceModal
            invoiceId={invoiceTarget.invoiceId ?? '—'}
            service={invoiceTarget.service}
            date={invoiceTarget.date}
            amount={invoiceTarget.price}
            onClose={() => setInvoiceTarget(null)}
          />
        )}
        {rescheduleTarget && (
          <RescheduleDatePickerModal
            booking={rescheduleTarget}
            onConfirm={(id, newDate, newTime, newCleaner) =>
              rescheduleBooking(id, newDate, newTime, newCleaner)
            }
            onClose={() => setRescheduleTarget(null)}
          />
        )}
      </AnimatePresence>

      <PageHeader title="My Bookings" subtitle="View and manage all your cleaning appointments" />
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-10">
        <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
          {STATUS_FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                setFilter(opt.id);
                setPage(1);
              }}
              className={cn(
                'flex-shrink-0 text-xs font-bold px-4 py-2 rounded-full border-2 transition-all duration-200',
                filter === opt.id
                  ? 'bg-blue-600 text-white border-transparent'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white border border-gray-200 rounded-2xl p-4 animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-2/3 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <motion.div layout className="space-y-3">
            <AnimatePresence mode="popLayout">
              {paginated.map((booking) => (
                <motion.div
                  key={booking.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 sm:p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-base flex-shrink-0">
                        {booking.cleanerInitial}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-gray-900">{booking.service}</p>
                          <StatusBadge status={booking.status} />
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          <span>{booking.cleaner}</span>
                          <span className="mx-1.5 text-gray-300">·</span>
                          <span>{booking.date}</span>
                          <span className="mx-1.5 text-gray-300">·</span>
                          <span>{booking.time}</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span>{booking.address}</span>
                        </p>
                        {booking.rating !== undefined && (
                          <div className="flex items-center gap-1 mt-1.5">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <Star
                                key={`${booking.id}-star-${i}`}
                                className={cn(
                                  'w-3 h-3',
                                  i <= booking.rating!
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-gray-200 fill-gray-200'
                                )}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <p className="text-sm font-extrabold text-gray-900">{booking.price}</p>
                      <p className="text-[10px] text-gray-400">{booking.invoiceId ?? '—'}</p>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenu((v) => (v === booking.id ? null : booking.id));
                          }}
                          className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors"
                          aria-label="More options"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                        <AnimatePresence>
                          {openMenu === booking.id && (
                            <motion.div
                              initial={{ opacity: 0, y: 6, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 6, scale: 0.95 }}
                              transition={{ duration: 0.12 }}
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 top-9 w-44 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-30"
                            >
                              {booking.status === 'upcoming' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRescheduleTarget(booking);
                                    setOpenMenu(null);
                                  }}
                                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                  <span>Reschedule</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  onNavigate('book');
                                  setOpenMenu(null);
                                }}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
                                <span>Book Again</span>
                              </button>
                              {booking.status !== 'cancelled' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setInvoiceTarget(booking);
                                    setOpenMenu(null);
                                  }}
                                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                  <FileText className="w-3.5 h-3.5 text-gray-400" />
                                  <span>Invoice</span>
                                </button>
                              )}
                              {booking.status === 'upcoming' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCancelTarget(booking);
                                    setOpenMenu(null);
                                  }}
                                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-red-500 hover:bg-red-50 transition-colors border-t border-gray-100"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>Cancel</span>
                                </button>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>

                  {booking.status === 'upcoming' && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setTrackingBooking(booking)}
                        className="flex-1 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-blue-700 transition-colors"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Track Cleaner</span>
                      </motion.button>
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setContactBooking(booking)}
                        className="flex-1 py-2 rounded-xl border-2 border-gray-200 text-gray-700 text-xs font-bold flex items-center justify-center gap-1.5 hover:border-gray-300 transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Contact</span>
                      </motion.button>
                    </div>
                  )}
                  {booking.status === 'completed' && !booking.rating && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => setReviewBooking(booking)}
                        className="w-full py-2 rounded-xl border-2 border-amber-200 bg-amber-50 text-amber-600 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-amber-100 transition-colors"
                      >
                        <Star className="w-3.5 h-3.5" />
                        <span>Leave a Review</span>
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {!loading && filtered.length === 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-7 h-7 text-gray-300" />
                </div>
                <p className="text-sm font-semibold text-gray-500">No bookings here yet</p>
                <p className="text-xs text-gray-400 mt-1 mb-5">Your booking history will appear here</p>
                <button
                  type="button"
                  onClick={() => onNavigate('book')}
                  className="inline-flex items-center gap-2 bg-blue-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Book a Cleaning</span>
                </button>
              </div>
            )}

            {hasMore && (
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                className="w-full py-3 bg-white border border-gray-200 rounded-2xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Load more bookings
              </button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

// â”€â”€â”€ PAYMENTS PAGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function PaymentsPage() {
  const { payments, loading } = usePayments();
  const [invoiceTarget, setInvoiceTarget] = useState<{
    invoiceId: string;
    service: string;
    date: string;
    amount: string;
  } | null>(null);
  const total = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + parseInt(p.amount.replace('R', ''), 10), 0);
  const summaryItems = [
    { id: 'ps-total', label: 'Total Spent', value: `R${total}`, color: 'text-blue-600' },
    { id: 'ps-invoices', label: 'Invoices', value: String(payments.length), color: 'text-indigo-600' },
    {
      id: 'ps-pending',
      label: 'Pending',
      value: String(payments.filter((p) => p.status === 'pending').length),
      color: 'text-amber-600',
    },
  ];
  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <AnimatePresence>
        {invoiceTarget && (
          <InvoiceModal
            invoiceId={invoiceTarget.invoiceId}
            service={invoiceTarget.service}
            date={invoiceTarget.date}
            amount={invoiceTarget.amount}
            onClose={() => setInvoiceTarget(null)}
          />
        )}
      </AnimatePresence>

      <PageHeader title="Payments & Invoices" subtitle="Track your payment history and download invoices" />
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-10">
        <div className="grid grid-cols-3 gap-3 mb-6">
          {summaryItems.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-gray-200 rounded-2xl p-4 text-center shadow-sm"
            >
              <p className={cn('text-xl font-extrabold', item.color)}>{item.value}</p>
              <p className="text-[11px] text-gray-400 mt-0.5 font-medium">{item.label}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white border border-gray-200 rounded-2xl p-4 animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-2/3 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => {
              const st = PAYMENT_STATUS_MAP[payment.status] ?? PAYMENT_STATUS_MAP.paid;
              return (
                <div key={payment.id} className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900">{payment.service}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{payment.date}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5 font-mono">{payment.invoiceId}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <p className="text-sm font-extrabold text-gray-900">{payment.amount}</p>
                      <span
                        className={cn('text-[11px] font-bold border rounded-full px-2.5 py-1 leading-none', st.cls)}
                      >
                        {st.label}
                      </span>
                    </div>
                  </div>
                  {payment.status === 'paid' && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setInvoiceTarget({
                            invoiceId: payment.invoiceId,
                            service: payment.service,
                            date: payment.date,
                            amount: payment.amount,
                          })
                        }
                        className="flex-1 py-2 rounded-xl border-2 border-gray-200 text-gray-700 text-xs font-bold flex items-center justify-center gap-1.5 hover:border-gray-300 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Invoice</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setInvoiceTarget({
                            invoiceId: payment.invoiceId,
                            service: payment.service,
                            date: payment.date,
                            amount: payment.amount,
                          })
                        }
                        className="flex-1 py-2 rounded-xl bg-blue-50 text-blue-600 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-blue-100 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Receipt</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// â”€â”€â”€ REWARDS PAGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function RewardsPage() {
  const { pointsHistory, tiers, redeemPoints } = useRewards();
  const { user } = useProfile();
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(user.referralCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const handleRedeem = () => {
    redeemPoints(100, 'Redeemed for R20 discount');
  };
  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <AnimatePresence>
        {showRedeemModal && (
          <RedeemModal
            availablePoints={user.rewardPoints}
            onRedeem={handleRedeem}
            onClose={() => setShowRedeemModal(false)}
          />
        )}
      </AnimatePresence>

      <PageHeader title="Rewards" subtitle="Earn points, unlock tiers, and redeem perks" />
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-10 space-y-6">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-1">Your Tier</p>
              <p className="text-white text-2xl font-extrabold">{user.rewardTier}</p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center">
              <Star className="w-8 h-8 text-amber-400 fill-amber-400" />
            </div>
          </div>
          <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden mb-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${user.rewardProgress}%` }}
              transition={{ duration: 1.4, ease: 'easeOut', delay: 0.3 }}
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400"
            />
          </div>
          <div className="flex justify-between">
            <p className="text-blue-200 text-xs">{user.rewardPoints} pts earned</p>
            <p className="text-blue-200 text-xs">{user.rewardTarget} pts for Silver</p>
          </div>
          <div className="mt-5 flex gap-3">
            <div className="flex-1 bg-white/15 border border-white/20 rounded-2xl p-3 text-center">
              <p className="text-xl font-extrabold text-white">{user.rewardPoints}</p>
              <p className="text-blue-200 text-xs mt-0.5">Available pts</p>
            </div>
            <div className="flex-1 bg-white/15 border border-white/20 rounded-2xl p-3 text-center">
              <p className="text-xl font-extrabold text-white">
                {Math.max(0, user.rewardTarget - user.rewardPoints)}
              </p>
              <p className="text-blue-200 text-xs mt-0.5">pts to Silver</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
          <p className="text-sm font-bold text-gray-900 mb-4">Tier Breakdown</p>
          <div className="space-y-3">
            {tiers.map((tier) => (
              <div
                key={tier.id}
                className={cn(
                  'flex items-center justify-between px-4 py-3 rounded-xl border',
                  tier.bgColor,
                  tier.borderColor
                )}
              >
                <div className="flex items-center gap-2">
                  <Star className={cn('w-4 h-4', tier.color)} />
                  <p className={cn('text-sm font-bold', tier.color)}>{tier.name}</p>
                </div>
                <p className={cn('text-xs font-semibold', tier.color)}>
                  {tier.minPoints > 0 ? `${tier.minPoints}+ pts` : 'Starting tier'}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
          <p className="text-sm font-bold text-gray-900 mb-4">Points History</p>
          <div className="space-y-3">
            {pointsHistory.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-2 border-b border-gray-50 last:border-b-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800">{item.description}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{item.date}</p>
                </div>
                <p
                  className={cn(
                    'text-sm font-extrabold flex-shrink-0',
                    item.type === 'earned' ? 'text-green-600' : 'text-red-500'
                  )}
                >
                  {item.type === 'earned' ? '+' : ''}
                  {item.points} pts
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-blue-200" />
            <p className="text-sm font-bold text-white">Refer &amp; Earn</p>
          </div>
          <p className="text-xs text-blue-100 leading-relaxed mb-4">
            Share your code and earn <strong className="text-white">R50</strong> for every friend who books.
          </p>
          <div className="flex items-center gap-2 bg-white/15 border border-white/20 rounded-xl px-3 py-2.5">
            <p className="flex-1 text-sm font-bold text-white tracking-widest font-mono">{user.referralCode}</p>
            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={handleCopy}
              className="flex-shrink-0 w-7 h-7 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              aria-label="Copy referral code"
            >
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    <Check className="w-3.5 h-3.5 text-white" />
                  </motion.span>
                ) : (
                  <motion.span key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    <Copy className="w-3.5 h-3.5 text-white" />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
          {copied && (
            <p className="text-[11px] text-blue-200 mt-2 text-center font-semibold">âœ“ Copied to clipboard!</p>
          )}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Use my Shalean referral code ${user.referralCode} to get R50 off your first clean!`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Share via WhatsApp</span>
            </a>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white text-blue-600 text-xs font-bold hover:bg-blue-50 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Code</span>
            </button>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-amber-800">Redeem your points</p>
            <p className="text-xs text-amber-600 mt-0.5">Use 100 pts for R20 off your next booking</p>
          </div>
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowRedeemModal(true)}
            className="flex-shrink-0 inline-flex items-center gap-1.5 bg-amber-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-amber-600 transition-colors"
          >
            <span>Redeem</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}

// â”€â”€â”€ SUPPORT PAGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function SupportPage() {
  const { faqs } = useFaqs();
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSubmitting(false);
    setMessageSent(true);
    setSubject('');
    setMessage('');
    setTimeout(() => setMessageSent(false), 4000);
  };
  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <PageHeader title="Support" subtitle="We're here to help, 24/7" />
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-10 space-y-6">
        <div className="space-y-3">
          {getSupportChannels().map((ch) => (
            <div
              key={ch.id}
              className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                  {ch.icon === 'whatsapp' && <MessageCircle className="w-5 h-5 text-emerald-500" />}
                  {ch.icon === 'email' && <Mail className="w-5 h-5 text-blue-500" />}
                  {ch.icon === 'phone' && <Phone className="w-5 h-5 text-indigo-500" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{ch.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{ch.sub}</p>
                </div>
              </div>
              <motion.a
                href={ch.href}
                target={ch.href.startsWith('http') ? '_blank' : undefined}
                rel={ch.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn('flex-shrink-0 text-xs font-bold px-4 py-2 rounded-xl transition-colors', ch.style)}
              >
                {ch.action}
              </motion.a>
            </div>
          ))}
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-500" />
            <p className="text-sm font-bold text-gray-900">Frequently Asked Questions</p>
          </div>
          <div className="divide-y divide-gray-50">
            {faqs.map((faq) => (
              <div key={faq.id}>
                <button
                  type="button"
                  onClick={() => setOpenFaq((v) => (v === faq.id ? null : faq.id))}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <p className="text-sm font-semibold text-gray-800 pr-4">{faq.question}</p>
                  {openFaq === faq.id ? (
                    <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  )}
                </button>
                <AnimatePresence>
                  {openFaq === faq.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-4 text-xs text-gray-500 leading-relaxed">{faq.answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <p className="text-sm font-bold text-gray-900">Send a Message</p>
          </div>

          <AnimatePresence>
            {messageSent && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                <p className="text-xs font-semibold text-green-700">
                  Message sent! We'll get back to you within 24 hrs.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1.5">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="What can we help with?"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-300 outline-none focus:border-blue-300 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1.5">Message</label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your issue or question..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-300 outline-none focus:border-blue-300 transition-colors resize-none"
              />
            </div>
            <motion.button
              type="button"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSend}
              disabled={submitting || !subject.trim() || !message.trim()}
              className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting && (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              )}
              <span>{submitting ? 'Sending…' : 'Send Message'}</span>
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}

// â”€â”€â”€ PROFILE PAGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function ProfilePage() {
  const router = useRouter();
  const {
    user,
    addresses,
    saveUser,
    saving,
    saved,
    toggleDefaultAddress,
    addAddress,
  } = useProfile();
  const [editName, setEditName] = useState(false);
  const [editPhone, setEditPhone] = useState(false);
  const [nameVal, setNameVal] = useState(user.name);
  const [phoneVal, setPhoneVal] = useState(user.phone);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [copiedReferral, setCopiedReferral] = useState(false);

  useEffect(() => {
    setNameVal(user.name);
    setPhoneVal(user.phone);
  }, [user.name, user.phone]);

  const handleSave = () => {
    saveUser({
      name: nameVal,
      phone: phoneVal,
    });
    setEditName(false);
    setEditPhone(false);
  };
  const handleCopyReferral = () => {
    navigator.clipboard.writeText(user.referralCode).catch(() => {});
    setCopiedReferral(true);
    setTimeout(() => setCopiedReferral(false), 2000);
  };
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowLogoutConfirm(false);
    router.push('/login');
  };
  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <AnimatePresence>
        {showAddAddress && (
          <AddAddressModal
            onAdd={(label, address) => addAddress(label, address)}
            onClose={() => setShowAddAddress(false)}
          />
        )}
        {showLogoutConfirm && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowLogoutConfirm(false)}
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
                <LogOut className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="text-base font-extrabold text-gray-900 text-center mb-2">Log Out?</h3>
              <p className="text-xs text-gray-400 text-center mb-6">
                You'll need to sign in again to access your account.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-sm font-bold text-gray-600 hover:border-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors"
                >
                  Log Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <PageHeader title="My Profile" subtitle="Manage your account details and preferences" />
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-10 space-y-5">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-2xl flex-shrink-0">
            {user.initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xl font-extrabold text-gray-900">{user.name}</p>
            <p className="text-sm text-gray-400">{user.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1 uppercase">
                {user.rewardTier} Member
              </span>
              <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 border border-blue-100 rounded-full px-2.5 py-1">
                {user.rewardPoints} pts
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Personal Details</p>
            {(editName || editPhone) && (
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
              >
                {saving ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>{saving ? 'Saving…' : 'Save'}</span>
              </button>
            )}
          </div>

          <AnimatePresence>
            {saved && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                <p className="text-xs font-semibold text-green-700">Profile saved successfully!</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 mb-0.5">Full Name</p>
                {editName ? (
                  <input
                    type="text"
                    value={nameVal}
                    onChange={(e) => setNameVal(e.target.value)}
                    className="text-sm font-semibold text-gray-900 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-blue-300 w-full"
                  />
                ) : (
                  <p className="text-sm font-semibold text-gray-900">{nameVal}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setEditName((v) => !v)}
                className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors"
              >
                {editName ? <X className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="border-t border-gray-50 pt-4 flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 mb-0.5">Phone</p>
                {editPhone ? (
                  <input
                    type="text"
                    value={phoneVal}
                    onChange={(e) => setPhoneVal(e.target.value)}
                    className="text-sm font-semibold text-gray-900 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-blue-300 w-full"
                  />
                ) : (
                  <p className="text-sm font-semibold text-gray-900">{phoneVal}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setEditPhone((v) => !v)}
                className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors"
              >
                {editPhone ? <X className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="border-t border-gray-50 pt-4">
              <p className="text-xs text-gray-400 mb-0.5">Email</p>
              <p className="text-sm font-semibold text-gray-900">{user.email}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Saved Addresses</p>
            <button
              type="button"
              onClick={() => setShowAddAddress(true)}
              className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors"
              aria-label="Add address"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-3">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl border-2 transition-all',
                  addr.isDefault ? 'border-blue-200 bg-blue-50' : 'border-gray-100 bg-gray-50'
                )}
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                    addr.isDefault ? 'bg-blue-100' : 'bg-gray-100'
                  )}
                >
                  <Home className={cn('w-4 h-4', addr.isDefault ? 'text-blue-600' : 'text-gray-400')} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-xs font-bold', addr.isDefault ? 'text-blue-700' : 'text-gray-700')}>
                    {addr.label}
                  </p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{addr.address}</p>
                </div>
                {!addr.isDefault && (
                  <button
                    type="button"
                    onClick={() => toggleDefaultAddress(addr.id)}
                    className="flex-shrink-0 text-[10px] font-bold text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    Set default
                  </button>
                )}
                {addr.isDefault && (
                  <span className="flex-shrink-0 text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                    Default
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Referral Code</p>
          <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
            <p className="flex-1 text-sm font-bold text-gray-900 tracking-widest font-mono">{user.referralCode}</p>
            <button
              type="button"
              onClick={handleCopyReferral}
              className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-1 hover:bg-blue-100 transition-colors"
            >
              {copiedReferral ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copiedReferral ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">Earn R50 for every friend who completes their first booking</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Account</p>
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-3 py-3 px-4 rounded-xl border border-red-100 bg-red-50 text-red-500 text-sm font-bold hover:bg-red-100 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>

        <div className="flex items-center gap-2 justify-center py-2">
          <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
          <p className="text-xs text-gray-400">Your data is protected with 256-bit SSL encryption</p>
        </div>
      </div>
    </div>
  );
}

// â”€â”€â”€ Main Export â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function SubPages({ page, onNavigate }: SubPagesProps) {
  return (
    <AnimatePresence mode="wait">
      {page === 'bookings' && (
        <motion.div
          key="bookings"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <BookingsPage onNavigate={onNavigate} />
        </motion.div>
      )}
      {page === 'payments' && (
        <motion.div
          key="payments"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <PaymentsPage />
        </motion.div>
      )}
      {page === 'rewards' && (
        <motion.div
          key="rewards"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <RewardsPage />
        </motion.div>
      )}
      {page === 'support' && (
        <motion.div
          key="support"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <SupportPage />
        </motion.div>
      )}
      {page === 'profile' && (
        <motion.div
          key="profile"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <ProfilePage />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

