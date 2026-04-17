'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Calendar,
  CalendarPlus,
  RefreshCw,
  MapPin,
  ChevronRight,
  Star,
  MoreVertical,
  Phone,
  Heart,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  MessageCircle,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useBookings,
  useStats,
  useQuickActions,
  useProfile,
} from './hooks';
import { RescheduleDatePickerModal } from './reschedule-date-picker-modal';
import { supportWhatsAppHref } from './booking-contact';
import {
  STATUS_FILTER_OPTIONS,
  TRUST_BADGES,
  StatusBadge,
  StatCounter,
  BookingSkeleton,
  TrackCleanerModal,
  ContactModal,
  CancelConfirmModal,
  ReviewModal,
} from './dashboard-home-modals';
import type { Booking, PageId, FilterId } from './types';
import { getAbsoluteReferralSignupUrl, getReferralSignupPath } from '@/lib/referral-url';

interface DashboardHomeProps {
  onNavigate: (page: PageId) => void;
}

export function DashboardHome({ onNavigate }: DashboardHomeProps) {
  const {
    bookings,
    loading,
    cancelBooking,
    rateBooking,
    rescheduleBooking,
  } = useBookings();
  const { stats, loading: statsLoading } = useStats();
  const { actions } = useQuickActions();
  const { user } = useProfile();

  const [filter, setFilter] = useState<FilterId>('all');
  const [openBookingMenu, setOpenBookingMenu] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [trackingBooking, setTrackingBooking] = useState<Booking | null>(null);
  const [contactBooking, setContactBooking] = useState<Booking | null>(null);
  const [cancelBookingTarget, setCancelBookingTarget] = useState<Booking | null>(null);
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<Booking | null>(null);

  const upcomingBooking = bookings.find((b) => b.status === 'upcoming');
  const filteredBookings =
    filter === 'all' ? bookings.slice(0, 3) : bookings.filter((b) => b.status === filter).slice(0, 3);
  const supportWaHref = supportWhatsAppHref();

  const displayFirstName = () => {
    const part = user.name?.split(/\s+/)[0];
    if (!part || part === 'Account') return 'there';
    return part;
  };

  const handleCopy = () => {
    const payload = user.customerId
      ? getAbsoluteReferralSignupUrl(user.customerId)
      : user.referralCode;
    navigator.clipboard.writeText(payload).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const closeMenu = () => setOpenBookingMenu(null);
    document.addEventListener('mousedown', closeMenu);
    return () => document.removeEventListener('mousedown', closeMenu);
  }, []);

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <AnimatePresence>
        {trackingBooking && (
          <TrackCleanerModal
            key="track"
            booking={trackingBooking}
            onClose={() => setTrackingBooking(null)}
          />
        )}
        {contactBooking && (
          <ContactModal key="contact" booking={contactBooking} onClose={() => setContactBooking(null)} />
        )}
        {cancelBookingTarget && (
          <CancelConfirmModal
            key="cancel"
            booking={cancelBookingTarget}
            onConfirm={() => cancelBooking(cancelBookingTarget.id)}
            onClose={() => setCancelBookingTarget(null)}
          />
        )}
        {reviewBooking && (
          <ReviewModal
            key="review"
            booking={reviewBooking}
            onSubmit={(rating) => rateBooking(reviewBooking.id, rating)}
            onClose={() => setReviewBooking(null)}
          />
        )}
        {rescheduleTarget && (
          <RescheduleDatePickerModal
            key="reschedule"
            booking={rescheduleTarget}
            onConfirm={(id, newDate, newTime, newCleaner) =>
              rescheduleBooking(id, newDate, newTime, newCleaner)
            }
            onClose={() => setRescheduleTarget(null)}
          />
        )}
      </AnimatePresence>

      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div>
            <h1 className="text-white text-2xl sm:text-3xl font-extrabold leading-tight">
              Hello, {displayFirstName()} 👋
            </h1>
            <p className="text-blue-100 text-sm mt-1.5">
              {upcomingBooking ? (
                <span>
                  <span>Your next clean is </span>
                  <strong className="text-white">
                    {upcomingBooking.date} · {upcomingBooking.time}
                  </strong>
                </span>
              ) : (
                <span>You have no upcoming bookings. Book one today!</span>
              )}
            </p>
          </div>
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate('book')}
            className="self-start sm:self-auto inline-flex items-center gap-2 bg-white text-blue-600 font-bold text-sm px-5 py-3 rounded-xl shadow-md hover:shadow-lg transition-shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Book a Cleaning</span>
          </motion.button>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-7 pb-24 lg:pb-16 lg:grid lg:grid-cols-[1fr_320px] lg:gap-8 lg:items-start">
        <div className="space-y-7">
          <section aria-label="Quick actions">
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible">
              {actions.map((action) => (
                <motion.button
                  key={action.id}
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onNavigate(action.page)}
                  className="flex-shrink-0 bg-white border border-gray-200 rounded-2xl px-4 py-4 flex items-center gap-3 w-44 sm:w-auto sm:flex-1 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                      action.bgClass,
                      action.colorClass
                    )}
                  >
                    {action.id === 'qa-upcoming' && <Calendar className="w-5 h-5" />}
                    {action.id === 'qa-book' && <CalendarPlus className="w-5 h-5" />}
                    {action.id === 'qa-rewards' && <Star className="w-5 h-5" />}
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{action.label}</p>
                    <p className="text-xs text-gray-400 truncate">{action.sublabel}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </section>

          <section aria-label="Your statistics">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm px-5 py-5">
              <div className="flex items-center gap-2 mb-5">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <h2 className="text-sm font-bold text-gray-900">Your Stats</h2>
              </div>
              {statsLoading ? (
                <div className="flex divide-x divide-gray-100">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="flex-1 text-center animate-pulse">
                      <div className="h-7 bg-gray-100 rounded w-12 mx-auto mb-1" />
                      <div className="h-3 bg-gray-100 rounded w-16 mx-auto" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex divide-x divide-gray-100">
                  {stats.map((stat) => (
                    <StatCounter key={stat.id} stat={stat} />
                  ))}
                </div>
              )}
            </div>
          </section>

          <section aria-labelledby="bookings-heading">
            <div className="flex items-center justify-between mb-4">
              <h2 id="bookings-heading" className="text-base font-bold text-gray-900">
                Recent Bookings
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('bookings')}
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
              >
                <span>View all</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible scrollbar-hide">
              {STATUS_FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setFilter(opt.id)}
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

            <motion.div layout className="space-y-3">
              {loading ? (
                <div className="space-y-3">
                  <BookingSkeleton />
                  <BookingSkeleton />
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {filteredBookings.map((booking) => (
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
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-bold text-gray-900">{booking.service}</p>
                            <StatusBadge status={booking.status} />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
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
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <p className="text-sm font-extrabold text-gray-900">{booking.price}</p>
                          <div className="relative">
                            <button
                              type="button"
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenBookingMenu((v) => (v === booking.id ? null : booking.id));
                              }}
                              className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors"
                              aria-label="More options"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                            <AnimatePresence>
                              {openBookingMenu === booking.id && (
                                <motion.div
                                  initial={{ opacity: 0, y: 6, scale: 0.95 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: 6, scale: 0.95 }}
                                  transition={{ duration: 0.12 }}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onClick={(e) => e.stopPropagation()}
                                  className="absolute right-0 top-9 w-44 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-30"
                                >
                                  {booking.status === 'upcoming' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setRescheduleTarget(booking);
                                        setOpenBookingMenu(null);
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
                                      setOpenBookingMenu(null);
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
                                        onNavigate('payments');
                                        setOpenBookingMenu(null);
                                      }}
                                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                      <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                                      <span>View Invoice</span>
                                    </button>
                                  )}
                                  {booking.status === 'upcoming' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCancelBookingTarget(booking);
                                        setOpenBookingMenu(null);
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
                      {booking.status === 'completed' && !booking.customerReviewed && (
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
              )}
              {!loading && filteredBookings.length === 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <Calendar className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm font-semibold text-gray-500">No bookings found</p>
                  <p className="text-xs text-gray-400 mt-1">Book a cleaning to get started</p>
                  <button
                    type="button"
                    onClick={() => onNavigate('book')}
                    className="mt-4 inline-flex items-center gap-1.5 bg-blue-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Book Now</span>
                  </button>
                </div>
              )}
            </motion.div>
          </section>
        </div>

        <aside className="mt-7 lg:mt-0 space-y-4" aria-label="Account sidebar">
          <button
            type="button"
            onClick={() => onNavigate('rewards')}
            className="w-full text-left bg-white border border-gray-200 rounded-2xl shadow-sm p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center flex-shrink-0">
                <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{user.rewardTier} Member</p>
                <p className="text-xs text-gray-400">
                  {user.nextTierName
                    ? `${user.rewardPoints} / ${user.rewardTarget} pts to ${user.nextTierName}`
                    : `${user.rewardPoints} pts`}
                </p>
              </div>
              <div className="ml-auto flex-shrink-0">
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1 uppercase">
                  {user.rewardTier}
                </span>
              </div>
            </div>
            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${user.rewardProgress}%` }}
                transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400"
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <p className="text-[10px] text-gray-400">{user.rewardTier}</p>
              <p className="text-[10px] text-gray-400">
                {user.nextTierName ? `${user.nextTierName} at ${user.rewardTarget} pts` : 'Top tier'}
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="w-3.5 h-3.5 text-blue-500 fill-blue-400" />
                <p className="text-xs text-gray-600 font-semibold">
                  <span>{user.rewardPoints} pts</span>
                  <span className="text-gray-400 font-normal ml-1">available</span>
                </p>
              </div>
              <span className="text-xs font-bold text-blue-600 flex items-center gap-1">
                <span>View Rewards</span>
                <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </button>

          <div className="bg-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <p className="text-sm font-bold text-white">Priority Support</p>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Priority WhatsApp support for members — 24/7.
            </p>
            <motion.a
              href={supportWaHref}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chat on WhatsApp</span>
            </motion.a>
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
                aria-label={user.customerId ? 'Copy referral signup link' : 'Copy referral code'}
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
              <p className="text-[11px] text-blue-200 mt-2 text-center font-semibold">
                ✓ Copied to clipboard!
              </p>
            )}
            {user.customerId ? (
              <motion.a
                href={getReferralSignupPath(user.customerId)}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="mt-3 w-full py-2.5 rounded-xl bg-white text-blue-600 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-blue-50 transition-colors"
              >
                <span>Friend signup link</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </motion.a>
            ) : (
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigate('rewards')}
                className="mt-3 w-full py-2.5 rounded-xl bg-white text-blue-600 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-blue-50 transition-colors"
              >
                <span>Rewards &amp; referral</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </motion.button>
            )}
          </div>

          <div className="space-y-2 px-1">
            {TRUST_BADGES.map((badge) => (
              <div key={badge.id} className="flex items-center gap-2">
                {badge.type === 'shield' && (
                  <ShieldCheck className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                )}
                {badge.type === 'check' && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                )}
                {badge.type === 'spark' && (
                  <Sparkles className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                )}
                <p className="text-xs text-gray-400">{badge.text}</p>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
