'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  User,
  LogOut,
  LayoutDashboard,
  CalendarPlus,
  CalendarCheck,
  CreditCard,
  Gift,
  Headphones,
  Sparkles,
  UserPlus,
} from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import { cn } from '@/lib/utils';
import { BookingFlow } from '@/components/dashboard/booking-flow/booking-flow';
import { usePullToRefresh } from '@/lib/hooks/use-pull-to-refresh';
import { useKeyboardShortcuts } from '@/lib/hooks/use-keyboard-shortcuts';
import { useOffline } from '@/lib/hooks/use-offline';
import {
  useNotifications,
  useProfile,
  useBookings,
  useRefreshDashboard,
  CustomerPortalProvider,
} from './hooks';
import { DashboardHome } from './dashboard-home';
import { SubPages } from './sub-pages';
import type { PageId } from './types';

type BottomNavId = PageId;

interface NavItem {
  id: PageId;
  label: string;
  shortLabel: string;
}

interface BottomNavItem {
  id: BottomNavId;
  label: string;
  shortLabel: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', shortLabel: 'Home' },
  { id: 'book', label: 'Book Cleaning', shortLabel: 'Book' },
  { id: 'bookings', label: 'My Bookings', shortLabel: 'Bookings' },
  { id: 'payments', label: 'Payments & Invoices', shortLabel: 'Payments' },
  { id: 'rewards', label: 'Rewards', shortLabel: 'Rewards' },
  { id: 'earn-share', label: 'Earn & Share', shortLabel: 'Earn' },
  { id: 'support', label: 'Support', shortLabel: 'Support' },
  { id: 'profile', label: 'Profile', shortLabel: 'Profile' },
];

const BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', shortLabel: 'Home' },
  { id: 'book', label: 'Book Cleaning', shortLabel: 'Book' },
  { id: 'bookings', label: 'My Bookings', shortLabel: 'Bookings' },
  { id: 'payments', label: 'Payments & Invoices', shortLabel: 'Pay' },
  { id: 'rewards', label: 'Rewards', shortLabel: 'Rewards' },
  { id: 'support', label: 'Support', shortLabel: 'Help' },
  { id: 'earn-share', label: 'Earn & Share', shortLabel: 'Earn' },
  { id: 'profile', label: 'Profile', shortLabel: 'Profile' },
];

function NavIcon({ id, active }: { id: BottomNavId; active: boolean }) {
  const cls = active ? 'text-blue-600' : 'text-gray-400';
  if (id === 'dashboard') return <LayoutDashboard className={cn('w-5 h-5', cls)} />;
  if (id === 'book') return <CalendarPlus className={cn('w-5 h-5', cls)} />;
  if (id === 'bookings') return <CalendarCheck className={cn('w-5 h-5', cls)} />;
  if (id === 'payments') return <CreditCard className={cn('w-5 h-5', cls)} />;
  if (id === 'rewards') return <Gift className={cn('w-5 h-5', cls)} />;
  if (id === 'support') return <Headphones className={cn('w-5 h-5', cls)} />;
  if (id === 'earn-share') return <UserPlus className={cn('w-5 h-5', cls)} />;
  if (id === 'profile') return <User className={cn('w-5 h-5', cls)} />;
  return null;
}

function LogoutConfirmModal({
  onClose,
  onConfirm,
  busy,
}: {
  onClose: () => void;
  onConfirm: () => Promise<void>;
  busy: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
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
          <LogOut className="w-7 h-7 text-red-500" />
        </div>
        <h3 className="text-base font-extrabold text-gray-900 text-center mb-2">Log Out?</h3>
        <p className="text-xs text-gray-400 text-center mb-6">
          You&apos;ll need to sign in again to access your account.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-sm font-bold text-gray-600 hover:border-gray-300 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm()}
            disabled={busy}
            className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {busy ? 'Signing out…' : 'Log Out'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export interface CustomerDashboardProps {
  userEmail?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  addressLine?: string | null;
}

function CustomerDashboardChrome({ addressLine }: { addressLine?: string | null }) {
  const refreshDashboard = useRefreshDashboard();
  const { loading } = useBookings();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { isOnline } = useOffline({});

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshDashboard();
      toast.success('Dashboard refreshed');
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshDashboard]);

  const pullToRefresh = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 80,
    disabled: loading || isRefreshing || !isOnline,
  });

  useKeyboardShortcuts({
    shortcuts: [
      {
        key: '/',
        handler: () => {
          const searchInput = document.querySelector(
            'input[type="search"], input[placeholder*="Search"]'
          ) as HTMLInputElement | null;
          if (searchInput) {
            searchInput.focus();
          } else {
            toast.info('Pull down on mobile to refresh your dashboard.');
          }
        },
        description: 'Focus search',
      },
    ],
    enabled: !loading,
  });

  return (
    <div ref={pullToRefresh.containerRef} className="min-h-screen bg-[#f8f9fb]">
      {isRefreshing && (
        <div className="sticky top-0 z-[60] bg-teal-500 text-white text-center py-2 px-4 text-sm shadow-sm">
          Refreshing data...
        </div>
      )}
      <CustomerDashboardInner addressLine={addressLine} />
    </div>
  );
}

function CustomerDashboardInner({
  addressLine,
}: {
  addressLine?: string | null;
}) {
  const router = useRouter();
  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [profileOpen, setProfileOpen] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);

  const { notifications } = useNotifications();
  const { user } = useProfile();

  const unreadCount = notifications.filter((n) => !n.read).length;
  const activeNav = NAV_ITEMS.find((n) => n.id === activePage);

  useEffect(() => {
    const handler = () => setProfileOpen(false);
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleNavigate = (page: PageId) => {
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const performLogout = async () => {
    setLogoutBusy(true);
    try {
      await supabase.auth.signOut();
      router.push('/login');
    } catch {
      setLogoutBusy(false);
      setShowLogout(false);
    }
  };

  const subPageActive =
    activePage === 'bookings' ||
    activePage === 'payments' ||
    activePage === 'rewards' ||
    activePage === 'support' ||
    activePage === 'profile' ||
    activePage === 'notifications' ||
    activePage === 'earn-share';

  const headerTitle =
    activePage === 'notifications' ? 'Notifications' : activeNav?.label ?? 'Portal';

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex">
      <AnimatePresence>
        {showLogout && (
          <LogoutConfirmModal
            key="logout-modal"
            busy={logoutBusy}
            onClose={() => !logoutBusy && setShowLogout(false)}
            onConfirm={async () => {
              await performLogout();
            }}
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          'hidden lg:flex flex-col w-60 shrink-0 bg-white border-r border-gray-200',
          'h-[100dvh] max-h-screen sticky top-0 overflow-hidden'
        )}
        aria-label="Main navigation"
      >
        <div className="px-5 py-5 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest leading-none">
                Shalean
              </p>
              <p className="text-sm font-bold text-gray-900 leading-tight">Customer Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 min-h-0 overflow-y-auto overscroll-contain py-4 px-3 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              title={item.id === 'payments' ? 'Payments & invoices' : item.label}
              onClick={() => handleNavigate(item.id)}
              className={cn(
                'w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 text-left',
                activePage === item.id
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              )}
            >
              <span className="flex-shrink-0 mt-0.5" aria-hidden>
                <NavIcon id={item.id} active={activePage === item.id} />
              </span>
              <span className="flex-1 min-w-0 leading-snug break-words">{item.label}</span>
              {activePage === item.id && (
                <span
                  className="flex-shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-600"
                  aria-hidden
                />
              )}
            </button>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {user.initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-900 truncate">{user.name}</p>
              <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
            </div>
            <button
              type="button"
              onClick={() => setShowLogout(true)}
              className="flex-shrink-0 text-gray-300 hover:text-red-400 transition-colors"
              aria-label="Log out"
              title="Log Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 lg:hidden">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest leading-none">
                  Shalean
                </p>
                <p className="text-sm font-bold text-gray-900 leading-tight">
                  {headerTitle}
                </p>
              </div>
            </div>

            <div className="hidden lg:block">
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest leading-none">
                Shalean
              </p>
              <p className="text-sm font-bold text-gray-900 leading-tight">
                {headerTitle}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  type="button"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setProfileOpen(false);
                    handleNavigate('notifications');
                  }}
                  className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors relative"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>

              <div className="relative">
                <button
                  type="button"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setProfileOpen((v) => !v);
                  }}
                  className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm hover:bg-blue-700 transition-colors"
                  aria-label="User menu"
                >
                  {user.initial}
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-0 top-11 w-48 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden z-50"
                    >
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-bold text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          handleNavigate('profile');
                          setProfileOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <User className="w-4 h-4 text-gray-400" />
                        <span>My Profile</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setProfileOpen(false);
                          setShowLogout(true);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors border-t border-gray-100"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Log Out</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 pb-20 lg:pb-0">
          <AnimatePresence mode="wait">
            {activePage === 'dashboard' && (
              <motion.div
                key="page-dashboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                <DashboardHome onNavigate={handleNavigate} />
              </motion.div>
            )}
            {activePage === 'book' && (
              <motion.div
                key="page-book"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                <BookingFlow onBack={() => handleNavigate('dashboard')} addressLine={addressLine} />
              </motion.div>
            )}
            {subPageActive && (
              <motion.div
                key={`page-${activePage}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                <SubPages
                  page={activePage as Exclude<PageId, 'dashboard' | 'book'>}
                  onNavigate={handleNavigate}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 flex overflow-x-auto scrollbar-hide pb-[env(safe-area-inset-bottom)]"
        aria-label="Mobile navigation"
      >
        {BOTTOM_NAV_ITEMS.map((item) => {
          const active = activePage === item.id;
          const commonClass = cn(
            'flex-shrink-0 min-w-[3.65rem] flex flex-col items-center justify-center py-2.5 gap-1 transition-all',
            active ? 'text-blue-600' : 'text-gray-400'
          );
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavigate(item.id)}
              className={commonClass}
              aria-label={item.label}
            >
              <NavIcon id={item.id} active={active} />
              <span
                className={cn(
                  'text-[10px] font-bold leading-none',
                  active ? 'text-blue-600' : 'text-gray-400'
                )}
              >
                {item.shortLabel}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export function CustomerDashboard({
  userEmail,
  firstName,
  lastName,
  addressLine,
}: CustomerDashboardProps) {
  return (
    <CustomerPortalProvider email={userEmail} firstName={firstName} lastName={lastName}>
      <CustomerDashboardChrome addressLine={addressLine} />
    </CustomerPortalProvider>
  );
}
