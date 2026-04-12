'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Clock,
  CheckCircle2,
  Star,
  ChevronRight,
  Navigation,
  Zap,
  TrendingUp,
  Calendar,
  ToggleLeft,
  ToggleRight,
  LogOut,
  Phone,
  Mail,
  Shield,
  Bell,
  HelpCircle,
  X,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useJobs, useEarnings, useCleanerReviews, useSchedule } from './cleanerHooks';
import type { Job, JobTabId, CleanerPageId, CleanerProfile } from './cleanerTypes';

// ─── Shared Sub-Components ────────────────────────────────────────────────────

function JobStatusBadge({ status }: { status: Job['status'] }) {
  const map = {
    available: { label: 'Available', cls: 'bg-blue-50 text-blue-600 border-blue-200' },
    accepted: { label: 'Accepted', cls: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
    in_progress: { label: 'In Progress', cls: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
    completed: { label: 'Completed', cls: 'bg-gray-50 text-gray-500 border-gray-200' },
  };
  const { label, cls } = map[status];
  return (
    <span
      className={cn(
        'inline-flex items-center text-[11px] font-bold border rounded-full px-2.5 py-1 leading-none',
        cls,
      )}
    >
      {label}
    </span>
  );
}

// ─── JOBS PAGE ────────────────────────────────────────────────────────────────

const JOB_TABS: Array<{ id: JobTabId; label: string }> = [
  { id: 'available', label: 'Available' },
  { id: 'accepted', label: 'Accepted' },
  { id: 'completed', label: 'Completed' },
];

interface JobsPageProps {
  onNavigate: (page: CleanerPageId) => void;
}
function JobsPage({ onNavigate: _onNavigate }: JobsPageProps) {
  void _onNavigate;
  const [activeTab, setActiveTab] = useState<JobTabId>('available');
  const {
    availableJobs,
    acceptedJobs,
    completedJobs,
    acceptJob,
    declineJob,
    startJob,
    completeJob,
    loading,
  } = useJobs();
  const [detailJob, setDetailJob] = useState<Job | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const tabJobs =
    activeTab === 'available'
      ? availableJobs
      : activeTab === 'accepted'
        ? acceptedJobs
        : completedJobs;

  const handleAction = async (fn: (id: string) => void | Promise<void>, id: string) => {
    setActionLoading(true);
    try {
      await new Promise(r => setTimeout(r, 600));
      await Promise.resolve(fn(id));
      setDetailJob(null);
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <AnimatePresence>
        {detailJob && (
          <div
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setDetailJob(null)}
            role="presentation"
          >
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.97 }}
              transition={{ duration: 0.22 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-extrabold text-gray-900">{detailJob.service}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {detailJob.date} · {detailJob.time}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailJob(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-base flex-shrink-0">
                    {detailJob.clientInitial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900">{detailJob.client}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span>{detailJob.address}</span>
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-base font-extrabold text-blue-600">{detailJob.pay}</p>
                    <p className="text-[10px] text-gray-400">{detailJob.duration}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 rounded-xl p-3">
                    <p className="text-[10px] text-blue-400 font-semibold uppercase tracking-wide">
                      Distance
                    </p>
                    <p className="text-sm font-bold text-blue-700 mt-0.5">{detailJob.distance}</p>
                  </div>
                  <div className="bg-indigo-50 rounded-xl p-3">
                    <p className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wide">
                      Duration
                    </p>
                    <p className="text-sm font-bold text-indigo-700 mt-0.5">{detailJob.duration}</p>
                  </div>
                </div>
                {detailJob.notes ? (
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                    <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wide mb-1">
                      Client Notes
                    </p>
                    <p className="text-xs text-amber-800 leading-relaxed">{detailJob.notes}</p>
                  </div>
                ) : null}
                {detailJob.status === 'available' && (
                  <div className="flex gap-3 pt-1">
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleAction(declineJob, detailJob.id)}
                      disabled={actionLoading}
                      className="flex-1 py-3.5 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-bold hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all"
                    >
                      Decline
                    </motion.button>
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleAction(acceptJob, detailJob.id)}
                      disabled={actionLoading}
                      className="flex-[2] py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md"
                    >
                      {actionLoading ? (
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      ) : null}
                      <span>{actionLoading ? 'Accepting…' : 'Accept Job'}</span>
                    </motion.button>
                  </div>
                )}
                {detailJob.status === 'accepted' && (
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleAction(startJob, detailJob.id)}
                    disabled={actionLoading}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md"
                  >
                    {actionLoading ? (
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Navigation className="w-4 h-4" />
                    )}
                    <span>{actionLoading ? 'Starting…' : 'Navigate & Start'}</span>
                  </motion.button>
                )}
                {detailJob.status === 'in_progress' && (
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleAction(completeJob, detailJob.id)}
                    disabled={actionLoading}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md"
                  >
                    {actionLoading ? (
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>{actionLoading ? 'Completing…' : 'Mark as Complete'}</span>
                  </motion.button>
                )}
                {detailJob.status === 'completed' && detailJob.rating !== undefined && (
                  <div className="flex items-center justify-center gap-1 py-3">
                    <span className="text-sm font-bold text-gray-700 mr-2">Client rating:</span>
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star
                        key={`detail-star-${i}`}
                        className={cn(
                          'w-5 h-5',
                          i <= detailJob.rating!
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-gray-200 fill-gray-200',
                        )}
                      />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-4 sm:px-6 py-8">
        <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-1">Manage</p>
        <h1 className="text-white text-2xl font-extrabold">My Jobs</h1>
      </div>

      <div className="px-4 sm:px-6 py-6 pb-28 lg:pb-12">
        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1">
          {JOB_TABS.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-shrink-0 text-xs font-bold px-5 py-2.5 rounded-full border-2 transition-all duration-200',
                activeTab === tab.id
                  ? 'bg-blue-600 text-white border-transparent'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(n => (
              <div key={n} className="bg-white border border-gray-200 rounded-2xl p-4 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gray-100 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-2/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : tabJobs.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <Zap className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm font-semibold text-gray-500">No {activeTab} jobs</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="space-y-3">
              {tabJobs.map((job, i) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.2, delay: i * 0.06 }}
                  className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-base flex-shrink-0">
                      {job.clientInitial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 justify-between">
                        <p className="text-sm font-bold text-gray-900">{job.service}</p>
                        <p className="text-sm font-extrabold text-blue-600 flex-shrink-0">{job.pay}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{job.client}</p>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <span className="flex items-center gap-1 text-[11px] text-gray-400">
                          <Clock className="w-3 h-3" />
                          <span>{job.time}</span>
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-gray-400">
                          <MapPin className="w-3 h-3" />
                          <span>{job.distance}</span>
                        </span>
                        <JobStatusBadge status={job.status} />
                      </div>
                      {job.status === 'completed' && job.rating !== undefined && (
                        <div className="flex items-center gap-0.5 mt-1.5">
                          {[1, 2, 3, 4, 5].map(si => (
                            <Star
                              key={`job-${job.id}-star-${si}`}
                              className={cn(
                                'w-3 h-3',
                                si <= job.rating!
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-gray-200 fill-gray-200',
                              )}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setDetailJob(job)}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 text-xs font-bold hover:border-blue-200 hover:text-blue-600 hover:bg-blue-50 transition-all"
                    >
                      <span>View Details</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

// ─── SCHEDULE PAGE ────────────────────────────────────────────────────────────

function SchedulePage() {
  const {
    scheduleDays,
    selectedDayId,
    setSelectedDayId,
    scheduledJobs,
    availability,
    toggleAvailability,
    calendarTitle,
  } = useSchedule();

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-4 sm:px-6 py-8">
        <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-1">This Week</p>
        <h1 className="text-white text-2xl font-extrabold">My Schedule</h1>
      </div>

      <div className="px-4 sm:px-6 py-6 pb-28 lg:pb-12 space-y-6">
        <section aria-label="Weekly calendar">
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-900">{calendarTitle || '—'}</h2>
              <span className="text-xs text-blue-600 font-bold bg-blue-50 rounded-full px-3 py-1">
                Week View
              </span>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {scheduleDays.map(day => (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => setSelectedDayId(day.id)}
                  className={cn(
                    'flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all',
                    selectedDayId === day.id
                      ? 'bg-gradient-to-b from-blue-600 to-indigo-600 shadow-md'
                      : day.isToday
                        ? 'bg-blue-50 border-2 border-blue-200'
                        : 'hover:bg-gray-50',
                  )}
                >
                  <span
                    className={cn(
                      'text-[10px] font-semibold',
                      selectedDayId === day.id ? 'text-blue-200' : 'text-gray-400',
                    )}
                  >
                    {day.dayShort}
                  </span>
                  <span
                    className={cn(
                      'text-sm font-extrabold',
                      selectedDayId === day.id
                        ? 'text-white'
                        : day.isToday
                          ? 'text-blue-600'
                          : 'text-gray-700',
                    )}
                  >
                    {day.date}
                  </span>
                  {day.hasJobs && (
                    <span
                      className={cn(
                        'w-1.5 h-1.5 rounded-full',
                        selectedDayId === day.id ? 'bg-white/60' : 'bg-blue-500',
                      )}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section aria-label="Upcoming jobs for selected day">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-blue-500" />
            <h2 className="text-sm font-bold text-gray-900">
              {scheduleDays.find(d => d.id === selectedDayId)?.isToday
                ? "Today's Jobs"
                : 'Scheduled Jobs'}
            </h2>
          </div>
          <div className="space-y-3">
            {scheduledJobs.map((sj, i) => {
              const timeParts = sj.time.split(' ');
              return (
                <motion.div
                  key={sj.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.07 }}
                  className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center gap-4"
                >
                  <div className="flex-shrink-0 text-center bg-blue-50 rounded-xl p-2.5 min-w-[52px]">
                    <p className="text-xs font-bold text-blue-600 leading-tight">{timeParts[0]}</p>
                    <p className="text-[10px] text-blue-400">{timeParts[1] ?? ''}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900">{sj.service}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{sj.client}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span>{sj.address}</span>
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-sm font-extrabold text-blue-600">{sj.pay}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        <section aria-label="Availability settings">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-indigo-500" />
            <h2 className="text-sm font-bold text-gray-900">Availability</h2>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            {availability.map((slot, i) => (
              <div
                key={slot.id}
                className={cn(
                  'flex items-center justify-between px-5 py-4',
                  i !== availability.length - 1 && 'border-b border-gray-100',
                )}
              >
                <p className="text-sm font-semibold text-gray-700">{slot.label}</p>
                <button
                  type="button"
                  onClick={() => toggleAvailability(slot.id)}
                  className="flex-shrink-0 transition-transform active:scale-95"
                  aria-label={`Toggle ${slot.label}`}
                >
                  {slot.enabled ? (
                    <ToggleRight className="w-7 h-7 text-blue-600" />
                  ) : (
                    <ToggleLeft className="w-7 h-7 text-gray-300" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

// ─── EARNINGS PAGE ────────────────────────────────────────────────────────────

function EarningsPage() {
  const { summary, records, chartData, monthLabel } = useEarnings();
  const maxAmount =
    chartData.length > 0 ? Math.max(...chartData.map(d => d.amount), 1) : 1;

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-4 sm:px-6 py-8">
        <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-1">Overview</p>
        <h1 className="text-white text-2xl font-extrabold">My Earnings</h1>
      </div>

      <div className="px-4 sm:px-6 py-6 pb-28 lg:pb-12 space-y-6">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 shadow-xl">
          <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-1">This Month</p>
          <p className="text-white text-4xl font-extrabold leading-none">
            R{summary.month.toLocaleString()}
          </p>
          <p className="text-blue-200 text-sm mt-1">Total earned in {monthLabel}</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="bg-white/15 rounded-xl p-3">
              <p className="text-blue-200 text-[10px] font-semibold uppercase tracking-wide">Today</p>
              <p className="text-white text-xl font-extrabold mt-0.5">R{summary.today}</p>
            </div>
            <div className="bg-white/15 rounded-xl p-3">
              <p className="text-blue-200 text-[10px] font-semibold uppercase tracking-wide">This Week</p>
              <p className="text-white text-xl font-extrabold mt-0.5">R{summary.week}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <h2 className="text-sm font-bold text-gray-900">Weekly Breakdown</h2>
          </div>
          <div className="flex items-end justify-between gap-1 h-28">
            {chartData.map(point => (
              <div key={point.id} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col justify-end" style={{ height: '88px' }}>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{
                      height: `${point.amount > 0 ? Math.max((point.amount / maxAmount) * 88, 6) : 0}px`,
                    }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                    className={cn(
                      'w-full rounded-t-lg',
                      point.amount > 0
                        ? 'bg-gradient-to-t from-blue-600 to-indigo-500'
                        : 'bg-gray-100',
                    )}
                  />
                </div>
                <span className="text-[11px] font-semibold text-gray-400">{point.day}</span>
              </div>
            ))}
          </div>
        </div>

        <section aria-label="Earnings transactions">
          <h2 className="text-sm font-bold text-gray-900 mb-3">Recent Payouts</h2>
          {records.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
              <p className="text-sm font-semibold text-gray-500">No transactions yet</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              {records.map((record, i) => (
                <div
                  key={record.id}
                  className={cn(
                    'flex items-center gap-4 px-5 py-4',
                    i !== records.length - 1 && 'border-b border-gray-100',
                  )}
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900">{record.service}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {record.client} · {record.date}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-sm font-extrabold text-emerald-600">+{record.amount}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Paid</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// ─── PROFILE PAGE ─────────────────────────────────────────────────────────────

interface CleanerProfilePageProps {
  profile: CleanerProfile;
}
function CleanerProfilePage({ profile }: CleanerProfilePageProps) {
  const { reviews } = useCleanerReviews();
  const [showLogout, setShowLogout] = useState(false);

  const settingsItems = [
    { id: 'setting-phone', icon: Phone, label: 'Phone Number', value: profile.phone },
    { id: 'setting-email', icon: Mail, label: 'Email Address', value: profile.email },
    { id: 'setting-notif', icon: Bell, label: 'Notifications', value: 'Enabled' },
    { id: 'setting-privacy', icon: Shield, label: 'Privacy & Security', value: '' },
    { id: 'setting-help', icon: HelpCircle, label: 'Help & Support', value: '' },
  ];

  const handleLogout = async () => {
    try {
      await fetch('/api/cleaner/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {
      /* ignore */
    }
    window.location.href = '/cleaner/login';
  };

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <AnimatePresence>
        {showLogout && (
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowLogout(false)}
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
                <LogOut className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="text-base font-extrabold text-gray-900 text-center mb-2">Log Out?</h3>
              <p className="text-xs text-gray-400 text-center mb-6">
                You&apos;ll need to sign in again to access your account.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowLogout(false)}
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

      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-4 sm:px-6 pt-8 pb-16">
        <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-1">Cleaner</p>
        <h1 className="text-white text-2xl font-extrabold">My Profile</h1>
      </div>

      <div className="px-4 sm:px-6 pb-28 lg:pb-12 -mt-10 space-y-5">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-md p-5 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-2xl flex-shrink-0">
            {profile.initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-extrabold text-gray-900">{profile.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">{profile.specialty}</p>
            <div className="flex items-center gap-1 mt-1">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-xs font-bold text-gray-700">{profile.rating}</span>
              <span className="text-xs text-gray-400">· Member since {profile.memberSince}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'pstat-jobs', label: 'Total Jobs', value: profile.totalJobs },
            { id: 'pstat-rating', label: 'Avg. Rating', value: profile.rating },
            { id: 'pstat-reviews', label: 'Reviews', value: reviews.length },
          ].map(stat => (
            <div
              key={stat.id}
              className="bg-white border border-gray-200 rounded-2xl p-4 text-center shadow-sm"
            >
              <p className="text-xl font-extrabold text-blue-600">{stat.value}</p>
              <p className="text-[11px] text-gray-400 mt-0.5 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>

        <section aria-label="Recent reviews">
          <h2 className="text-sm font-bold text-gray-900 mb-3">Recent Reviews</h2>
          <div className="space-y-3">
            {reviews.map((review, ri) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: ri * 0.07 }}
                className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {review.clientInitial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900">{review.clientName}</p>
                    <p className="text-[10px] text-gray-400">
                      {review.service} · {review.date}
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    {[1, 2, 3, 4, 5].map(si => (
                      <Star
                        key={`review-${review.id}-star-${si}`}
                        className={cn(
                          'w-3.5 h-3.5',
                          si <= review.rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-gray-200 fill-gray-200',
                        )}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed italic">&quot;{review.comment}&quot;</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section aria-label="Settings">
          <h2 className="text-sm font-bold text-gray-900 mb-3">Account Settings</h2>
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            {settingsItems.map((item, i) => (
              <button
                key={item.id}
                type="button"
                className={cn(
                  'w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors',
                  i !== settingsItems.length - 1 && 'border-b border-gray-100',
                )}
              >
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-4 h-4 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                  {item.value ? <p className="text-xs text-gray-400 mt-0.5 truncate">{item.value}</p> : null}
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
              </button>
            ))}
          </div>
        </section>

        <button
          type="button"
          onClick={() => setShowLogout(true)}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-red-200 text-red-500 text-sm font-bold hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
}

// ─── Exports ──────────────────────────────────────────────────────────────────

interface CleanerSubPagesProps {
  page: Exclude<CleanerPageId, 'home'>;
  profile: CleanerProfile;
  onNavigate: (page: CleanerPageId) => void;
}

export function CleanerSubPages({ page, profile, onNavigate }: CleanerSubPagesProps) {
  void onNavigate;
  return (
    <AnimatePresence mode="wait">
      {page === 'jobs' && (
        <motion.div
          key="cleaner-jobs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <JobsPage onNavigate={onNavigate} />
        </motion.div>
      )}
      {page === 'schedule' && (
        <motion.div
          key="cleaner-schedule"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <SchedulePage />
        </motion.div>
      )}
      {page === 'earnings' && (
        <motion.div
          key="cleaner-earnings"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <EarningsPage />
        </motion.div>
      )}
      {page === 'profile' && (
        <motion.div
          key="cleaner-profile"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <CleanerProfilePage profile={profile} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
