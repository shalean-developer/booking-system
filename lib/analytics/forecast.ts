/**
 * Simple moving-average forecasts for admin analytics (bookings, revenue, demand).
 */

import { addCalendarDaysYmd } from '@/lib/admin-dashboard-business-range';

export const DEFAULT_MA_WINDOW = 7;
export const DEFAULT_FORECAST_HORIZON = 7;
/** Fallback when history is too thin. */
export const DEFAULT_JOBS_PER_CLEANER_PER_DAY = 2;

export type DailyPoint = {
  date: string;
  bookings: number;
  revenueZar: number;
};

export type DemandAlert = {
  date: string;
  weekdayLabel: string;
  demand_high: boolean;
  forecastBookings: number;
  dailyCapacity: number;
  message: string;
  surgeSuggestion?: string;
};

export type ForecastResult = {
  /** Moving-average series aligned to `history` dates (same length). */
  maBookings: number[];
  maRevenueZar: number[];
  /** Flat projection: last MA value repeated for each of the next `horizon` days. */
  forecastBookings: number[];
  forecastRevenueZar: number[];
  /** Calendar dates (YYYY-MM-DD) for forecast horizon, business TZ upstream. */
  forecastDates: string[];
  demandAlerts: DemandAlert[];
  /** Estimated cleaners needed per forecast day (ceil). */
  cleanerNeeds: number[];
  meta: {
    window: number;
    horizon: number;
    historyDays: number;
    activeCleaners: number;
    avgJobsPerCleanerPerDay: number;
    dailyCapacity: number;
    lastMaBookings: number;
    lastMaRevenueZar: number;
  };
};

/**
 * Trailing moving average. Early indices use a shorter window (1..min(i+1, window)).
 */
export function movingAverage(data: number[], window = DEFAULT_MA_WINDOW): number[] {
  if (data.length === 0) return [];
  const out: number[] = [];
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = data.slice(start, i + 1);
    const sum = slice.reduce((a, b) => a + b, 0);
    out.push(sum / slice.length);
  }
  return out;
}

function weekdayLabel(ymd: string): string {
  const t = ymd.trim();
  const dt = new Date(`${t}T12:00:00+02:00`);
  if (Number.isNaN(dt.getTime())) return t;
  return new Intl.DateTimeFormat('en-ZA', {
    weekday: 'long',
    timeZone: 'Africa/Johannesburg',
  }).format(dt);
}

/**
 * Build the next `horizon` calendar days after `lastHistoricalYmd` (exclusive of lastHistorical).
 */
export function nextCalendarDays(lastHistoricalYmd: string, horizon: number): string[] {
  const dates: string[] = [];
  for (let i = 1; i <= horizon; i++) {
    dates.push(addCalendarDaysYmd(lastHistoricalYmd, i));
  }
  return dates;
}

export function buildForecast(input: {
  /** Oldest → newest, one row per calendar day (gaps should be zeros). */
  history: DailyPoint[];
  activeCleaners: number;
  horizon?: number;
  window?: number;
}): ForecastResult {
  const horizon = input.horizon ?? DEFAULT_FORECAST_HORIZON;
  const window = input.window ?? DEFAULT_MA_WINDOW;
  const bookingsSeries = input.history.map((h) => h.bookings);
  const revenueSeries = input.history.map((h) => h.revenueZar);

  const maBookings = movingAverage(bookingsSeries, window);
  const maRevenueZar = movingAverage(revenueSeries, window);

  const lastMaBookings = maBookings.length ? maBookings[maBookings.length - 1]! : 0;
  const lastMaRevenueZar = maRevenueZar.length ? maRevenueZar[maRevenueZar.length - 1]! : 0;

  const histDays = Math.max(1, input.history.length);
  const cleaners = Math.max(0, Math.floor(input.activeCleaners));

  const totalBookings = bookingsSeries.reduce((a, b) => a + b, 0);
  let avgJobsPerCleanerPerDay =
    cleaners > 0 ? totalBookings / cleaners / histDays : DEFAULT_JOBS_PER_CLEANER_PER_DAY;
  if (!Number.isFinite(avgJobsPerCleanerPerDay) || avgJobsPerCleanerPerDay <= 0) {
    avgJobsPerCleanerPerDay = DEFAULT_JOBS_PER_CLEANER_PER_DAY;
  }

  const dailyCapacity = cleaners * avgJobsPerCleanerPerDay;

  const lastHistoricalYmd =
    input.history.length > 0 ? input.history[input.history.length - 1]!.date : '';

  const forecastDates = lastHistoricalYmd
    ? nextCalendarDays(lastHistoricalYmd, horizon)
    : [];

  const forecastBookings = Array(horizon).fill(Math.round(lastMaBookings * 100) / 100);
  const forecastRevenueZar = Array(horizon).fill(Math.round(lastMaRevenueZar * 100) / 100);

  const demandAlerts: DemandAlert[] = [];
  const cleanerNeeds: number[] = [];

  for (let i = 0; i < horizon; i++) {
    const date = forecastDates[i] ?? '';
    const fb = forecastBookings[i] ?? 0;
    const cap = Math.max(0.0001, dailyCapacity);
    const demand_high = fb > cap;
    const wd = date ? weekdayLabel(date) : '';

    const required = Math.ceil(fb / Math.max(0.0001, avgJobsPerCleanerPerDay));
    cleanerNeeds.push(required);

    let message = `Forecast ~${fb.toFixed(1)} bookings (${wd || date}).`;
    let surgeSuggestion: string | undefined;
    if (demand_high) {
      message = `High demand expected${wd ? ` on ${wd}` : ''}: ~${fb.toFixed(
        1,
      )} bookings vs ~${cap.toFixed(1)} capacity (${cleaners} cleaners).`;
      surgeSuggestion = 'Increase surge multiplier for that day to balance demand.';
    }

    demandAlerts.push({
      date,
      weekdayLabel: wd,
      demand_high,
      forecastBookings: fb,
      dailyCapacity: Math.round(cap * 100) / 100,
      message,
      surgeSuggestion,
    });
  }

  return {
    maBookings,
    maRevenueZar,
    forecastBookings,
    forecastRevenueZar,
    forecastDates,
    demandAlerts,
    cleanerNeeds,
    meta: {
      window,
      horizon,
      historyDays: histDays,
      activeCleaners: cleaners,
      avgJobsPerCleanerPerDay: Math.round(avgJobsPerCleanerPerDay * 1000) / 1000,
      dailyCapacity: Math.round(dailyCapacity * 100) / 100,
      lastMaBookings: Math.round(lastMaBookings * 100) / 100,
      lastMaRevenueZar: Math.round(lastMaRevenueZar * 100) / 100,
    },
  };
}

/**
 * Series for actual vs MA "predicted" overlay on history (each day: MA uses prior window).
 */
export function alignActualVsMa(history: DailyPoint[], maBookings: number[], maRevenueZar: number[]) {
  return history.map((h, i) => ({
    date: h.date,
    actualBookings: h.bookings,
    actualRevenueZar: h.revenueZar,
    predictedBookings: maBookings[i] ?? 0,
    predictedRevenueZar: maRevenueZar[i] ?? 0,
  }));
}
