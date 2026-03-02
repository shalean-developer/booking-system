'use client';

import React, { useState, useMemo } from 'react';
import {
  Award,
  Check,
  ChevronLeft,
  CheckCircle2,
  Star,
  ShieldCheck,
  Clock,
  Calendar,
  Home,
  Layers,
  Sparkles,
  Wind,
  Plus,
  Users,
  CreditCard,
  Download,
  RefreshCw,
  MessageSquare,
  User,
  MapPin,
  Zap,
  Tag,
  Building2,
  Sofa,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getNextTierGoal } from '@/lib/rewards';

// --- TYPES ---

export type ServiceType = 'standard' | 'deep' | 'move' | 'airbnb' | 'carpet';

export type DashboardTab = 'overview' | 'bookings' | 'profile' | 'rewards';

export type RewardTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

export interface UserProfileBooking {
  id: string;
  ref: string;
  date: string;
  time: string;
  service: ServiceType;
  status: 'upcoming' | 'completed' | 'cancelled';
  total: number;
  address?: string;
  instructions?: string;
  cleanerName?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  bookings: UserProfileBooking[];
  points?: number;
  tier?: RewardTier;
}

// --- CONSTANTS (labels only, for dashboard display) ---

const SERVICES: { id: ServiceType; title: string; icon: React.ReactNode }[] = [
  { id: 'standard', title: 'Standard Clean', icon: <Sparkles className="w-6 h-6" /> },
  { id: 'deep', title: 'Deep Clean', icon: <Layers className="w-6 h-6" /> },
  { id: 'move', title: 'Move In / Out', icon: <Home className="w-6 h-6" /> },
  { id: 'airbnb', title: 'Airbnb Turn', icon: <Calendar className="w-6 h-6" /> },
  { id: 'carpet', title: 'Carpet Clean', icon: <Wind className="w-6 h-6" /> },
];

const TIER_CONFIG: Record<
  RewardTier,
  { color: string; bg: string; border: string; next: number; icon: React.ReactNode }
> = {
  Bronze: {
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-100',
    next: 500,
    icon: <Award className="w-4 h-4" />,
  },
  Silver: {
    color: 'text-slate-400',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    next: 1000,
    icon: <Award className="w-4 h-4" />,
  },
  Gold: {
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    next: 2500,
    icon: <Award className="w-4 h-4" />,
  },
  Platinum: {
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    border: 'border-indigo-100',
    next: 5000,
    icon: <Award className="w-4 h-4" />,
  },
};

// --- HELPERS ---

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-ZA', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

/** Format total_amount (stored in cents) as Rands, e.g. R263.50 */
function formatTotal(cents: number): string {
  return `R${((cents ?? 0) / 100).toFixed(2)}`;
}

// --- COMPONENT ---

export interface CustomerDashboardProps {
  user: UserProfile;
  onLogout: () => void;
  onNewBooking: () => void;
  onAutoRebook: (booking: UserProfileBooking) => void;
  onReschedule: (booking: UserProfileBooking) => void;
  onCancel: (bookingId: string) => void;
}

export function CustomerDashboard({
  user,
  onLogout,
  onNewBooking,
  onAutoRebook,
  onReschedule,
  onCancel,
}: CustomerDashboardProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopyReferral = () => {
    const link = 'shalean.co.za/ref/alexj7';
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedBooking = useMemo(
    () => user.bookings.find((b) => b.id === selectedBookingId),
    [user.bookings, selectedBookingId]
  );

  const points = user.points ?? 0;
  const tier = user.tier ?? 'Bronze';
  const tierConfig = TIER_CONFIG[tier];
  const nextTierGoal = getNextTierGoal(tier);
  const nextTierLabel =
    tier === 'Bronze'
      ? 'Silver'
      : tier === 'Silver'
        ? 'Gold'
        : tier === 'Gold'
          ? 'Platinum'
          : 'Platinum';

  const tabs: { id: DashboardTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Layers className="w-4 h-4" /> },
    { id: 'bookings', label: 'My Bookings', icon: <Calendar className="w-4 h-4" /> },
    { id: 'rewards', label: 'Rewards', icon: <Zap className="w-4 h-4" /> },
    { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
  ];

  // Booking detail view
  if (selectedBookingId && selectedBooking) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-6 md:space-y-10"
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedBookingId(null)}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-slate-600" />
          </button>
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-none">
              Booking Details
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Reference: <span className="font-mono font-bold text-blue-600">{selectedBooking.ref}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 md:p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                    {SERVICES.find((s) => s.id === selectedBooking.service)?.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">
                      {SERVICES.find((s) => s.id === selectedBooking.service)?.title}
                    </h3>
                    <p className="text-slate-500 text-sm">
                      {formatDate(selectedBooking.date)} at {selectedBooking.time}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest w-fit ${
                    selectedBooking.status === 'upcoming'
                      ? 'bg-blue-50 text-blue-600'
                      : selectedBooking.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-slate-50 text-slate-400'
                  }`}
                >
                  {selectedBooking.status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-50">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        Service Address
                      </p>
                      <p className="text-sm font-bold text-slate-700 leading-relaxed">
                        {selectedBooking.address || '123 Beach Road, Sea Point'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        Special Instructions
                      </p>
                      <p className="text-sm font-medium text-slate-600 italic leading-relaxed">
                        {selectedBooking.instructions || 'No special instructions provided.'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        Assigned Cleaner
                      </p>
                      <p className="text-sm font-bold text-slate-700 leading-relaxed">
                        {selectedBooking.cleanerName || 'Pro Team Assigned'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CreditCard className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        Payment Method
                      </p>
                      <p className="text-sm font-bold text-slate-700 leading-relaxed">Paid via Credit Card</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <ShieldCheck className="w-32 h-32" />
              </div>
              <div className="relative z-10">
                <h4 className="text-xl font-black mb-4">
                  {selectedBooking.status === 'completed' ? 'Love your clean?' : 'Need to reschedule?'}
                </h4>
                <p className="text-slate-400 text-sm mb-6 max-w-md">
                  {selectedBooking.status === 'completed'
                    ? 'Book your next session now and keep your space sparkling clean with our pro team.'
                    : 'Life happens. You can reschedule your booking up to 24 hours before the start time at no extra cost.'}
                </p>
                <div className="flex flex-wrap gap-4">
                  {selectedBooking.status === 'completed' ? (
                    <button
                      onClick={() => {
                        onAutoRebook(selectedBooking);
                        setSelectedBookingId(null);
                      }}
                      className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-xs hover:bg-blue-700 transition-all flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Rebook Now
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          onReschedule(selectedBooking);
                          setSelectedBookingId(null);
                        }}
                        className="px-6 py-3 bg-white text-slate-900 rounded-xl font-black text-xs hover:bg-slate-100 transition-all"
                      >
                        Reschedule Clean
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Are you sure you want to cancel this booking?')) {
                            onCancel(selectedBooking.id);
                            setSelectedBookingId(null);
                          }
                        }}
                        className="px-6 py-3 bg-white/10 text-white border border-white/20 rounded-xl font-black text-xs hover:bg-white/20 transition-all"
                      >
                        Cancel Booking
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">
                Order Summary
              </h4>
              <div className="space-y-4 mb-8">
                <div className="pt-4 border-t border-slate-50 flex justify-between">
                  <span className="text-sm font-black text-slate-900">Total Amount</span>
                  <span className="text-lg font-black text-blue-600">{formatTotal(selectedBooking.total)}</span>
                </div>
              </div>
              <button
                className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                onClick={() =>
                  alert('Generating your invoice PDF... your download will start shortly.')
                }
              >
                <Download className="w-4 h-4" />
                Download Invoice
              </button>
            </div>

            <div className="bg-blue-50 rounded-[32px] p-6 border border-blue-100">
              <h4 className="text-[10px] font-black text-blue-900 uppercase tracking-widest mb-4">Support</h4>
              <p className="text-xs text-blue-700 font-medium mb-6 leading-relaxed">
                Have a question about this specific booking? Our support team is ready to help.
              </p>
              <button
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-black text-xs hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                onClick={() => window.open('https://wa.me/27215550123', '_blank')}
              >
                <MessageSquare className="w-4 h-4" />
                Chat Support
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Main dashboard with tabs
  return (
    <div className="space-y-6 md:space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-none mb-3">
            Hello, {user.name.split(' ')[0]}
          </h2>
          <p className="text-slate-500 text-sm">Welcome back to your Shalean dashboard.</p>
        </div>
        <button
          onClick={onNewBooking}
          className="flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-500/20 hover:bg-blue-700 hover:-translate-y-0.5 transition-all"
        >
          <Plus className="w-5 h-5" />
          New Booking
        </button>
      </div>

      <div className="flex items-center gap-1 md:gap-2 p-1 md:p-1.5 bg-slate-100/50 rounded-2xl w-full md:w-fit overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col md:flex-row items-center gap-1 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-xl text-[9px] md:text-xs font-black transition-all whitespace-nowrap ${
              activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8 md:space-y-10"
          >
            <div className="grid grid-cols-3 gap-2 md:gap-6">
              <div className="bg-white p-3 md:p-6 rounded-2xl md:rounded-[32px] border border-slate-100 shadow-sm">
                <div className="w-7 h-7 md:w-10 md:h-10 bg-blue-50 rounded-lg md:rounded-xl flex items-center justify-center text-blue-600 mb-2 md:mb-4">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <p className="text-[7px] md:text-[10px] font-black text-slate-400 uppercase tracking-tight md:tracking-widest mb-0.5 md:mb-1">
                  Total Bookings
                </p>
                <p className="text-lg md:text-3xl font-black text-slate-900">{user.bookings.length}</p>
              </div>
              <div className="bg-white p-3 md:p-6 rounded-2xl md:rounded-[32px] border border-slate-100 shadow-sm">
                <div className="w-7 h-7 md:w-10 md:h-10 bg-emerald-50 rounded-lg md:rounded-xl flex items-center justify-center text-emerald-600 mb-2 md:mb-4">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <p className="text-[7px] md:text-[10px] font-black text-slate-400 uppercase tracking-tight md:tracking-widest mb-0.5 md:mb-1">
                  Hours Cleaned
                </p>
                <p className="text-lg md:text-3xl font-black text-slate-900">
                  {user.bookings.filter((b) => b.status === 'completed').length * 4}
                </p>
              </div>
              <div className="bg-white p-3 md:p-6 rounded-2xl md:rounded-[32px] border border-slate-100 shadow-sm">
                <div className="w-7 h-7 md:w-10 md:h-10 bg-indigo-50 rounded-lg md:rounded-xl flex items-center justify-center text-indigo-600 mb-2 md:mb-4">
                  <Tag className="w-3.5 h-3.5" />
                </div>
                <p className="text-[7px] md:text-[10px] font-black text-slate-400 uppercase tracking-tight md:tracking-widest mb-0.5 md:mb-1">
                  Rewards Pts
                </p>
                <p className="text-lg md:text-3xl font-black text-slate-900">{points}</p>
              </div>
            </div>

            <section className="bg-gradient-to-br from-white to-slate-50 p-6 md:p-8 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                <Award className="w-32 h-32 text-blue-600" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${tierConfig.bg} ${tierConfig.color} border ${tierConfig.border}`}
                  >
                    {tier} Tier Member
                  </span>
                  {tier !== 'Platinum' && (
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {nextTierGoal - points} pts to {nextTierLabel}
                    </span>
                  )}
                </div>
                <h4 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight mb-2">
                  Tier Progress
                </h4>
                <div className="w-full bg-slate-200 rounded-full h-2.5 mb-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(100, (points / nextTierGoal) * 100)}%`,
                    }}
                    className="h-full bg-blue-600 rounded-full"
                  />
                </div>
                <p className="text-xs text-slate-500 font-medium italic">
                  You&apos;re making great progress towards your next free deep clean!
                </p>
              </div>
            </section>

            <section>
              <h3 className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mb-4 md:mb-6">
                Recent Activity
              </h3>

              <div className="block md:hidden space-y-3">
                {user.bookings.slice(0, 3).map((booking) => (
                  <div
                    key={booking.id}
                    className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-[10px] font-black text-slate-900 font-mono tracking-wider bg-slate-100 px-2 py-1 rounded-md">
                        {booking.ref}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                          booking.status === 'upcoming'
                            ? 'bg-blue-50 text-blue-600'
                            : booking.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-slate-50 text-slate-400'
                        }`}
                      >
                        {booking.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-bold text-slate-900">
                        {SERVICES.find((s) => s.id === booking.service)?.title}
                      </p>
                      <button
                        onClick={() => setSelectedBookingId(booking.id)}
                        className="text-[10px] font-black text-blue-600 uppercase"
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden md:block bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-50">
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Reference
                        </th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Service
                        </th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Status
                        </th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {user.bookings.slice(0, 3).map((booking) => (
                        <tr key={booking.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-6">
                            <span className="text-xs font-black text-slate-900 font-mono tracking-wider bg-slate-100 px-2 py-1 rounded-md">
                              {booking.ref}
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            <span className="text-sm font-bold text-slate-900">
                              {SERVICES.find((s) => s.id === booking.service)?.title}
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                booking.status === 'upcoming'
                                  ? 'bg-blue-50 text-blue-600'
                                  : booking.status === 'completed'
                                    ? 'bg-emerald-50 text-emerald-600'
                                    : 'bg-slate-50 text-slate-400'
                              }`}
                            >
                              {booking.status}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <button
                              onClick={() => setSelectedBookingId(booking.id)}
                              className="text-[10px] font-black text-blue-600 uppercase hover:underline"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </motion.div>
        )}

        {activeTab === 'bookings' && (
          <motion.div
            key="bookings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4 md:space-y-6"
          >
            <h3 className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">
              All My Bookings
            </h3>

            <div className="block md:hidden space-y-4">
              {user.bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-900 font-mono tracking-wider bg-slate-100 px-2 py-1 rounded-md">
                      {booking.ref}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                        booking.status === 'upcoming'
                          ? 'bg-blue-50 text-blue-600'
                          : booking.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-slate-50 text-slate-400'
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      {SERVICES.find((s) => s.id === booking.service)?.icon}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {SERVICES.find((s) => s.id === booking.service)?.title}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {new Date(booking.date).toLocaleDateString('en-ZA', {
                          day: 'numeric',
                          month: 'short',
                        })}{' '}
                        • {booking.time}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                    <p className="text-sm font-black text-slate-900">{formatTotal(booking.total)}</p>
                    <button
                      onClick={() => setSelectedBookingId(booking.id)}
                      className="text-[10px] font-black text-blue-600 uppercase"
                    >
                      Manage
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-50">
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Reference
                      </th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Service
                      </th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Date & Time
                      </th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Status
                      </th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Total
                      </th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {user.bookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-6">
                          <span className="text-xs font-black text-slate-900 font-mono tracking-wider bg-slate-100 px-2 py-1 rounded-md">
                            {booking.ref}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                              {SERVICES.find((s) => s.id === booking.service)?.icon}
                            </div>
                            <span className="text-sm font-bold text-slate-900">
                              {SERVICES.find((s) => s.id === booking.service)?.title}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900">
                              {new Date(booking.date).toLocaleDateString('en-ZA', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                            <span className="text-xs text-slate-500">{booking.time}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                              booking.status === 'upcoming'
                                ? 'bg-blue-50 text-blue-600'
                                : booking.status === 'completed'
                                  ? 'bg-emerald-50 text-emerald-600'
                                  : 'bg-slate-50 text-slate-400'
                            }`}
                          >
                            {booking.status}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-sm font-black text-slate-900">{formatTotal(booking.total)}</span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <button
                            onClick={() => setSelectedBookingId(booking.id)}
                            className="text-[10px] font-black text-blue-600 uppercase hover:underline"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'rewards' && (
          <motion.div
            key="rewards"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6 md:space-y-8"
          >
            <div className="bg-blue-600 rounded-[24px] md:rounded-[32px] p-6 md:p-10 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 md:p-8 opacity-20">
                <Sparkles className="w-24 h-24 md:w-40 md:h-40" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-5 h-5 text-blue-200" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-200">
                    {tier} Status Active
                  </span>
                </div>
                <h4 className="text-xl md:text-3xl font-black tracking-tight mb-4">Shalean Rewards</h4>
                <div className="flex items-baseline gap-2 mb-6 md:mb-8">
                  <span className="text-4xl md:text-6xl font-black">{points}</span>
                  <span className="text-blue-200 text-[10px] md:text-sm font-bold uppercase tracking-widest">
                    Points
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2 md:h-3 mb-4 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(100, (points / nextTierGoal) * 100)}%`,
                    }}
                    className="bg-white h-full rounded-full"
                  />
                </div>
                <p className="text-blue-100 text-[10px] md:text-sm font-medium">
                  {tier === 'Platinum'
                    ? "You've reached the top tier!"
                    : `You're ${nextTierGoal - points} points away from your next level!`}
                </p>
              </div>
            </div>

            <section>
              <h3 className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
                Membership Tiers
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {(['Bronze', 'Silver', 'Gold', 'Platinum'] as RewardTier[]).map((t) => (
                  <div
                    key={t}
                    className={`p-5 rounded-2xl border-2 transition-all ${
                      tier === t
                        ? 'border-blue-600 bg-white shadow-lg'
                        : 'border-slate-100 bg-white/50 opacity-60'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${TIER_CONFIG[t].bg} ${TIER_CONFIG[t].color}`}
                    >
                      {TIER_CONFIG[t].icon}
                    </div>
                    <p className="font-black text-slate-900 mb-1">{t}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                      {getNextTierGoal(t)} Points Required
                    </p>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2 text-[9px] font-bold text-slate-600">
                        <Check className="w-3 h-3 text-emerald-500" />
                        {t === 'Bronze'
                          ? 'Basic Points'
                          : t === 'Silver'
                            ? '1.2x Points'
                            : t === 'Gold'
                              ? '1.5x Points'
                              : '2x Points'}
                      </div>
                      <div className="flex items-center gap-2 text-[9px] font-bold text-slate-600">
                        <Check className="w-3 h-3 text-emerald-500" />
                        {t === 'Bronze' ? 'Email Support' : 'Priority Support'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="bg-white p-6 md:p-8 rounded-[24px] md:rounded-[32px] border border-slate-100 shadow-sm">
                <h5 className="font-black text-base md:text-lg mb-4">Refer a Friend</h5>
                <p className="text-slate-500 text-xs md:text-sm mb-6">
                  Share your link and you both get R200 off your next booking.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-[10px] md:text-xs font-mono text-slate-600 truncate">
                    shalean.co.za/ref/alexj7
                  </div>
                  <button
                    onClick={handleCopyReferral}
                    className={`px-6 py-3 rounded-xl font-black text-xs shadow-lg transition-all ${
                      copied ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white'
                    }`}
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
              <div className="bg-white p-6 md:p-8 rounded-[24px] md:rounded-[32px] border border-slate-100 shadow-sm">
                <h5 className="font-black text-base md:text-lg mb-4">Active Coupons</h5>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    <div>
                      <p className="text-[10px] font-black text-emerald-600 uppercase">10% OFF</p>
                      <p className="text-xs font-bold text-slate-900">Loyalty Discount</p>
                    </div>
                    <span className="text-[10px] font-mono font-black text-slate-400">LOYAL10</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'profile' && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-2xl"
          >
            <div className="bg-white rounded-[24px] md:rounded-[32px] p-6 md:p-8 border border-slate-100 shadow-sm">
              <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 md:mb-10 text-center sm:text-left">
                <div className="relative group">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      className="w-20 h-20 md:w-24 md:h-24 rounded-[24px] md:rounded-[32px] object-cover shadow-lg"
                      alt="Profile"
                    />
                  ) : (
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-[24px] md:rounded-[32px] bg-slate-200 flex items-center justify-center shadow-lg">
                      <span className="text-2xl md:text-3xl font-black text-slate-500">
                        {user.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </span>
                    </div>
                  )}
                  <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <h4 className="text-xl md:text-2xl font-black text-slate-900 leading-none mb-2">
                    {user.name}
                  </h4>
                  <p className="text-slate-500 text-xs md:text-sm">{user.email}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                      Full Name
                    </label>
                    <input
                      defaultValue={user.name}
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                      Phone Number
                    </label>
                    <input
                      defaultValue={user.phone}
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                    Email Address
                  </label>
                  <input
                    defaultValue={user.email}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm outline-none focus:border-blue-500 transition-all"
                  />
                </div>
                <div className="pt-2 md:pt-4">
                  <button
                    onClick={() => alert('Profile updated successfully!')}
                    className="w-full sm:w-auto px-8 py-3 bg-slate-900 text-white rounded-xl text-xs font-black shadow-lg hover:bg-slate-800 transition-all cursor-pointer active:scale-95"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {activeTab === 'overview' && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="bg-slate-900 rounded-[24px] md:rounded-[32px] p-6 md:p-8 text-white">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="text-lg md:text-xl font-black tracking-tight">Priority Support</h4>
            </div>
            <p className="text-slate-400 text-xs md:text-sm mb-8 leading-relaxed">
              As a frequent cleaner, you have access to our priority WhatsApp line for instant
              rescheduling and requests.
            </p>
            <button
              onClick={() => window.open('https://wa.me/27215550123', '_blank')}
              className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-xs hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Chat with VIP Support
            </button>
          </div>

          <div className="bg-blue-600 rounded-[24px] md:rounded-[32px] p-6 md:p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 md:p-8 opacity-20">
              <Sparkles className="w-20 h-20 md:w-24 md:h-24" />
            </div>
            <h4 className="text-lg md:text-xl font-black tracking-tight mb-4">Refer a Neighbor</h4>
            <p className="text-blue-100 text-xs md:text-sm mb-8 leading-relaxed">
              Give R200, Get R200. Share your referral link with friends and save on your next deep
              clean.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-[10px] md:text-xs font-mono truncate">
                shalean.co.za/ref/alexj7
              </div>
              <button
                onClick={handleCopyReferral}
                className={`px-4 py-3 rounded-xl font-black text-xs shadow-lg transition-all ${
                  copied ? 'bg-emerald-500 text-white' : 'bg-white text-blue-600'
                }`}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
