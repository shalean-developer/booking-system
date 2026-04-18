import type {
  ProfitDashboardData,
  ProfitDailyRow,
  ProfitServiceRow,
  ProfitCleanerRow,
  CleanerPerformanceRow,
} from '@/lib/admin/profit-dashboard-data';

function mapSnapshot(block: ProfitDashboardData['realized']) {
  return {
    summary: {
      totalRevenue: block.summary.totalRevenueCents,
      totalCost: block.summary.totalCostCents,
      totalProfit: block.summary.totalProfitCents,
      profitMargin: block.summary.profitMargin,
    },
    bookingCount: block.bookingCount,
    breakdown: {
      byService: block.byService.map((r: ProfitServiceRow) => ({
        serviceType: r.serviceType,
        revenue: r.revenueCents,
        profit: r.profitCents,
        marginPct: r.marginPct,
      })),
      byDay: block.daily.map((r: ProfitDailyRow) => ({
        date: r.date,
        revenue: r.revenueCents,
        profit: r.profitCents,
        bookings: r.bookings,
      })),
    },
  };
}

/**
 * GET /api/admin/profit — amounts are integer cents unless noted; profitMargin 0–1.
 */
export function profitDashboardToApiJson(data: ProfitDashboardData) {
  const {
    mode,
    summary,
    daily,
    byService,
    cleaners,
    realized,
    projected,
    losses,
    netProfitCents,
    comparison,
    cleanerPerformance,
    alerts,
    cashFlow,
    serviceInsights,
    meta,
  } = data;

  return {
    ok: true as const,
    mode,
    active: {
      summary: {
        totalRevenue: summary.totalRevenueCents,
        totalCost: summary.totalCostCents,
        totalProfit: summary.totalProfitCents,
        profitMargin: summary.profitMargin,
      },
      bookingsCount: meta.bookingCount,
      breakdown: {
        byService: byService.map((r: ProfitServiceRow) => ({
          serviceType: r.serviceType,
          revenue: r.revenueCents,
          profit: r.profitCents,
          marginPct: r.marginPct,
        })),
        byDay: daily.map((r: ProfitDailyRow) => ({
          date: r.date,
          revenue: r.revenueCents,
          profit: r.profitCents,
          bookings: r.bookings,
        })),
        byCleaner: cleaners.map((r: ProfitCleanerRow) => ({
          cleanerId: r.cleanerId,
          name: r.name,
          totalEarnings: r.totalEarningsCents,
          jobCount: r.jobCount,
          avgEarnings: r.avgEarningsCents,
        })),
      },
    },
    realized: mapSnapshot(realized),
    projected: mapSnapshot(projected),
    losses: {
      refundBookingCount: losses.refundBookingCount,
      totalLosses: losses.totalLossesCents,
    },
    netProfit: netProfitCents,
    growth: comparison
      ? {
          previousFrom: comparison.previousFrom,
          previousTo: comparison.previousTo,
          revenueGrowthPct: comparison.revenueGrowthPct,
          profitGrowthPct: comparison.profitGrowthPct,
          marginDeltaPctPoints: comparison.marginDeltaPctPoints,
        }
      : null,
    cleanerPerformance: cleanerPerformance.map((r: CleanerPerformanceRow) => ({
      cleanerId: r.cleanerId,
      name: r.name,
      jobCount: r.jobCount,
      revenue: r.revenueCents,
      cost: r.costCents,
      profit: r.profitCents,
      marginPct: r.marginPct,
      totalHours: r.totalHours,
      distinctWorkDays: r.distinctWorkDays,
      profitPerHour: r.profitPerHourCents,
      revenuePerHour: r.revenuePerHourCents,
      jobsPerDay: r.jobsPerDay,
    })),
    cashFlow: {
      revenueReceived: cashFlow.revenueReceivedCents,
      payoutsSent: cashFlow.payoutsSentCents,
      netCashFlow: cashFlow.netCashFlowCents,
      upcomingPayouts: cashFlow.upcomingPayoutsCents,
      payoutQueryLabel: cashFlow.payoutQueryLabel,
    },
    serviceInsights: serviceInsights.map((s) => ({
      serviceType: s.serviceType,
      marginPct: s.marginPct,
      revenueSharePct: s.revenueSharePct,
      suggestedPriceIncreasePct: s.suggestedPriceIncreasePct,
      insight: s.insight,
    })),
    alerts,
    filters: meta.filters,
  };
}
