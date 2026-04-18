'use client';

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type {
  AvailabilitySlot,
  BarChartDataPoint,
  Booking,
  CleanerProfile,
  CleanerReview,
  DatabaseBooking,
  DatabaseEarnings,
  EarningRecord,
  EarningsRecord,
  EarningsSummary,
  Job,
  ScheduleDay,
  ScheduledJob,
  ScheduleEvent,
} from './cleanerTypes';
import {
  formatDate,
  formatTime,
  transformBooking,
  transformEarnings,
  transformScheduleEvent,
} from './cleanerDashboardTransforms';
import { pickActiveRawBooking, rawBookingToJob } from './cleanerJobUtils';

export type { CleanerProfile } from './cleanerTypes';

const DECLINED_KEY = 'cleaner-declined-job-ids';

function getDeclinedIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = sessionStorage.getItem(DECLINED_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function addDeclinedId(id: string) {
  const s = getDeclinedIds();
  s.add(id);
  sessionStorage.setItem(DECLINED_KEY, JSON.stringify([...s]));
}

async function patchBookingStatus(id: string, status: string) {
  const res = await fetch(`/api/cleaner/bookings/${id}/status`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || 'Update failed');
}

function initialsFromName(name: string): string {
  if (!name.trim()) return 'SC';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function startOfWeekMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function useCleaner() {
  const [isOnline, setIsOnline] = useState(false);
  const [profile, setProfile] = useState<CleanerProfile>({
    initial: 'SC',
    name: 'Shalean Cleaner',
    specialty: 'Professional Cleaning',
    email: '',
    phone: '',
    rating: 0,
    totalJobs: 0,
    memberSince: '—',
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [availRes, personalRes, profRes, bookingsRes, reviewsRes] = await Promise.all([
          fetch('/api/cleaner/availability', { credentials: 'include' }),
          fetch('/api/cleaner/personal-info', { credentials: 'include' }),
          fetch('/api/cleaner/cleaner-profile', { credentials: 'include' }),
          fetch('/api/cleaner/bookings', { credentials: 'include' }),
          fetch('/api/cleaner/reviews', { credentials: 'include' }),
        ]);
        const availJson = await availRes.json();
        const personalJson = await personalRes.json();
        const profJson = await profRes.json();
        const bookingsJson = await bookingsRes.json();
        const reviewsJson = await reviewsRes.json();
        if (cancelled) return;
        if (availJson.ok && typeof availJson.is_available === 'boolean') {
          setIsOnline(availJson.is_available);
        }
        const name =
          personalJson.ok && personalJson.personal_info?.name
            ? String(personalJson.personal_info.name)
            : 'Shalean Cleaner';
        const email =
          personalJson.ok && personalJson.personal_info?.email
            ? String(personalJson.personal_info.email)
            : '';
        const phone =
          personalJson.ok && personalJson.personal_info?.phone
            ? String(personalJson.personal_info.phone)
            : '';
        const specialties = profJson.ok?.profile?.specialties;
        const specList = Array.isArray(specialties)
          ? specialties
          : specialties
            ? [specialties]
            : [];
        const specialty =
          specList.length > 0 ? String(specList[0]) : 'Professional Cleaning';

        let totalCompleted = 0;
        if (bookingsJson.ok && Array.isArray(bookingsJson.bookings)) {
          totalCompleted = bookingsJson.bookings.filter(
            (b: { status?: string }) => b.status === 'completed',
          ).length;
        }

        let avgRating = 0;
        if (reviewsJson.ok && Array.isArray(reviewsJson.reviews) && reviewsJson.reviews.length > 0) {
          const sum = reviewsJson.reviews.reduce(
            (s: number, r: { rating?: number }) => s + (r.rating || 0),
            0,
          );
          avgRating = Math.round((sum / reviewsJson.reviews.length) * 10) / 10;
        } else {
          avgRating = 4.9;
        }

        setProfile({
          initial: initialsFromName(name),
          name,
          specialty,
          email,
          phone,
          rating: avgRating,
          totalJobs: totalCompleted,
          memberSince: '—',
        });
      } catch {
        /* keep defaults */
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleOnline = useCallback(async () => {
    const next = !isOnline;
    setIsOnline(next);
    try {
      const res = await fetch('/api/cleaner/availability', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_available: next }),
      });
      const data = await res.json();
      if (data.ok && typeof data.is_available === 'boolean') {
        setIsOnline(data.is_available);
      } else {
        setIsOnline(!next);
      }
    } catch {
      setIsOnline(!next);
    }
  }, [isOnline]);

  return { isOnline, toggleOnline, profile };
}

export function useCleanerDashboardData() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [scheduleEvents, setScheduleEvents] = useState<ScheduleEvent[]>([]);
  const [earnings, setEarnings] = useState<EarningsRecord[]>([]);
  const [monthlyEarnings, setMonthlyEarnings] = useState<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const cleanerRating = 0;

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/cleaner/bookings', {
          credentials: 'include',
        });

        if (!response.ok) return;

        const data = await response.json();
        if (data.ok && data.bookings) {
          const transformedBookings = data.bookings.map((b: DatabaseBooking) =>
            transformBooking(b, true),
          );
          setBookings(transformedBookings);

          const upcoming = data.bookings
            .filter((b: DatabaseBooking) =>
              [
                'pending',
                'paid',
                'assigned',
                'accepted',
                'on_my_way',
                'in-progress',
              ].includes(b.status),
            )
            .map((b: DatabaseBooking) => transformScheduleEvent(b));
          setScheduleEvents(upcoming);
        }
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, []);

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        const response = await fetch('/api/cleaner/payments', {
          credentials: 'include',
        });

        if (!response.ok) return;

        const data = await response.json();
        if (data.ok && data.transactions) {
          const transformedEarnings = data.transactions.map((t: DatabaseEarnings) =>
            transformEarnings(t),
          );
          setEarnings(transformedEarnings);

          if (data.summary && data.summary.monthly_earnings !== undefined) {
            setMonthlyEarnings(data.summary.monthly_earnings);
          }
        }
      } catch (error) {
        console.error('Error fetching earnings:', error);
      }
    };

    fetchEarnings();
  }, []);

  return {
    bookings,
    scheduleEvents,
    earnings,
    monthlyEarnings,
    isLoading,
    cleanerRating,
  };
}

function buildRatingByBookingId(reviews: Array<{ booking_id?: string; rating?: number }>) {
  const m: Record<string, number> = {};
  for (const r of reviews) {
    if (r.booking_id && typeof r.rating === 'number') {
      m[r.booking_id] = r.rating;
    }
  }
  return m;
}

function useJobsImpl() {
  const [loading, setLoading] = useState(true);
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [availableJobs, setAvailableJobs] = useState<Job[]>([]);
  const [acceptedJobs, setAcceptedJobs] = useState<Job[]>([]);
  const [completedJobs, setCompletedJobs] = useState<Job[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [mineRes, availRes, reviewsRes] = await Promise.all([
        fetch('/api/cleaner/bookings', { credentials: 'include', cache: 'no-store' }),
        fetch('/api/cleaner/bookings/available', { credentials: 'include', cache: 'no-store' }),
        fetch('/api/cleaner/reviews', { credentials: 'include', cache: 'no-store' }),
      ]);
      const mineJson = await mineRes.json();
      const availJson = await availRes.json();
      const reviewsJson = await reviewsRes.json();

      const mineList: Record<string, unknown>[] =
        mineJson.ok && Array.isArray(mineJson.bookings) ? mineJson.bookings : [];
      const reviewsList: Array<{ booking_id?: string; rating?: number }> =
        reviewsJson.ok && Array.isArray(reviewsJson.reviews) ? reviewsJson.reviews : [];
      const ratingByBooking = buildRatingByBookingId(reviewsList);

      const rawActive = pickActiveRawBooking(mineList);
      setActiveJob(
        rawActive
          ? rawBookingToJob(
              rawActive,
              'assigned',
              ratingByBooking[String(rawActive.id)],
            )
          : null,
      );

      const declined = getDeclinedIds();
      let availList: Record<string, unknown>[] =
        availJson.ok && Array.isArray(availJson.bookings) ? availJson.bookings : [];
      availList = availList.filter(b => !declined.has(String(b.id)));
      setAvailableJobs(availList.map(b => rawBookingToJob(b, 'available')));

      const mineJobs = mineList.map(b =>
        rawBookingToJob(b, 'assigned', ratingByBooking[String(b.id)]),
      );
      setAcceptedJobs(
        mineJobs.filter(
          j =>
            j.status === 'accepted' ||
            j.status === 'assigned' ||
            j.status === 'on_my_way' ||
            j.status === 'in_progress',
        ),
      );
      setCompletedJobs(mineJobs.filter(j => j.status === 'completed'));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const acceptJob = useCallback(
    async (id: string) => {
      const mineRes = await fetch('/api/cleaner/bookings', {
        credentials: 'include',
        cache: 'no-store',
      });
      const mineJson = await mineRes.json();
      const list: Record<string, unknown>[] =
        mineJson.ok && Array.isArray(mineJson.bookings) ? mineJson.bookings : [];
      const b = list.find(x => String(x.id) === id);
      if (b && ['pending', 'paid', 'assigned'].includes(String(b.status))) {
        await patchBookingStatus(id, 'accepted');
        await load();
        return;
      }
      const res = await fetch(`/api/cleaner/bookings/${id}/claim`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Claim failed');
      await load();
    },
    [load],
  );

  const declineJob = useCallback(async (id: string) => {
    addDeclinedId(id);
    setAvailableJobs(prev => prev.filter(j => j.id !== id));
  }, []);

  const onMyWay = useCallback(
    async (id: string) => {
      const res = await fetch('/api/cleaner/bookings', { credentials: 'include', cache: 'no-store' });
      const data = await res.json();
      const list: Record<string, unknown>[] =
        data.ok && Array.isArray(data.bookings) ? data.bookings : [];
      const b = list.find(x => String(x.id) === id);
      if (!b) return;
      if (String(b.status) === 'on_my_way') {
        await load();
        return;
      }
      await patchBookingStatus(id, 'on_my_way');
      await load();
    },
    [load],
  );

  const startJob = useCallback(
    async (id: string) => {
      const res = await fetch('/api/cleaner/bookings', { credentials: 'include', cache: 'no-store' });
      const data = await res.json();
      const list: Record<string, unknown>[] =
        data.ok && Array.isArray(data.bookings) ? data.bookings : [];
      const b = list.find(x => String(x.id) === id);
      if (!b) return;
      const s = String(b.status);
      if (s === 'on_my_way') {
        await patchBookingStatus(id, 'in-progress');
        await load();
        return;
      }
    },
    [load],
  );

  const completeJob = useCallback(
    async (id: string) => {
      await patchBookingStatus(id, 'completed');
      await load();
    },
    [load],
  );

  return {
    loading,
    activeJob,
    availableJobs,
    acceptedJobs,
    completedJobs,
    acceptJob,
    declineJob,
    onMyWay,
    startJob,
    completeJob,
    refresh: load,
  };
}

export type CleanerJobsContextValue = ReturnType<typeof useJobsImpl>;

const JobsContext = createContext<CleanerJobsContextValue | null>(null);

export function CleanerJobsProvider({ children }: { children: ReactNode }) {
  const value = useJobsImpl();
  return createElement(JobsContext.Provider, { value }, children);
}

export function useJobs(): CleanerJobsContextValue {
  const ctx = useContext(JobsContext);
  if (!ctx) {
    throw new Error('useJobs must be used within CleanerJobsProvider');
  }
  return ctx;
}

export function useEarnings() {
  const [summary, setSummary] = useState<EarningsSummary>({ today: 0, week: 0, month: 0 });
  const [records, setRecords] = useState<EarningRecord[]>([]);
  const [chartData, setChartData] = useState<BarChartDataPoint[]>([]);
  const [monthLabel, setMonthLabel] = useState('this month');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/cleaner/payments', { credentials: 'include' });
        const data = await res.json();
        if (!data.ok || !Array.isArray(data.transactions)) return;

        const transactions = data.transactions as Array<{
          id: string;
          booking_date: string;
          service_type?: string;
          customer_name?: string;
          cleaner_earnings?: number;
        }>;

        const todayStr = new Date().toISOString().split('T')[0];
        const monday = startOfWeekMonday(new Date());
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        const weekStartStr = monday.toISOString().split('T')[0];
        const weekEndStr = sunday.toISOString().split('T')[0];

        const centsToday = transactions
          .filter(t => t.booking_date === todayStr)
          .reduce((s, t) => s + (t.cleaner_earnings || 0), 0);

        const centsWeek = transactions
          .filter(t => t.booking_date >= weekStartStr && t.booking_date <= weekEndStr)
          .reduce((s, t) => s + (t.cleaner_earnings || 0), 0);

        const monthlyCents =
          data.summary && typeof data.summary.monthly_earnings === 'number'
            ? data.summary.monthly_earnings
            : transactions
                .filter(t => {
                  const d = new Date(t.booking_date);
                  const n = new Date();
                  return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
                })
                .reduce((s, t) => s + (t.cleaner_earnings || 0), 0);

        const recs: EarningRecord[] = transactions.slice(0, 20).map(t => {
          const rands = Math.round((t.cleaner_earnings || 0) / 100);
          return {
            id: t.id,
            jobId: t.id,
            service: String(t.service_type ?? 'Job'),
            client: String(t.customer_name ?? 'Client'),
            date: formatDate(t.booking_date),
            amount: `R${rands}`,
            amountNumber: rands,
          };
        });

        const dayLetters = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
        const chart: BarChartDataPoint[] = [];
        for (let i = 0; i < 7; i++) {
          const day = new Date(monday);
          day.setDate(monday.getDate() + i);
          const ds = day.toISOString().split('T')[0];
          const amount = Math.round(
            transactions
              .filter(t => t.booking_date === ds)
              .reduce((s, t) => s + (t.cleaner_earnings || 0), 0) / 100,
          );
          chart.push({
            id: `w-${ds}`,
            day: dayLetters[i],
            amount,
          });
        }

        const now = new Date();
        const ml = now.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' });

        if (!cancelled) {
          setSummary({
            today: Math.round(centsToday / 100),
            week: Math.round(centsWeek / 100),
            month: Math.round(monthlyCents / 100),
          });
          setRecords(recs);
          setChartData(chart);
          setMonthLabel(ml);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { summary, records, chartData, monthLabel };
}

export function useCleanerReviews() {
  const [reviews, setReviews] = useState<CleanerReview[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/cleaner/reviews', { credentials: 'include' });
        const data = await res.json();
        if (!data.ok || !Array.isArray(data.reviews)) return;
        const mapped: CleanerReview[] = data.reviews.map(
          (r: {
            id: string;
            rating?: number;
            comment?: string;
            booking_id?: string;
            created_at?: string;
            bookings?: {
              customer_name?: string;
              service_type?: string;
              booking_date?: string;
            };
          }) => {
            const name =
              r.bookings?.customer_name ||
              (r as { customers?: { name?: string } }).customers?.name ||
              'Client';
            return {
              id: r.id,
              clientName: String(name),
              clientInitial: initialsFromName(String(name)),
              rating: r.rating ?? 0,
              comment: String(r.comment ?? ''),
              date: r.bookings?.booking_date
                ? formatDate(r.bookings.booking_date)
                : formatDate(String(r.created_at ?? '')),
              service: String(r.bookings?.service_type ?? 'Cleaning'),
            };
          },
        );
        if (!cancelled) setReviews(mapped);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { reviews };
}

const AVAIL_SEED: AvailabilitySlot[] = [
  { id: 'avail-morn', label: 'Morning (7am – 12pm)', enabled: true },
  { id: 'avail-aftn', label: 'Afternoon (12pm – 5pm)', enabled: true },
  { id: 'avail-eve', label: 'Evening (5pm – 9pm)', enabled: false },
  { id: 'avail-weekend', label: 'Weekends', enabled: true },
];

export function useSchedule() {
  const [bookings, setBookings] = useState<Record<string, unknown>[]>([]);
  const [selectedDayId, setSelectedDayId] = useState('');
  const [availability, setAvailability] = useState<AvailabilitySlot[]>(AVAIL_SEED);

  const scheduleDays: ScheduleDay[] = useMemo(() => {
    const mon = startOfWeekMonday(new Date());
    const todayStr = new Date().toISOString().split('T')[0];
    const days: ScheduleDay[] = [];
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    for (let i = 0; i < 7; i++) {
      const d = new Date(mon);
      d.setDate(mon.getDate() + i);
      const key = d.toISOString().split('T')[0];
      const hasJobs = bookings.some(
        b =>
          String(b.booking_date) === key &&
          [
            'pending',
            'paid',
            'assigned',
            'accepted',
            'on_my_way',
            'in-progress',
            'completed',
          ].includes(String(b.status)),
      );
      days.push({
        id: `sched-${key}`,
        date: d.getDate(),
        dayShort: labels[i],
        isToday: key === todayStr,
        hasJobs,
        isAvailable: true,
        dateKey: key,
      });
    }
    return days;
  }, [bookings]);

  useEffect(() => {
    if (scheduleDays.length && !selectedDayId) {
      const t = scheduleDays.find(d => d.isToday) ?? scheduleDays[0];
      setSelectedDayId(t.id);
    }
  }, [scheduleDays, selectedDayId]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/cleaner/bookings', { credentials: 'include' });
        const data = await res.json();
        if (data.ok && Array.isArray(data.bookings)) setBookings(data.bookings);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const selectedDay = scheduleDays.find(d => d.id === selectedDayId);

  const scheduledJobs: ScheduledJob[] = useMemo(() => {
    if (!selectedDay) return [];
    return bookings
      .filter(
        b =>
          String(b.booking_date) === selectedDay.dateKey &&
          [
            'pending',
            'paid',
            'assigned',
            'accepted',
            'on_my_way',
            'in-progress',
            'completed',
          ].includes(String(b.status)),
      )
      .map(b => {
        const pay = rawBookingToJob(b, 'assigned').pay;
        const t = formatTime(String(b.booking_time ?? '09:00'));
        return {
          id: String(b.id),
          service: String(b.service_type ?? 'Cleaning'),
          client: String(b.customer_name ?? 'Client'),
          time: t,
          address: [b.address_line1, b.address_suburb, b.address_city].filter(Boolean).join(', ') || '—',
          pay,
        };
      });
  }, [bookings, selectedDay]);

  const toggleAvailability = useCallback((id: string) => {
    setAvailability(prev => prev.map(a => (a.id === id ? { ...a, enabled: !a.enabled } : a)));
  }, []);

  return {
    scheduleDays,
    selectedDayId,
    setSelectedDayId,
    scheduledJobs,
    availability,
    toggleAvailability,
    calendarTitle: scheduleDays.length
      ? new Date(scheduleDays[0].dateKey + 'T12:00:00').toLocaleDateString('en-ZA', {
          month: 'long',
          year: 'numeric',
        })
      : '',
  };
}
