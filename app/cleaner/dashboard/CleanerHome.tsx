'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Clock,
  CheckCircle2,
  Navigation,
  Phone,
  MessageCircle,
  ChevronRight,
  X,
  Briefcase,
  Star,
  Zap,
  TrendingUp,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useJobs, useEarnings } from './cleanerHooks';
import type { Job, CleanerPageId } from './cleanerTypes';

// ─── Constants ────────────────────────────────────────────────────────────────

const WHATSAPP_NUMBER = '27215550000';
const SUPPORT_PHONE = '+27215550000';

// ─── Job Detail Modal ─────────────────────────────────────────────────────────

interface JobDetailModalProps {
  job: Job;
  onClose: () => void;
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
  onStart?: (id: string) => void;
  onComplete?: (id: string) => void;
}
function JobDetailModal({
  job,
  onClose,
  onAccept,
  onDecline,
  onStart,
  onComplete,
}: JobDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const handleAction = async (fn?: (id: string) => void | Promise<void>) => {
    if (!fn) return;
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 700));
      await Promise.resolve(fn(job.id));
      onClose();
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
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
            <p className="text-sm font-extrabold text-gray-900">{job.service}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {job.date} · {job.time}
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

        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-4">
            <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-base flex-shrink-0">
              {job.clientInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900">{job.client}</p>
              <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span>{job.address}</span>
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-base font-extrabold text-blue-600">{job.pay}</p>
              <p className="text-[10px] text-gray-400">{job.duration}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 rounded-xl p-3">
              <p className="text-[10px] text-blue-400 font-semibold uppercase tracking-wide">Distance</p>
              <p className="text-sm font-bold text-blue-700 mt-0.5">{job.distance}</p>
            </div>
            <div className="bg-indigo-50 rounded-xl p-3">
              <p className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wide">Duration</p>
              <p className="text-sm font-bold text-indigo-700 mt-0.5">{job.duration}</p>
            </div>
          </div>

          {job.notes ? (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
              <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wide mb-1">
                Client Notes
              </p>
              <p className="text-xs text-amber-800 leading-relaxed">{job.notes}</p>
            </div>
          ) : null}

          <div className="flex gap-2">
            <a
              href={`tel:${SUPPORT_PHONE}`}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl border-2 border-gray-200 text-gray-600 text-xs font-bold hover:border-gray-300 transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call</span>
            </a>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
          </div>

          {job.status === 'available' && (
            <div className="flex gap-3 pt-1">
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => handleAction(onDecline)}
                disabled={loading}
                className="flex-1 py-3.5 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-bold hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all"
              >
                Decline
              </motion.button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => handleAction(onAccept)}
                disabled={loading}
                className="flex-[2] py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-shadow"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : null}
                <span>{loading ? 'Accepting…' : 'Accept Job'}</span>
              </motion.button>
            </div>
          )}

          {job.status === 'accepted' && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => handleAction(onStart)}
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Navigation className="w-4 h-4" />
              )}
              <span>{loading ? 'Starting…' : 'Navigate & Start Job'}</span>
            </motion.button>
          )}

          {job.status === 'in_progress' && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => handleAction(onComplete)}
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>{loading ? 'Completing…' : 'Mark as Complete'}</span>
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Active Job Card ──────────────────────────────────────────────────────────

interface ActiveJobCardProps {
  job: Job;
  onStart: (id: string) => void;
  onComplete: (id: string) => void;
  onViewDetail: (job: Job) => void;
}
function ActiveJobCard({ job, onStart, onComplete, onViewDetail }: ActiveJobCardProps) {
  const isInProgress = job.status === 'in_progress';
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl overflow-hidden shadow-lg"
    >
      <div
        className={cn(
          'p-5',
          isInProgress
            ? 'bg-gradient-to-br from-blue-600 to-indigo-700'
            : 'bg-gradient-to-br from-indigo-500 to-blue-600',
        )}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'flex items-center gap-1.5 text-[11px] font-bold rounded-full px-2.5 py-1',
                isInProgress ? 'bg-white/20 text-white' : 'bg-white/20 text-white',
              )}
            >
              {isInProgress ? (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
              ) : (
                <Clock className="w-3 h-3" />
              )}
              <span>{isInProgress ? 'In Progress' : 'Accepted · Upcoming'}</span>
            </div>
          </div>
          <p className="text-white font-extrabold text-lg">{job.pay}</p>
        </div>

        <p className="text-white font-extrabold text-base mb-0.5">{job.service}</p>
        <p className="text-blue-100 text-xs mb-1">{job.client}</p>
        <div className="flex items-center gap-1 text-blue-100 text-xs mb-4">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span>{job.address}</span>
          <span className="mx-1.5 text-blue-300">·</span>
          <span>{job.time}</span>
        </div>

        <div className="flex gap-2">
          {isInProgress ? (
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                void Promise.resolve(onComplete(job.id)).catch(err => {
                  console.error(err);
                  alert(err instanceof Error ? err.message : 'Could not complete job');
                });
              }}
              className="flex-1 py-3 rounded-xl bg-white text-blue-700 text-sm font-bold flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Mark Complete</span>
            </motion.button>
          ) : (
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                void Promise.resolve(onStart(job.id)).catch(err => {
                  console.error(err);
                  alert(err instanceof Error ? err.message : 'Could not update job');
                });
              }}
              className="flex-1 py-3 rounded-xl bg-white text-blue-700 text-sm font-bold flex items-center justify-center gap-2"
            >
              <Navigation className="w-4 h-4" />
              <span>Navigate & Start</span>
            </motion.button>
          )}
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => onViewDetail(job)}
            className="py-3 px-4 rounded-xl bg-white/20 text-white text-sm font-bold flex items-center justify-center gap-1"
          >
            <span>Details</span>
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Available Job Card ───────────────────────────────────────────────────────

interface AvailableJobCardProps {
  job: Job;
  index: number;
  onAccept: (id: string) => void | Promise<void>;
  onDecline: (id: string) => void;
  onViewDetail: (job: Job) => void;
}
function AvailableJobCard({
  job,
  index,
  onAccept,
  onDecline,
  onViewDetail,
}: AvailableJobCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, scale: 0.96 }}
      transition={{ duration: 0.25, delay: index * 0.07 }}
      className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 sm:p-5"
    >
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-base flex-shrink-0">
          {job.clientInitial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-gray-900">{job.service}</p>
            <p className="text-sm font-extrabold text-blue-600 flex-shrink-0">{job.pay}</p>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{job.client}</p>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="flex items-center gap-1 text-[11px] text-gray-400">
              <MapPin className="w-3 h-3" />
              <span>{job.distance}</span>
            </span>
            <span className="flex items-center gap-1 text-[11px] text-gray-400">
              <Clock className="w-3 h-3" />
              <span>
                {job.time} · {job.duration}
              </span>
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1 truncate flex items-center gap-1">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span>{job.address}</span>
          </p>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 flex gap-2">
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={() => void onDecline(job.id)}
          className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-500 text-xs font-bold hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all"
        >
          Decline
        </motion.button>
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={() => onViewDetail(job)}
          className="flex-shrink-0 py-3 px-3 rounded-xl border-2 border-blue-100 text-blue-500 text-xs font-bold hover:bg-blue-50 transition-colors"
        >
          Details
        </motion.button>
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            void Promise.resolve(onAccept(job.id)).catch(err => {
              console.error(err);
              alert(err instanceof Error ? err.message : 'Could not accept job');
            });
          }}
          className="flex-[1.5] py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold shadow-sm hover:shadow-md transition-shadow flex items-center justify-center gap-1.5"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Accept</span>
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface CleanerHomeProps {
  onNavigate: (page: CleanerPageId) => void;
  isOnline: boolean;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CleanerHome({ onNavigate, isOnline }: CleanerHomeProps) {
  const { loading, activeJob, availableJobs, acceptJob, declineJob, startJob, completeJob } =
    useJobs();
  const { summary } = useEarnings();
  const [detailJob, setDetailJob] = useState<Job | null>(null);

  const todayJobCount =
    availableJobs.filter(j => j.date === 'Today').length + (activeJob ? 1 : 0);
  const statChips = [
    { id: 'chip-today', label: "Today's Jobs", value: todayJobCount, icon: Briefcase },
    {
      id: 'chip-earn',
      label: "Today's Pay",
      value: `R${summary.today}`,
      icon: TrendingUp,
    },
    { id: 'chip-rating', label: 'Rating', value: '4.9★', icon: Star },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <AnimatePresence>
        {detailJob && (
          <JobDetailModal
            key={detailJob.id}
            job={detailJob}
            onClose={() => setDetailJob(null)}
            onAccept={acceptJob}
            onDecline={declineJob}
            onStart={startJob}
            onComplete={completeJob}
          />
        )}
      </AnimatePresence>

      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-4 sm:px-6 py-8 sm:py-10">
        <div>
          <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-1">
            {isOnline ? '🟢 You are Online' : '🔴 You are Offline'}
          </p>
          <h1 className="text-white text-2xl sm:text-3xl font-extrabold leading-tight">
            Good morning 👋
          </h1>
          <p className="text-blue-100 text-sm mt-1.5">
            {isOnline
              ? activeJob
                ? `You have an active job: ${activeJob.service}`
                : `${availableJobs.length} job${availableJobs.length !== 1 ? 's' : ''} available nearby`
              : 'Go online to start receiving jobs'}
          </p>
        </div>

        <div className="flex gap-3 mt-5 overflow-x-auto pb-1 scrollbar-hide">
          {statChips.map(chip => (
            <div
              key={chip.id}
              className="flex-shrink-0 bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3 flex items-center gap-3 min-w-[140px]"
            >
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <chip.icon className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white font-extrabold text-sm leading-none">{chip.value}</p>
                <p className="text-blue-200 text-[10px] mt-0.5 font-medium">{chip.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 sm:px-6 py-7 pb-28 lg:pb-12 space-y-6">
        <AnimatePresence mode="popLayout">
          {activeJob && (
            <section key="active-job" aria-label="Active job">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-gray-900">Active Job</h2>
              </div>
              <ActiveJobCard
                job={activeJob}
                onStart={startJob}
                onComplete={completeJob}
                onViewDetail={setDetailJob}
              />
            </section>
          )}
        </AnimatePresence>

        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-gray-200 rounded-2xl p-8 text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <Briefcase className="w-7 h-7 text-gray-400" />
            </div>
            <p className="text-sm font-bold text-gray-700">You&apos;re currently offline</p>
            <p className="text-xs text-gray-400 mt-1">Toggle Online above to receive job requests</p>
          </motion.div>
        )}

        {isOnline && (
          <section aria-label="Available jobs">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-gray-900">Available Jobs Nearby</h2>
              {availableJobs.length > 0 && (
                <button
                  type="button"
                  onClick={() => onNavigate('jobs')}
                  className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline"
                >
                  <span>See all</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2].map(n => (
                  <div key={n} className="bg-white border border-gray-200 rounded-2xl p-4 animate-pulse">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gray-100 flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-100 rounded w-2/3" />
                        <div className="h-3 bg-gray-100 rounded w-1/2" />
                        <div className="h-3 bg-gray-100 rounded w-3/4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : availableJobs.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-3">
                  <Zap className="w-6 h-6 text-blue-400" />
                </div>
                <p className="text-sm font-semibold text-gray-500">No jobs available right now</p>
                <p className="text-xs text-gray-400 mt-1">
                  New jobs will appear here when they match your area
                </p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                <div className="space-y-3">
                  {availableJobs.map((job, i) => (
                    <AvailableJobCard
                      key={job.id}
                      job={job}
                      index={i}
                      onAccept={acceptJob}
                      onDecline={declineJob}
                      onViewDetail={setDetailJob}
                    />
                  ))}
                </div>
              </AnimatePresence>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
