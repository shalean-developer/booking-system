'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Briefcase,
  Calendar,
  TrendingUp,
  User,
  Sparkles,
  Power,
  Bell,
  Check,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { CleanerJobsProvider, useCleaner } from './cleanerHooks';
import { CleanerFinancialProvider } from './cleaner-financial-context';
import { CleanerHome } from './CleanerHome';
import { CleanerSubPages } from './CleanerSubPages';
import type { CleanerPageId } from './cleanerTypes';

// ─── Constants ────────────────────────────────────────────────────────────────

interface NavItem {
  id: CleanerPageId;
  label: string;
  shortLabel: string;
}
const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', shortLabel: 'Home' },
  { id: 'jobs', label: 'My Jobs', shortLabel: 'Jobs' },
  { id: 'schedule', label: 'Schedule', shortLabel: 'Schedule' },
  { id: 'earnings', label: 'Earnings', shortLabel: 'Earnings' },
  { id: 'profile', label: 'Profile', shortLabel: 'Profile' },
];

// ─── Nav Icon ─────────────────────────────────────────────────────────────────

function NavIcon({ id, active }: { id: CleanerPageId; active: boolean }) {
  const cls = active ? 'text-blue-600' : 'text-gray-400';
  if (id === 'home') return <Home className={cn('w-5 h-5', cls)} />;
  if (id === 'jobs') return <Briefcase className={cn('w-5 h-5', cls)} />;
  if (id === 'schedule') return <Calendar className={cn('w-5 h-5', cls)} />;
  if (id === 'earnings') return <TrendingUp className={cn('w-5 h-5', cls)} />;
  if (id === 'profile') return <User className={cn('w-5 h-5', cls)} />;
  return null;
}

// ─── Status Toggle ────────────────────────────────────────────────────────────

interface StatusToggleProps {
  isOnline: boolean;
  onToggle: () => void;
}
function StatusToggle({ isOnline, onToggle }: StatusToggleProps) {
  const [confirming, setConfirming] = useState(false);
  const handleClick = () => {
    if (isOnline) {
      setConfirming(true);
    } else {
      onToggle();
    }
  };
  return (
    <div className="relative">
      <AnimatePresence>
        {confirming && (
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setConfirming(false)}
            role="presentation"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.18 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6"
            >
              <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4">
                <Power className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="text-base font-extrabold text-gray-900 text-center mb-2">Go Offline?</h3>
              <p className="text-xs text-gray-400 text-center mb-6">
                You won&apos;t receive new job requests while offline. Active jobs are unaffected.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-sm font-bold text-gray-600 hover:border-gray-300 transition-colors"
                >
                  Stay Online
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onToggle();
                    setConfirming(false);
                  }}
                  className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors"
                >
                  Go Offline
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        whileTap={{ scale: 0.95 }}
        onClick={handleClick}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 border-2',
          isOnline
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
            : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200',
        )}
        aria-label={isOnline ? 'Go offline' : 'Go online'}
      >
        <span
          className={cn(
            'w-2 h-2 rounded-full',
            isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400',
          )}
        />
        <span>{isOnline ? 'Online' : 'Offline'}</span>
        <Power className="w-3 h-3" />
      </motion.button>
    </div>
  );
}

// ─── Notification Bell ────────────────────────────────────────────────────────

const CLEANER_NOTIFICATIONS = [
  {
    id: 'cn-001',
    title: 'New Job Available',
    body: 'Move-Out Clean in Gardens — R550',
    time: '2 min ago',
    read: false,
  },
  {
    id: 'cn-002',
    title: 'Payment Received',
    body: 'R225 deposited for Standard Clean (Thabo V.)',
    time: '1 hr ago',
    read: false,
  },
  {
    id: 'cn-003',
    title: 'Review Received',
    body: 'You received a 5★ review from Nokwanda Z.',
    time: 'Yesterday',
    read: true,
  },
];

function NotificationDropdown({
  notifications,
  setNotifications,
}: {
  notifications: typeof CLEANER_NOTIFICATIONS;
  setNotifications: React.Dispatch<React.SetStateAction<typeof CLEANER_NOTIFICATIONS>>;
}) {
  const markRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  };
  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };
  const unread = notifications.filter(n => !n.read).length;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      onClick={e => e.stopPropagation()}
      className="absolute right-0 top-11 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden z-50"
    >
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <p className="text-sm font-bold text-gray-900">Notifications</p>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              {unread} new
            </span>
          )}
          {unread > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="text-[10px] font-bold text-gray-400 hover:text-blue-600 transition-colors"
            >
              Mark all read
            </button>
          )}
        </div>
      </div>
      <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
        {notifications.map(n => (
          <button
            key={n.id}
            type="button"
            onClick={() => {
              markRead(n.id);
            }}
            className={cn(
              'w-full text-left px-4 py-3 flex gap-3 items-start transition-colors hover:bg-gray-50',
              !n.read && 'bg-blue-50/40',
            )}
          >
            <div
              className={cn(
                'w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
                n.read ? 'bg-gray-300' : 'bg-blue-500',
              )}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-900">{n.title}</p>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.body}</p>
              <p className="text-[10px] text-gray-400 mt-1">{n.time}</p>
            </div>
            {n.read && <Check className="w-3 h-3 text-gray-300 flex-shrink-0 mt-1" />}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CleanerDashboard() {
  const [activePage, setActivePage] = useState<CleanerPageId>('home');
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState(CLEANER_NOTIFICATIONS);
  const { isOnline, toggleOnline, profile } = useCleaner();
  const activeNav = NAV_ITEMS.find(n => n.id === activePage);

  useEffect(() => {
    const handler = () => setNotifOpen(false);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const handleNavigate = (page: CleanerPageId) => {
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <CleanerFinancialProvider>
    <CleanerJobsProvider>
    <div className="min-h-screen bg-[#f8f9fb] flex">
      {/* ── Desktop Left Sidebar ── */}
      <aside
        className="hidden lg:flex flex-col w-60 bg-white border-r border-gray-200 min-h-screen sticky top-0 flex-shrink-0"
        aria-label="Cleaner navigation"
      >
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest leading-none">
                Shalean
              </p>
              <p className="text-sm font-bold text-gray-900 leading-tight">Cleaner App</p>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mb-2">
            Status
          </p>
          <StatusToggle isOnline={isOnline} onToggle={toggleOnline} />
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavigate(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150',
                activePage === item.id
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800',
              )}
            >
              <NavIcon id={item.id} active={activePage === item.id} />
              <span>{item.label}</span>
              {activePage === item.id && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0" />
              )}
            </button>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {profile.initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-900 truncate">{profile.name}</p>
              <p className="text-[10px] text-gray-400 truncate">{profile.specialty}</p>
            </div>
            <div
              className={cn(
                'w-2 h-2 rounded-full flex-shrink-0',
                isOnline ? 'bg-emerald-500' : 'bg-gray-300',
              )}
            />
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
                  {activeNav?.label ?? 'Cleaner App'}
                </p>
              </div>
            </div>

            <div className="hidden lg:block">
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest leading-none">
                Shalean
              </p>
              <p className="text-sm font-bold text-gray-900 leading-tight">
                {activeNav?.label ?? 'Cleaner App'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="lg:hidden">
                <StatusToggle isOnline={isOnline} onToggle={toggleOnline} />
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    setNotifOpen(v => !v);
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
                <AnimatePresence>
                  {notifOpen && (
                    <NotificationDropdown
                      notifications={notifications}
                      setNotifications={setNotifications}
                    />
                  )}
                </AnimatePresence>
              </div>

              <button
                type="button"
                onClick={() => handleNavigate('profile')}
                className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm hover:opacity-90 transition-opacity"
                aria-label="Go to profile"
              >
                {profile.initial}
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 min-h-0">
          <AnimatePresence mode="wait">
            {activePage === 'home' && (
              <motion.div
                key="cleaner-home"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                <CleanerHome onNavigate={handleNavigate} isOnline={isOnline} />
              </motion.div>
            )}
            {(activePage === 'jobs' ||
              activePage === 'schedule' ||
              activePage === 'earnings' ||
              activePage === 'profile') && (
              <motion.div
                key={`cleaner-${activePage}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                <CleanerSubPages page={activePage} profile={profile} onNavigate={handleNavigate} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 flex"
        aria-label="Mobile navigation"
      >
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => handleNavigate(item.id)}
            className={cn(
              'flex-1 flex flex-col items-center justify-center py-2.5 gap-1 transition-all',
              activePage === item.id ? 'text-blue-600' : 'text-gray-400',
            )}
            aria-label={item.label}
          >
            <NavIcon id={item.id} active={activePage === item.id} />
            <span
              className={cn(
                'text-[10px] font-bold leading-none',
                activePage === item.id ? 'text-blue-600' : 'text-gray-400',
              )}
            >
              {item.shortLabel}
            </span>
          </button>
        ))}
      </nav>
    </div>
    </CleanerJobsProvider>
    </CleanerFinancialProvider>
  );
}
