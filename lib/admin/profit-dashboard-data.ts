/**
 * Admin profit dashboard — read-only aggregates.
 *
 * **Realized:** completed + approved earnings + not refunded.
 * **Projected:** pipeline statuses; cost via `estimateCleanerCostCentsProjected` (earnings-v2).
 * **Losses:** `payment_status = refunded` in range.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { isExcludedFromRevenueReporting } from '@/lib/booking-revenue-exclusion';
import {
  analyzeBookingOptimization,
  analyzeServicePortfolioOptimization,
  describeAutoOptimizationPolicy,
  isAutoOptimizationEnabled,
  mergeOptimizationResults,
  type OptimizationResult,
} from '@/lib/ai-optimizer';
import {
  buildProfitAlerts,
  buildServiceOptimizationInsights,
  computePreviousInclusiveDateRange,
  estimateCleanerCostCentsProjected,
  growthPct,
  profitCentsRealized,
  PROJECTED_STATUSES,
  type ProfitAlertItem,
  type ProfitMode,
  type ServiceOptimizationInsight,
} from '@/lib/admin/profit-financial';

export type ProfitDashboardFilters = {
  dateFrom?: string | null;
  dateTo?: string | null;
  serviceType?: string | null;
  cleanerId?: string | null;
  mode?: ProfitMode | null;
};

export type ProfitSummary = {
  totalRevenueCents: number;
  totalCostCents: number;
  totalProfitCents: number;
  profitMargin: number | null;
};

export type ProfitDailyRow = {
  date: string;
  revenueCents: number;
  profitCents: number;
  bookings: number;
};

export type ProfitServiceRow = {
  serviceType: string;
  revenueCents: number;
  profitCents: number;
  marginPct: number | null;
};

export type ProfitCleanerRow = {
  cleanerId: string;
  name: string;
  totalEarningsCents: number;
  jobCount: number;
  avgEarningsCents: number;
};

export type CleanerPerformanceRow = {
  cleanerId: string;
  name: string;
  jobCount: number;
  revenueCents: number;
  costCents: number;
  profitCents: number;
  marginPct: number | null;
  /** Sum of attributed job hours (team: full duration per member). */
  totalHours: number;
  distinctWorkDays: number;
  profitPerHourCents: number | null;
  revenuePerHourCents: number | null;
  /** Jobs ÷ distinct days with at least one job. */
  jobsPerDay: number | null;
};

export type ProfitLossSummary = {
  refundBookingCount: number;
  totalLossesCents: number;
};

export type ProfitPeriodComparison = {
  previousFrom: string | null;
  previousTo: string | null;
  revenueGrowthPct: number | null;
  profitGrowthPct: number | null;
  marginDeltaPctPoints: number | null;
};

export type ProfitSnapshotBlock = {
  summary: ProfitSummary;
  daily: ProfitDailyRow[];
  byService: ProfitServiceRow[];
  bookingCount: number;
};

export type CleanerWalletLiabilitySummary = {
  totalLiabilityCents: number;
  walletRowCount: number;
};

export type PayoutMetricsSummary = {
  completedCount: number;
  failedCount: number;
  processingCount: number;
  windowDays: number;
};

/** Cash timing: revenue uses booking completion window; payouts use wallet `created_at`. */
export type CashFlowSummary = {
  revenueReceivedCents: number;
  payoutsSentCents: number;
  netCashFlowCents: number;
  upcomingPayoutsCents: number;
  payoutQueryLabel: string;
};

export type ProfitDashboardData = {
  mode: ProfitMode;
  summary: ProfitSummary;
  daily: ProfitDailyRow[];
  byService: ProfitServiceRow[];
  cleaners: ProfitCleanerRow[];
  realized: ProfitSnapshotBlock;
  projected: ProfitSnapshotBlock;
  losses: ProfitLossSummary;
  netProfitCents: number;
  comparison: ProfitPeriodComparison | null;
  cleanerPerformance: CleanerPerformanceRow[];
  alerts: ProfitAlertItem[];
  optimization: {
    merged: OptimizationResult;
    bookingSamplesAnalyzed: number;
    autoOptimizationEnabled: boolean;
    autoOptimizationPolicy: string;
  };
  cleanerWalletLiability: CleanerWalletLiabilitySummary;
  payoutMetrics: PayoutMetricsSummary;
  cashFlow: CashFlowSummary;
  serviceInsights: ServiceOptimizationInsight[];
  cleanerOptions: Array<{ id: string; name: string }>;
  meta: {
    bookingCount: number;
    filters: ProfitDashboardFilters;
  };
};

type BookingRow = {
  id: string;
  total_amount: number | null;
  earnings_final: number | null;
  company_profit_cents: number | null;
  service_type: string | null;
  booking_date: string | null;
  completed_at: string | null;
  cleaner_id: string | null;
  requires_team: boolean | null;
  team_size: number | null;
  total_hours: number | null;
  service_fee: number | null;
  tip_amount: number | null;
  equipment_cost: number | null;
  extra_cleaner_fee: number | null;
  duration_minutes: number | null;
  payment_status?: string | null;
  status?: string | null;
};

const PAGE = 800;
const AI_BOOKING_SAMPLE_CAP = 100;

const BOOKING_SELECT_REALIZED =
  'id, total_amount, earnings_final, company_profit_cents, service_type, booking_date, completed_at, cleaner_id, requires_team, team_size, total_hours, service_fee, tip_amount, equipment_cost, extra_cleaner_fee, duration_minutes, payment_status, status';

const BOOKING_SELECT_PROJECTED = BOOKING_SELECT_REALIZED;

function sortKeyNewestFirst(b: BookingRow): string {
  const c = b.completed_at?.trim();
  if (c) return c;
  const d = b.booking_date?.trim();
  return d ?? '';
}

function dayKeyRealized(b: BookingRow): string {
  const c = b.completed_at?.trim();
  if (c && c.length >= 10) return c.slice(0, 10);
  const d = b.booking_date?.trim();
  if (d && d.length >= 10) return d.slice(0, 10);
  return '';
}

function dayKeyProjected(b: BookingRow): string {
  const d = b.booking_date?.trim();
  if (d && d.length >= 10) return d.slice(0, 10);
  return '';
}

function inDateRange(key: string, from?: string | null, to?: string | null): boolean {
  if (!key) return false;
  if (from && key < from) return false;
  if (to && key > to) return false;
  return true;
}

async function loadBookingIdsForTeamCleaner(
  supabase: SupabaseClient,
  cleanerId: string
): Promise<Set<string>> {
  const out = new Set<string>();
  const { data: members, error } = await supabase
    .from('booking_team_members')
    .select('booking_team_id')
    .eq('cleaner_id', cleanerId);
  if (error) throw new Error(error.message);
  const teamIds = [
    ...new Set(
      (members ?? []).map((m) => m.booking_team_id as string).filter((id): id is string => Boolean(id))
    ),
  ];
  if (teamIds.length === 0) return out;
  const { data: teams, error: e2 } = await supabase
    .from('booking_teams')
    .select('booking_id')
    .in('id', teamIds);
  if (e2) throw new Error(e2.message);
  for (const t of teams ?? []) {
    const bid = t.booking_id as string | undefined;
    if (bid) out.add(bid);
  }
  return out;
}

function projectedCost(b: BookingRow): number {
  return estimateCleanerCostCentsProjected({
    total_amount: b.total_amount,
    service_fee: b.service_fee,
    tip_amount: b.tip_amount,
    equipment_cost: b.equipment_cost,
    extra_cleaner_fee: b.extra_cleaner_fee,
    service_type: b.service_type,
    requires_team: b.requires_team,
    team_size: b.team_size,
    duration_minutes: b.duration_minutes,
  });
}

function aggregateRealized(rows: BookingRow[]): {
  summary: ProfitSummary;
  daily: ProfitDailyRow[];
  byService: ProfitServiceRow[];
  bookingCostSamples: Array<{ id: string; revenueCents: number; costCents: number }>;
} {
  let totalRevenueCents = 0;
  let totalCostCents = 0;
  let totalProfitCents = 0;
  const dailyMap = new Map<string, { revenue: number; profit: number; n: number }>();
  const serviceMap = new Map<string, { revenue: number; profit: number }>();
  const bookingCostSamples: Array<{ id: string; revenueCents: number; costCents: number }> = [];

  for (const b of rows) {
    const rev = Math.round(Number(b.total_amount) || 0);
    const pay = Math.round(Number(b.earnings_final) || 0);
    const prof = profitCentsRealized(b);
    totalRevenueCents += rev;
    totalCostCents += pay;
    totalProfitCents += prof;
    const dk = dayKeyRealized(b);
    if (dk) {
      const cur = dailyMap.get(dk) ?? { revenue: 0, profit: 0, n: 0 };
      cur.revenue += rev;
      cur.profit += prof;
      cur.n += 1;
      dailyMap.set(dk, cur);
    }
    const st = (b.service_type || 'Unknown').trim() || 'Unknown';
    const sc = serviceMap.get(st) ?? { revenue: 0, profit: 0 };
    sc.revenue += rev;
    sc.profit += prof;
    serviceMap.set(st, sc);
    if (bookingCostSamples.length < 80) {
      bookingCostSamples.push({ id: b.id, revenueCents: rev, costCents: pay });
    }
  }

  const profitMargin = totalRevenueCents > 0 ? totalProfitCents / totalRevenueCents : null;
  const daily: ProfitDailyRow[] = [...dailyMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      date,
      revenueCents: v.revenue,
      profitCents: v.profit,
      bookings: v.n,
    }));
  const byService: ProfitServiceRow[] = [...serviceMap.entries()]
    .map(([serviceType, v]) => ({
      serviceType,
      revenueCents: v.revenue,
      profitCents: v.profit,
      marginPct: v.revenue > 0 ? (v.profit / v.revenue) * 100 : null,
    }))
    .sort((a, b) => b.revenueCents - a.revenueCents);

  return {
    summary: {
      totalRevenueCents,
      totalCostCents,
      totalProfitCents,
      profitMargin,
    },
    daily,
    byService,
    bookingCostSamples,
  };
}

function aggregateProjected(rows: BookingRow[]): {
  summary: ProfitSummary;
  daily: ProfitDailyRow[];
  byService: ProfitServiceRow[];
} {
  let totalRevenueCents = 0;
  let totalCostCents = 0;
  let totalProfitCents = 0;
  const dailyMap = new Map<string, { revenue: number; profit: number; n: number }>();
  const serviceMap = new Map<string, { revenue: number; profit: number }>();

  for (const b of rows) {
    const rev = Math.round(Number(b.total_amount) || 0);
    const cost = projectedCost(b);
    const prof = Math.max(0, rev - cost);
    totalRevenueCents += rev;
    totalCostCents += cost;
    totalProfitCents += prof;
    const dk = dayKeyProjected(b);
    if (dk) {
      const cur = dailyMap.get(dk) ?? { revenue: 0, profit: 0, n: 0 };
      cur.revenue += rev;
      cur.profit += prof;
      cur.n += 1;
      dailyMap.set(dk, cur);
    }
    const st = (b.service_type || 'Unknown').trim() || 'Unknown';
    const sc = serviceMap.get(st) ?? { revenue: 0, profit: 0 };
    sc.revenue += rev;
    sc.profit += prof;
    serviceMap.set(st, sc);
  }

  const profitMargin = totalRevenueCents > 0 ? totalProfitCents / totalRevenueCents : null;
  const daily: ProfitDailyRow[] = [...dailyMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      date,
      revenueCents: v.revenue,
      profitCents: v.profit,
      bookings: v.n,
    }));
  const byService: ProfitServiceRow[] = [...serviceMap.entries()]
    .map(([serviceType, v]) => ({
      serviceType,
      revenueCents: v.revenue,
      profitCents: v.profit,
      marginPct: v.revenue > 0 ? (v.profit / v.revenue) * 100 : null,
    }))
    .sort((a, b) => b.revenueCents - a.revenueCents);

  return {
    summary: {
      totalRevenueCents,
      totalCostCents,
      totalProfitCents,
      profitMargin,
    },
    daily,
    byService,
  };
}

async function fetchRealizedBookingRows(
  supabase: SupabaseClient,
  filters: ProfitDashboardFilters
): Promise<BookingRow[]> {
  const rows: BookingRow[] = [];
  let offset = 0;
  for (;;) {
    let q = supabase
      .from('bookings')
      .select(BOOKING_SELECT_REALIZED)
      .eq('status', 'completed')
      .eq('earnings_status', 'approved')
      .not('earnings_final', 'is', null)
      .not('payment_status', 'eq', 'refunded');
    if (filters.serviceType) q = q.eq('service_type', filters.serviceType);
    const { data, error } = await q.order('booking_date', { ascending: true }).range(offset, offset + PAGE - 1);
    if (error) throw new Error(error.message);
    const batch = (data ?? []) as BookingRow[];
    rows.push(...batch);
    if (batch.length < PAGE) break;
    offset += PAGE;
  }
  return rows;
}

async function fetchProjectedBookingRows(
  supabase: SupabaseClient,
  filters: ProfitDashboardFilters
): Promise<BookingRow[]> {
  const rows: BookingRow[] = [];
  let offset = 0;
  for (;;) {
    let q = supabase
      .from('bookings')
      .select(BOOKING_SELECT_PROJECTED)
      .in('status', [...PROJECTED_STATUSES])
      .not('payment_status', 'eq', 'refunded');
    if (filters.serviceType) q = q.eq('service_type', filters.serviceType);
    const { data, error } = await q.order('booking_date', { ascending: true }).range(offset, offset + PAGE - 1);
    if (error) throw new Error(error.message);
    const batch = (data ?? []) as BookingRow[];
    rows.push(...batch);
    if (batch.length < PAGE) break;
    offset += PAGE;
  }
  return rows.filter((b) => !isExcludedFromRevenueReporting(b));
}

async function fetchRefundLossRows(
  supabase: SupabaseClient,
  filters: ProfitDashboardFilters
): Promise<BookingRow[]> {
  const rows: BookingRow[] = [];
  let offset = 0;
  for (;;) {
    let q = supabase
      .from('bookings')
      .select(
        'id, total_amount, booking_date, completed_at, payment_status, status, service_type, cleaner_id, requires_team'
      )
      .eq('payment_status', 'refunded');
    if (filters.serviceType) q = q.eq('service_type', filters.serviceType);
    const { data, error } = await q.order('booking_date', { ascending: true }).range(offset, offset + PAGE - 1);
    if (error) throw new Error(error.message);
    const batch = (data ?? []) as BookingRow[];
    rows.push(...batch);
    if (batch.length < PAGE) break;
    offset += PAGE;
  }
  return rows;
}

function jobHoursFromBooking(b: BookingRow): number {
  const th = Number(b.total_hours);
  if (Number.isFinite(th) && th > 0) return Math.max(0.25, th);
  const dm = Number(b.duration_minutes);
  if (Number.isFinite(dm) && dm > 0) return Math.max(0.25, dm / 60);
  return 1;
}

function rolling30dIsoBounds(): { start: string; end: string; label: string } {
  const endD = new Date();
  const startD = new Date(endD);
  startD.setDate(startD.getDate() - 29);
  const ymd = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return {
    start: `${ymd(startD)}T00:00:00.000Z`,
    end: `${ymd(endD)}T23:59:59.999Z`,
    label: 'Rolling 30 days (set date filters to align revenue and payouts)',
  };
}

async function fetchCashFlowAggregates(
  supabase: SupabaseClient,
  revenueReceivedCents: number,
  dateFrom: string | null,
  dateTo: string | null
): Promise<CashFlowSummary> {
  const explicit =
    dateFrom && dateTo
      ? {
          start: `${dateFrom}T00:00:00.000Z`,
          end: `${dateTo}T23:59:59.999Z`,
          label: 'Wallet payouts vs booking revenue (same calendar range)',
        }
      : null;
  const win = explicit ?? rolling30dIsoBounds();

  const [{ data: completedPayouts }, { data: upcoming }] = await Promise.all([
    supabase
      .from('wallet_transactions')
      .select('amount')
      .eq('type', 'payout')
      .eq('status', 'completed')
      .gte('created_at', win.start)
      .lte('created_at', win.end),
    supabase
      .from('wallet_transactions')
      .select('amount')
      .eq('type', 'payout')
      .in('status', ['pending', 'processing']),
  ]);

  let payoutsSentCents = 0;
  for (const r of completedPayouts ?? []) {
    payoutsSentCents += Math.round(Number((r as { amount: unknown }).amount) || 0);
  }
  let upcomingPayoutsCents = 0;
  for (const r of upcoming ?? []) {
    upcomingPayoutsCents += Math.round(Number((r as { amount: unknown }).amount) || 0);
  }

  return {
    revenueReceivedCents,
    payoutsSentCents,
    netCashFlowCents: revenueReceivedCents - payoutsSentCents,
    upcomingPayoutsCents,
    payoutQueryLabel: explicit ? explicit.label : win.label,
  };
}

function filterRows(
  rows: BookingRow[],
  filters: ProfitDashboardFilters,
  dayKey: (b: BookingRow) => string,
  teamSet: Set<string> | null
): BookingRow[] {
  const cid = filters.cleanerId?.trim() || null;
  let out = rows.filter((b) => {
    if (isExcludedFromRevenueReporting(b)) return false;
    const dk = dayKey(b);
    return dk ? inDateRange(dk, filters.dateFrom, filters.dateTo) : !filters.dateFrom && !filters.dateTo;
  });
  if (cid) {
    out = out.filter((b) => (b.cleaner_id?.trim() === cid) || teamSet?.has(b.id));
  }
  return out;
}

async function buildCleanerPerformance(
  supabase: SupabaseClient,
  filtered: BookingRow[]
): Promise<CleanerPerformanceRow[]> {
  const bookingIdSet = new Set(filtered.map((b) => b.id));
  if (bookingIdSet.size === 0) return [];

  type PerfAcc = {
    revenue: number;
    cost: number;
    profit: number;
    jobs: number;
    hours: number;
    days: Set<string>;
  };

  const perf = new Map<string, PerfAcc>();

  const addSolo = (cid: string, rev: number, cost: number, prof: number, dayKey: string, hours: number) => {
    const cur = perf.get(cid) ?? {
      revenue: 0,
      cost: 0,
      profit: 0,
      jobs: 0,
      hours: 0,
      days: new Set<string>(),
    };
    cur.revenue += rev;
    cur.cost += cost;
    cur.profit += prof;
    cur.jobs += 1;
    cur.hours += hours;
    if (dayKey) cur.days.add(dayKey);
    perf.set(cid, cur);
  };

  let teamRows: { id: string; booking_id: string }[] = [];
  const { data: teams } = await supabase
    .from('booking_teams')
    .select('id, booking_id')
    .in('booking_id', [...bookingIdSet]);
  teamRows = (teams ?? []) as { id: string; booking_id: string }[];
  const bookingToTeamId = new Map<string, string>();
  for (const t of teamRows) {
    bookingToTeamId.set(t.booking_id as string, t.id as string);
  }

  const teamIds = teamRows.map((t) => t.id as string);
  const membersByTeam = new Map<string, Array<{ cleaner_id: string; earnings: number }>>();
  if (teamIds.length > 0) {
    const { data: members } = await supabase
      .from('booking_team_members')
      .select('cleaner_id, earnings, booking_team_id')
      .in('booking_team_id', teamIds);
    for (const m of members ?? []) {
      const tid = m.booking_team_id as string;
      const list = membersByTeam.get(tid) ?? [];
      list.push({
        cleaner_id: m.cleaner_id as string,
        earnings: Math.round(Number(m.earnings) || 0),
      });
      membersByTeam.set(tid, list);
    }
  }

  for (const b of filtered) {
    const rev = Math.round(Number(b.total_amount) || 0);
    const bookingProfit = profitCentsRealized(b);
    const jh = jobHoursFromBooking(b);
    const dk = dayKeyRealized(b);
    const tid = bookingToTeamId.get(b.id);
    if (tid && membersByTeam.has(tid)) {
      const members = membersByTeam.get(tid)!;
      const totalE = members.reduce((s, x) => s + x.earnings, 0);
      if (totalE <= 0) continue;
      for (const m of members) {
        const share = m.earnings / totalE;
        const cid = m.cleaner_id;
        const cur = perf.get(cid) ?? {
          revenue: 0,
          cost: 0,
          profit: 0,
          jobs: 0,
          hours: 0,
          days: new Set<string>(),
        };
        cur.revenue += Math.round(rev * share);
        cur.cost += m.earnings;
        cur.profit += Math.round(bookingProfit * share);
        cur.jobs += 1;
        cur.hours += jh;
        if (dk) cur.days.add(dk);
        perf.set(cid, cur);
      }
    } else if (b.requires_team !== true) {
      const cid = b.cleaner_id?.trim();
      if (!cid) continue;
      const pay = Math.round(Number(b.earnings_final) || 0);
      addSolo(cid, rev, pay, bookingProfit, dk, jh);
    }
  }

  const ids = [...perf.keys()];
  let nameById = new Map<string, string>();
  if (ids.length > 0) {
    const { data: cleanerRows } = await supabase.from('cleaners').select('id, name').in('id', ids);
    nameById = new Map((cleanerRows ?? []).map((c) => [c.id as string, String(c.name ?? 'Cleaner')]));
  }

  return ids
    .map((cleanerId) => {
      const p = perf.get(cleanerId)!;
      const marginPct = p.revenue > 0 ? (p.profit / p.revenue) * 100 : null;
      const distinctDays = Math.max(1, p.days.size);
      const th = p.hours > 0 ? p.hours : null;
      return {
        cleanerId,
        name: nameById.get(cleanerId) ?? 'Unknown',
        jobCount: p.jobs,
        revenueCents: p.revenue,
        costCents: p.cost,
        profitCents: p.profit,
        marginPct,
        totalHours: Math.round(p.hours * 100) / 100,
        distinctWorkDays: distinctDays,
        profitPerHourCents: th != null ? Math.round(p.profit / th) : null,
        revenuePerHourCents: th != null ? Math.round(p.revenue / th) : null,
        jobsPerDay: p.jobs > 0 ? Math.round((p.jobs / distinctDays) * 100) / 100 : null,
      };
    })
    .sort((a, b) => b.profitCents - a.profitCents);
}

export async function fetchProfitDashboardData(
  supabase: SupabaseClient,
  filters: ProfitDashboardFilters
): Promise<ProfitDashboardData> {
  const mode: ProfitMode = filters.mode === 'projected' ? 'projected' : 'realized';
  const cleanerFilterId = filters.cleanerId?.trim() || null;
  const teamSetForFilter = cleanerFilterId
    ? await loadBookingIdsForTeamCleaner(supabase, cleanerFilterId)
    : null;

  const [rawRealized, rawProjected, rawRefunds] = await Promise.all([
    fetchRealizedBookingRows(supabase, filters),
    fetchProjectedBookingRows(supabase, filters),
    fetchRefundLossRows(supabase, filters),
  ]);

  const realizedFiltered = filterRows(rawRealized, filters, dayKeyRealized, teamSetForFilter);
  const projectedFiltered = filterRows(rawProjected, filters, dayKeyProjected, teamSetForFilter);

  const refundsFiltered = rawRefunds.filter((b) => {
    const dk = dayKeyRealized(b) || dayKeyProjected(b);
    return dk ? inDateRange(dk, filters.dateFrom, filters.dateTo) : !filters.dateFrom && !filters.dateTo;
  });
  let refundsForLoss = refundsFiltered;
  if (cleanerFilterId) {
    const ts = teamSetForFilter ?? new Set<string>();
    refundsForLoss = refundsFiltered.filter(
      (b) => b.cleaner_id?.trim() === cleanerFilterId || ts.has(b.id)
    );
  }

  const realizedAgg = aggregateRealized(realizedFiltered);
  const projectedAgg = aggregateProjected(projectedFiltered);

  const realizedBlock: ProfitSnapshotBlock = {
    summary: realizedAgg.summary,
    daily: realizedAgg.daily,
    byService: realizedAgg.byService,
    bookingCount: realizedFiltered.length,
  };
  const projectedBlock: ProfitSnapshotBlock = {
    summary: projectedAgg.summary,
    daily: projectedAgg.daily,
    byService: projectedAgg.byService,
    bookingCount: projectedFiltered.length,
  };

  const totalLossesCents = refundsForLoss.reduce(
    (s, b) => s + Math.round(Number(b.total_amount) || 0),
    0
  );
  const losses: ProfitLossSummary = {
    refundBookingCount: refundsForLoss.length,
    totalLossesCents,
  };

  const netProfitCents = Math.max(0, realizedAgg.summary.totalProfitCents - totalLossesCents);

  let comparison: ProfitPeriodComparison | null = null;
  if (filters.dateFrom && filters.dateTo) {
    const prev = computePreviousInclusiveDateRange(filters.dateFrom, filters.dateTo);
    if (prev) {
      const prevFilters: ProfitDashboardFilters = {
        ...filters,
        dateFrom: prev.previousFrom,
        dateTo: prev.previousTo,
      };
      const prevRows = filterRows(
        await fetchRealizedBookingRows(supabase, prevFilters),
        prevFilters,
        dayKeyRealized,
        cleanerFilterId ? await loadBookingIdsForTeamCleaner(supabase, cleanerFilterId) : null
      );
      const prevAgg = aggregateRealized(prevRows);
      const curS = realizedAgg.summary;
      const pS = prevAgg.summary;
      comparison = {
        previousFrom: prev.previousFrom,
        previousTo: prev.previousTo,
        revenueGrowthPct: growthPct(curS.totalRevenueCents, pS.totalRevenueCents),
        profitGrowthPct: growthPct(curS.totalProfitCents, pS.totalProfitCents),
        marginDeltaPctPoints:
          curS.profitMargin != null && pS.profitMargin != null
            ? (curS.profitMargin - pS.profitMargin) * 100
            : null,
      };
    }
  }

  const alerts = buildProfitAlerts({
    byService: realizedAgg.byService.map((r) => ({
      serviceType: r.serviceType,
      marginPct: r.marginPct,
      revenueCents: r.revenueCents,
    })),
    bookingCostSamples: realizedAgg.bookingCostSamples,
    daily: realizedAgg.daily,
  });

  const serviceInsights = buildServiceOptimizationInsights(
    realizedAgg.byService.map((r) => ({
      serviceType: r.serviceType,
      revenueCents: r.revenueCents,
      profitCents: r.profitCents,
      marginPct: r.marginPct,
    }))
  );

  const activeSummary = mode === 'projected' ? projectedAgg.summary : realizedAgg.summary;
  const activeDaily = mode === 'projected' ? projectedAgg.daily : realizedAgg.daily;
  const activeByService = mode === 'projected' ? projectedAgg.byService : realizedAgg.byService;
  const activeBookingCount = mode === 'projected' ? projectedFiltered.length : realizedFiltered.length;

  const bookingSample = [...realizedFiltered]
    .sort((a, b) => sortKeyNewestFirst(b).localeCompare(sortKeyNewestFirst(a)))
    .slice(0, AI_BOOKING_SAMPLE_CAP);

  const perBookingResults = bookingSample.map((b) =>
    analyzeBookingOptimization({
      booking: {
        total_amount: Math.round(Number(b.total_amount) || 0),
        company_profit_cents: profitCentsRealized(b),
        earnings_final: Math.round(Number(b.earnings_final) || 0),
        service_type: (b.service_type || 'Unknown').trim() || 'Unknown',
        team_size: Math.max(1, Math.round(Number(b.team_size) || 1)),
        total_hours: Math.max(0.25, Number(b.total_hours) > 0 ? Number(b.total_hours) : 1),
      },
    })
  );

  const servicePortfolioResult = analyzeServicePortfolioOptimization(
    realizedAgg.byService.map((r) => ({
      serviceType: r.serviceType,
      revenueCents: r.revenueCents,
      profitCents: r.profitCents,
      marginPct: r.marginPct,
    }))
  );

  const mergedOptimization = mergeOptimizationResults([...perBookingResults, servicePortfolioResult]);

  const bookingIdSet = new Set(realizedFiltered.map((b) => b.id));
  const cleanerAcc = new Map<string, { earnings: number; jobs: number }>();

  let teamRows: { id: string; booking_id: string }[] = [];
  if (bookingIdSet.size > 0) {
    const { data: tr } = await supabase
      .from('booking_teams')
      .select('id, booking_id')
      .in('booking_id', [...bookingIdSet]);
    teamRows = (tr ?? []) as { id: string; booking_id: string }[];
  }
  const teamIdToBooking = new Map(teamRows.map((t) => [t.id as string, t.booking_id as string]));

  if (teamRows.length > 0) {
    const teamIds = teamRows.map((t) => t.id as string);
    const { data: members } = await supabase
      .from('booking_team_members')
      .select('cleaner_id, earnings, booking_team_id')
      .in('booking_team_id', teamIds);

    for (const m of members ?? []) {
      const bid = teamIdToBooking.get(m.booking_team_id as string);
      if (!bid || !bookingIdSet.has(bid)) continue;
      const cid = m.cleaner_id as string;
      const e = Math.round(Number(m.earnings) || 0);
      const cur = cleanerAcc.get(cid) ?? { earnings: 0, jobs: 0 };
      cur.earnings += e;
      cur.jobs += 1;
      cleanerAcc.set(cid, cur);
    }
  }

  for (const b of realizedFiltered) {
    if (b.requires_team === true) continue;
    const cid = b.cleaner_id?.trim();
    if (!cid) continue;
    const pay = Math.round(Number(b.earnings_final) || 0);
    const cur = cleanerAcc.get(cid) ?? { earnings: 0, jobs: 0 };
    cur.earnings += pay;
    cur.jobs += 1;
    cleanerAcc.set(cid, cur);
  }

  const cleanerIds = [...cleanerAcc.keys()];
  let nameById = new Map<string, string>();
  if (cleanerIds.length > 0) {
    const { data: cleanerRows } = await supabase.from('cleaners').select('id, name').in('id', cleanerIds);
    nameById = new Map((cleanerRows ?? []).map((c) => [c.id as string, String(c.name ?? 'Cleaner')]));
  }

  const cleaners: ProfitCleanerRow[] = cleanerIds
    .map((cleanerId) => {
      const acc = cleanerAcc.get(cleanerId)!;
      const jobCount = acc.jobs;
      const avg = jobCount > 0 ? Math.round(acc.earnings / jobCount) : 0;
      return {
        cleanerId,
        name: nameById.get(cleanerId) ?? 'Unknown',
        totalEarningsCents: acc.earnings,
        jobCount,
        avgEarningsCents: avg,
      };
    })
    .sort((a, b) => b.totalEarningsCents - a.totalEarningsCents);

  const cleanerPerformance = await buildCleanerPerformance(supabase, realizedFiltered);

  const cashFlow = await fetchCashFlowAggregates(
    supabase,
    realizedAgg.summary.totalRevenueCents,
    filters.dateFrom ?? null,
    filters.dateTo ?? null
  );

  const { data: liabilityView } = await supabase.from('v_cleaner_liability_outstanding').select('*').maybeSingle();

  const payoutWindowDays = 30;
  const since = new Date();
  since.setDate(since.getDate() - payoutWindowDays);
  const { data: payoutStatusRows } = await supabase
    .from('wallet_transactions')
    .select('status')
    .eq('type', 'payout')
    .gte('created_at', since.toISOString());

  const { data: cleanerOptRows } = await supabase.from('cleaners').select('id, name').order('name');
  const cleanerOptions = (cleanerOptRows ?? []).map((c) => ({
    id: c.id as string,
    name: String(c.name ?? 'Cleaner'),
  }));

  let completedCount = 0;
  let failedCount = 0;
  let processingCount = 0;
  for (const r of payoutStatusRows ?? []) {
    const s = String(r.status ?? '');
    if (s === 'completed') completedCount += 1;
    else if (s === 'failed') failedCount += 1;
    else if (s === 'processing') processingCount += 1;
  }

  return {
    mode,
    summary: activeSummary,
    daily: activeDaily,
    byService: activeByService,
    cleaners,
    realized: realizedBlock,
    projected: projectedBlock,
    losses,
    netProfitCents,
    comparison,
    cleanerPerformance,
    alerts,
    optimization: {
      merged: mergedOptimization,
      bookingSamplesAnalyzed: bookingSample.length,
      autoOptimizationEnabled: isAutoOptimizationEnabled(),
      autoOptimizationPolicy: describeAutoOptimizationPolicy(),
    },
    cleanerWalletLiability: {
      totalLiabilityCents: Math.round(Number(liabilityView?.total_cents ?? 0)) || 0,
      walletRowCount: Math.round(Number(liabilityView?.wallet_row_count ?? 0)) || 0,
    },
    payoutMetrics: {
      completedCount,
      failedCount,
      processingCount,
      windowDays: payoutWindowDays,
    },
    cashFlow,
    serviceInsights,
    cleanerOptions,
    meta: {
      bookingCount: activeBookingCount,
      filters: { ...filters, mode },
    },
  };
}
