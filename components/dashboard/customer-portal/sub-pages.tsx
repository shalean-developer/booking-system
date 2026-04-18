'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
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
import { supabase } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { getAbsoluteReferralSignupUrl, getReferralSignupPath } from '@/lib/referral-url';
import { isCompletedBooking } from '@/shared/dashboard-data';
import {
  useBookings,
  usePayments,
  useRewards,
  useFaqs,
  useProfile,
  useNotifications,
  isCustomerUpcomingBooking,
} from './hooks';
import { RescheduleDatePickerModal } from './reschedule-date-picker-modal';
import type { Booking, FilterId, PageId } from './types';
import { cleanerTelHref, cleanerWhatsAppHref, supportTelHref, supportWhatsAppHref } from './booking-contact';
import {
  TrackCleanerModal,
  ContactModal,
  CancelConfirmModal,
  ReviewModal,
} from './dashboard-home-modals';
import { StatusBadge } from '../shared/status-badge';

// --- Constants ---

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
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() ?? '';
  const phone = process.env.NEXT_PUBLIC_SUPPORT_PHONE?.trim();
  const wa = supportWhatsAppHref();
  const emailHref = supportEmail ? `mailto:${supportEmail}` : '';
  const emailSub = supportEmail
    ? supportEmail
    : 'Set NEXT_PUBLIC_SUPPORT_EMAIL in your environment';
  return [
    {
      id: 'ch-whatsapp',
      icon: 'whatsapp',
      title: 'WhatsApp Chat',
      sub: phone ? `Quick replies on ${phone}` : 'Set NEXT_PUBLIC_SUPPORT_PHONE',
      action: wa ? 'Chat Now' : supportEmail ? 'Email us' : 'Configure support email',
      style: wa ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300',
      href: wa || (supportEmail ? `mailto:${supportEmail}?subject=Support` : '#support-email'),
    },
    {
      id: 'ch-email',
      icon: 'email',
      title: 'Email Support',
      sub: emailSub,
      action: supportEmail ? 'Send Email' : 'Not configured',
      style: 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300',
      href: emailHref || '#support-email',
    },
    {
      id: 'ch-call',
      icon: 'phone',
      title: 'Call Us',
      sub: phone ? `${phone} · Mon–Fri` : 'Set NEXT_PUBLIC_SUPPORT_PHONE',
      action: 'Call Now',
      style: 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300',
      href: supportTelHref() || (supportEmail ? `mailto:${supportEmail}?subject=Call%20request` : '#support-email'),
    },
  ];
}

// --- Shared helpers ---

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

// --- Props ---

interface SubPagesProps {
  page: Exclude<PageId, 'dashboard' | 'book'>;
  onNavigate: (page: PageId) => void;
}

// --- Bookings page ---

function BookingsPage({ onNavigate }: { onNavigate: (page: PageId) => void }) {
  const {
    bookings,
    loading,
    loadMoreBookings,
    hasMoreBookings,
    loadingMore,
    cancelBooking,
    rateBooking,
    rescheduleBooking,
  } = useBookings();
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
  const filtered =
    filter === 'all'
      ? bookings
      : filter === 'upcoming'
        ? bookings.filter(isCustomerUpcomingBooking)
        : bookings.filter((b) => b.status === filter);
  const paginated = filtered.slice(0, page * PER_PAGE);
  const hasMoreLocal = paginated.length < filtered.length;
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
            onSubmit={async (payload) => {
              await rateBooking(reviewBooking.id, payload);
              setReviewBooking(null);
            }}
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
            onConfirm={(id, newDate, newTime, cleanerId, teamName) =>
              rescheduleBooking(id, newDate, newTime, cleanerId, teamName)
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
                        {booking.roomSummary ? (
                          <p className="text-xs text-gray-500 mt-1">{booking.roomSummary}</p>
                        ) : null}
                        {booking.rating !== undefined && booking.rating > 0 && (
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
                          onMouseDown={(e) => e.stopPropagation()}
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
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 top-9 w-44 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-30"
                            >
                              {isCustomerUpcomingBooking(booking) && (
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
                              {isCustomerUpcomingBooking(booking) && (
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

                  {isCustomerUpcomingBooking(booking) && (
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
                  {isCompletedBooking(booking.dbStatus) && !booking.customerReviewed && (
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

            {(hasMoreLocal || hasMoreBookings) && (
              <button
                type="button"
                onClick={() => {
                  if (hasMoreLocal) setPage((p) => p + 1);
                  else void loadMoreBookings();
                }}
                disabled={loadingMore}
                className="w-full py-3 bg-white border border-gray-200 rounded-2xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-60"
              >
                {loadingMore
                  ? 'Loading…'
                  : hasMoreLocal
                    ? 'Load more bookings'
                    : 'Load older bookings'}
              </button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

// --- Payments page ---

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

// --- Rewards page ---

function RewardsPage() {
  const { pointsHistory } = useRewards();
  const { user } = useProfile();
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    if (!user.referralEnabled) return;
    const payload = user.customerId
      ? getAbsoluteReferralSignupUrl(user.customerId)
      : user.referralCode ?? '';
    if (!payload) return;
    navigator.clipboard.writeText(payload).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <PageHeader
        title="Rewards"
        subtitle="Points from completed bookings — referral perks below"
      />
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-10 space-y-6">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-1">
                Your balance
              </p>
              <p className="text-white text-2xl font-extrabold">{user.rewardPoints} pts</p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center">
              <Star className="w-8 h-8 text-amber-400 fill-amber-400" />
            </div>
          </div>
          <p className="text-blue-100 text-xs leading-relaxed">
            Points are updated when jobs complete. In-app redemption is not available yet — your balance
            is stored on your profile.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
          <p className="text-sm font-bold text-gray-900 mb-4">Points History</p>
          {pointsHistory.length === 0 ? (
            <p className="text-xs text-gray-500">No point transactions yet — complete a clean to start earning.</p>
          ) : (
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
          )}
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-blue-200" />
            <p className="text-sm font-bold text-white">Refer &amp; Earn</p>
          </div>
          {user.referralEnabled ? (
            <>
              <p className="text-xs text-blue-100 leading-relaxed mb-4">
                Share your code and earn rewards when friends book.
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
                <p className="text-[11px] text-blue-200 mt-2 text-center font-semibold">Copied to clipboard!</p>
              )}
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                {user.customerId ? (
                  <a
                    href={getReferralSignupPath(user.customerId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white text-blue-600 text-xs font-bold hover:bg-blue-50 transition-colors sm:col-span-1"
                  >
                    <span>Friend signup</span>
                  </a>
                ) : null}
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    user.customerId
                      ? `Join Shalean with my link: ${getAbsoluteReferralSignupUrl(user.customerId)}`
                      : `Use my Shalean referral code ${user.referralCode ?? ''} to book.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy link</span>
                </button>
              </div>
            </>
          ) : (
            <p className="text-xs text-blue-100 leading-relaxed">
              Referral system coming soon. We&apos;ll let you know when you can share and earn.
            </p>
          )}
        </div>

      </div>
    </div>
  );
}

// --- Support page ---

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

// --- Profile page ---

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
    if (!user.referralEnabled) return;
    const text = user.referralCode ?? '';
    if (!text) return;
    navigator.clipboard.writeText(text).catch(() => {});
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
              {user.rewardTier ? (
                <span className="text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1 uppercase">
                  {user.rewardTier} Member
                </span>
              ) : null}
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
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Referral</p>
          {user.referralEnabled ? (
            <>
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
              <p className="text-xs text-gray-400 mt-2">Rewards apply when referral rules are active.</p>
            </>
          ) : (
            <p className="text-sm text-gray-600">Referral system coming soon.</p>
          )}
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

// --- Notifications ---

function NotificationsPage() {
  const { notifications, markRead, markAllRead } = useNotifications();
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <PageHeader title="Notifications" subtitle="Updates and reminders from Shalean" />
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-10">
        <div className="flex items-center justify-end mb-4">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>
        <div className="space-y-2">
          {notifications.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
              <p className="text-sm text-gray-500">No notifications yet</p>
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => markRead(n.id)}
                className={cn(
                  'w-full text-left bg-white border border-gray-200 rounded-2xl p-4 flex gap-3 items-start transition-colors hover:bg-gray-50',
                  !n.read && 'bg-blue-50/50 border-blue-100'
                )}
              >
                <div
                  className={cn(
                    'w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
                    n.read ? 'bg-gray-300' : 'bg-blue-500'
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">{n.title}</p>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{n.body}</p>
                  <p className="text-[10px] text-gray-400 mt-1.5">{n.time}</p>
                </div>
                {n.read && <Check className="w-3.5 h-3.5 text-gray-300 flex-shrink-0 mt-1" />}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// --- Earn & Share ---

function EarnSharePage({ onNavigate }: { onNavigate: (page: PageId) => void }) {
  const { user } = useProfile();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!user.referralEnabled) return;
    const payload = user.customerId
      ? getAbsoluteReferralSignupUrl(user.customerId)
      : user.referralCode ?? '';
    if (!payload) return;
    navigator.clipboard.writeText(payload).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <PageHeader title="Earn & Share" subtitle="Invite friends and earn rewards when they book" />
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-10">
        <div className="max-w-lg mx-auto space-y-4">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-blue-200" />
              <p className="text-base font-bold text-white">Refer &amp; Earn</p>
            </div>
            {user.referralEnabled ? (
              <>
                <p className="text-sm text-blue-100 leading-relaxed mb-5">
                  Share your code and earn rewards when friends book.
                </p>
                <div className="flex items-center gap-2 bg-white/15 border border-white/20 rounded-xl px-3 py-2.5">
                  <p className="flex-1 text-sm font-bold text-white tracking-widest font-mono">{user.referralCode}</p>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.9 }}
                    onClick={handleCopy}
                    className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                    aria-label={user.customerId ? 'Copy referral signup link' : 'Copy referral code'}
                  >
                    {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-white" />}
                  </motion.button>
                </div>
                {copied && (
                  <p className="text-[11px] text-blue-200 mt-2 text-center font-semibold">Copied to clipboard</p>
                )}
                {user.customerId ? (
                  <motion.a
                    href={getReferralSignupPath(user.customerId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="mt-4 w-full py-2.5 rounded-xl bg-white text-blue-600 text-sm font-bold flex items-center justify-center gap-1.5 hover:bg-blue-50 transition-colors"
                  >
                    <span>Open friend signup link</span>
                    <ArrowRight className="w-4 h-4" />
                  </motion.a>
                ) : (
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onNavigate('rewards')}
                    className="mt-4 w-full py-2.5 rounded-xl bg-white text-blue-600 text-sm font-bold flex items-center justify-center gap-1.5 hover:bg-blue-50 transition-colors"
                  >
                    <span>Rewards</span>
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                )}
              </>
            ) : (
              <p className="text-sm text-blue-100 leading-relaxed">
                Referral system coming soon. We&apos;re finishing the rewards experience — check back later.
              </p>
            )}
          </div>
          <p className="text-xs text-center text-gray-400">
            {user.rewardPoints} pts
            {user.rewardTier ? ` · ${user.rewardTier} member` : ''}
          </p>
        </div>
      </div>
    </div>
  );
}

// --- Main export ---

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
      {page === 'notifications' && (
        <motion.div
          key="notifications"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <NotificationsPage />
        </motion.div>
      )}
      {page === 'earn-share' && (
        <motion.div
          key="earn-share"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <EarnSharePage onNavigate={onNavigate} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

