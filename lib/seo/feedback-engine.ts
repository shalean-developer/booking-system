import { getCachedGscComparisonData, type GscPageRow } from "@/lib/seo/gsc-cache";
import { createServiceClient } from "@/lib/supabase-server";

type SeoAction = "BOOST_CTR" | "IMPROVE_CONTENT" | "ADD_LINKS" | "FIX_INDEXING";

type PendingActionLog = {
  page?: string;
  action?: SeoAction;
  before?: {
    ctr?: number;
    position?: number;
  };
  after?: {
    ctr?: number;
    position?: number;
    clicks?: number;
    impressions?: number;
  } | null;
};

type SeoLogRow = {
  id?: string | number;
  created_at?: string | null;
  details?: PendingActionLog[] | null;
};

export type SeoFeedbackRow = {
  page: string;
  action: SeoAction;
  ctrBefore: number;
  ctrAfter: number;
  positionBefore: number;
  positionAfter: number;
  clicksBefore: number;
  clicksAfter: number;
  clicksChange: number;
  success: boolean;
};

export type SeoFeedbackSummary = {
  logsProcessed: number;
  rowsEvaluated: number;
  successes: number;
  feedbackRows: SeoFeedbackRow[];
};

function normalizePageKey(page: string): string {
  const trimmed = page.trim();
  if (!trimmed) return "";
  try {
    const parsed = new URL(trimmed);
    let pathname = parsed.pathname.toLowerCase();
    if (pathname.length > 1 && pathname.endsWith("/")) pathname = pathname.slice(0, -1);
    return pathname || "/";
  } catch {
    let pathOnly = trimmed.split("?")[0].toLowerCase();
    if (!pathOnly.startsWith("/")) pathOnly = `/${pathOnly}`;
    if (pathOnly.length > 1 && pathOnly.endsWith("/")) pathOnly = pathOnly.slice(0, -1);
    return pathOnly || "/";
  }
}

function toMetricMap(rows: GscPageRow[]): Map<string, GscPageRow> {
  const map = new Map<string, GscPageRow>();
  for (const row of rows) {
    const key = Array.isArray(row.keys) && row.keys[0] ? normalizePageKey(String(row.keys[0])) : "";
    if (!key) continue;
    map.set(key, row);
  }
  return map;
}

function num(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function evaluateSuccess(input: {
  action: SeoAction;
  ctrBefore: number;
  ctrAfter: number;
  positionBefore: number;
  positionAfter: number;
  impressionsBefore: number;
  impressionsAfter: number;
}): boolean {
  if (input.action === "BOOST_CTR") {
    return input.ctrAfter > input.ctrBefore;
  }
  if (input.action === "IMPROVE_CONTENT") {
    return input.positionAfter > 0 && input.positionAfter < input.positionBefore;
  }
  if (input.action === "ADD_LINKS") {
    return input.impressionsAfter > input.impressionsBefore;
  }
  // FIX_INDEXING: treat any meaningful lift as success.
  return (
    input.impressionsAfter > input.impressionsBefore ||
    input.ctrAfter > input.ctrBefore ||
    (input.positionAfter > 0 && input.positionAfter < input.positionBefore)
  );
}

export async function runSeoFeedbackCycle(): Promise<SeoFeedbackSummary> {
  const now = Date.now();
  const sevenDaysAgoIso = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  const supabase = createServiceClient();

  const { data: rawLogs } = await supabase
    .from("seo_logs")
    .select("id,created_at,details")
    .lte("created_at", sevenDaysAgoIso)
    .order("created_at", { ascending: true })
    .limit(200);

  const candidateLogs = ((rawLogs as SeoLogRow[] | null) ?? []).filter((log) =>
    Array.isArray(log.details)
  );

  if (candidateLogs.length === 0) {
    return {
      logsProcessed: 0,
      rowsEvaluated: 0,
      successes: 0,
      feedbackRows: [],
    };
  }

  // 1) Fetch new GSC data and comparison baseline windows.
  const { current, previous } = await getCachedGscComparisonData();
  const currentMap = toMetricMap(current);
  const previousMap = toMetricMap(previous);

  const feedbackRows: SeoFeedbackRow[] = [];
  let logsProcessed = 0;

  for (const log of candidateLogs) {
    const details = Array.isArray(log.details) ? log.details : [];
    const updatedDetails: PendingActionLog[] = [];
    let touched = false;

    for (const item of details) {
      const page = normalizePageKey(String(item.page ?? ""));
      const action = item.action;
      if (!page || !action) {
        updatedDetails.push(item);
        continue;
      }

      const currentRow = currentMap.get(page);
      const previousRow = previousMap.get(page);
      const ctrBefore = num(item.before?.ctr, num(previousRow?.ctr, 0));
      const ctrAfter = num(currentRow?.ctr, ctrBefore);
      const positionBefore = num(item.before?.position, num(previousRow?.position, 0));
      const positionAfter = num(currentRow?.position, positionBefore);
      const clicksBefore = num(previousRow?.clicks, 0);
      const clicksAfter = num(currentRow?.clicks, clicksBefore);
      const impressionsBefore = num(previousRow?.impressions, 0);
      const impressionsAfter = num(currentRow?.impressions, impressionsBefore);
      const success = evaluateSuccess({
        action,
        ctrBefore,
        ctrAfter,
        positionBefore,
        positionAfter,
        impressionsBefore,
        impressionsAfter,
      });

      feedbackRows.push({
        page,
        action,
        ctrBefore,
        ctrAfter,
        positionBefore,
        positionAfter,
        clicksBefore,
        clicksAfter,
        clicksChange: clicksAfter - clicksBefore,
        success,
      });

      updatedDetails.push({
        ...item,
        after: {
          ctr: ctrAfter,
          position: positionAfter,
          clicks: clicksAfter,
          impressions: impressionsAfter,
        },
      });
      touched = true;
    }

    if (touched && log.id !== undefined) {
      await supabase
        .from("seo_logs")
        .update({
          details: updatedDetails,
        })
        .eq("id", log.id);
      logsProcessed += 1;
    }
  }

  const successes = feedbackRows.filter((row) => row.success).length;

  // 3) Store feedback rows in seo_logs.
  await supabase.from("seo_logs").insert({
    pages_analyzed: feedbackRows.length,
    pages_optimized: successes,
    before_score: 0,
    after_score: 0,
    details: feedbackRows.map((row) => ({
      page: row.page,
      action: row.action,
      ctrBefore: row.ctrBefore,
      ctrAfter: row.ctrAfter,
      positionBefore: row.positionBefore,
      positionAfter: row.positionAfter,
      success: row.success,
      clicksBefore: row.clicksBefore,
      clicksAfter: row.clicksAfter,
      clicksChange: row.clicksChange,
    })),
    created_at: new Date().toISOString(),
  });

  return {
    logsProcessed,
    rowsEvaluated: feedbackRows.length,
    successes,
    feedbackRows,
  };
}
