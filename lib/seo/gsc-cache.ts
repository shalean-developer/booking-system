import { google } from "googleapis";
import { createServiceClient } from "@/lib/supabase-server";

export type GscPageRow = {
  keys?: string[];
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
  clicksChange?: number;
  impressionsChange?: number;
  positionChange?: number;
  ctrChange?: number;
};

type GscPageCacheRow = {
  page_slug: string;
  clicks: number | null;
  impressions: number | null;
  ctr: number | null;
  position: number | null;
  updated_at: string | null;
};

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
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

function aggregateNormalizedPageRows(rows: GscPageRow[]): GscPageRow[] {
  const byPage = new Map<string, { clicks: number; impressions: number; weightedPositionSum: number }>();
  for (const row of rows) {
    const rawKey = Array.isArray(row.keys) && row.keys.length > 0 ? String(row.keys[0]) : "";
    const key = normalizeUrl(rawKey);
    if (!key) continue;
    if (!key.includes("/growth/local/")) continue;
    const clicks = Number(row.clicks ?? 0);
    const impressions = Number(row.impressions ?? 0);
    const position = Number(row.position ?? 0);
    const existing = byPage.get(key) ?? { clicks: 0, impressions: 0, weightedPositionSum: 0 };
    existing.clicks += Number.isFinite(clicks) ? clicks : 0;
    existing.impressions += Number.isFinite(impressions) ? impressions : 0;
    existing.weightedPositionSum +=
      (Number.isFinite(position) ? position : 0) * (Number.isFinite(impressions) ? impressions : 0);
    byPage.set(key, existing);
  }
  return Array.from(byPage.entries()).map(([key, agg]) => ({
    keys: [key],
    clicks: agg.clicks,
    impressions: agg.impressions,
    ctr: agg.impressions > 0 ? agg.clicks / agg.impressions : 0,
    position: agg.impressions > 0 ? agg.weightedPositionSum / agg.impressions : 0,
  }));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function queryWithRetry(
  webmasters: ReturnType<typeof google.webmasters>,
  siteUrl: string,
  requestBody: Record<string, unknown>
) {
  const backoffMs = [1000, 2000, 4000];
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await webmasters.searchanalytics.query({ siteUrl, requestBody });
    } catch (error) {
      lastError = error;
      if (attempt < backoffMs.length) await sleep(backoffMs[attempt]);
    }
  }
  throw lastError;
}

async function fetchFreshGscPageData(): Promise<GscPageRow[]> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 6);
  return fetchFreshGscPageDataForRange(
    startDate.toISOString().split("T")[0],
    endDate.toISOString().split("T")[0]
  );
}

async function fetchFreshGscPageDataForRange(startDate: string, endDate: string): Promise<GscPageRow[]> {
  const credentials = JSON.parse(process.env.GSC_CREDENTIALS || "{}");
  if (!credentials?.client_email || !credentials?.private_key) return [];

  const client = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
  });
  const webmasters = google.webmasters({ version: "v3", auth: client });
  const configuredSite = process.env.GSC_SITE_URL?.trim();
  const candidateSites = Array.from(
    new Set([configuredSite, "https://shalean.co.za", "sc-domain:shalean.co.za"].filter(Boolean) as string[])
  );

  let bestPartial: GscPageRow[] = [];
  for (const siteUrl of candidateSites) {
    try {
      let startRow = 0;
      const batchSize = 1000;
      const allRows: GscPageRow[] = [];
      while (true) {
        try {
          const response = await queryWithRetry(webmasters, siteUrl, {
            startDate,
            endDate,
            dimensions: ["page"],
            rowLimit: batchSize,
            startRow,
            dimensionFilterGroups: [
              {
                filters: [{ dimension: "page", operator: "contains", expression: "/growth/local/" }],
              },
            ],
          });
          const rows = (response.data.rows as GscPageRow[] | undefined) ?? [];
          if (rows.length === 0) break;
          allRows.push(...rows);
          if (rows.length < batchSize) break;
          startRow += batchSize;
        } catch {
          break;
        }
      }
      if (allRows.length > bestPartial.length) bestPartial = allRows;
      if (allRows.length > 0) return aggregateNormalizedPageRows(allRows);
    } catch {
      // try next site
    }
  }
  return aggregateNormalizedPageRows(bestPartial);
}

function toMetricMap(rows: GscPageRow[]): Map<string, GscPageRow> {
  const map = new Map<string, GscPageRow>();
  for (const row of rows) {
    const key = Array.isArray(row.keys) && row.keys[0] ? String(row.keys[0]) : "";
    if (!key) continue;
    map.set(key, row);
  }
  return map;
}

function withComparisonDeltas(baseRows: GscPageRow[], compareRows: GscPageRow[]): GscPageRow[] {
  const compareMap = toMetricMap(compareRows);
  return baseRows.map((row) => {
    const key = Array.isArray(row.keys) && row.keys[0] ? String(row.keys[0]) : "";
    const previous = compareMap.get(key);
    const clicks = Number(row.clicks ?? 0);
    const impressions = Number(row.impressions ?? 0);
    const ctr = Number(row.ctr ?? 0);
    const position = Number(row.position ?? 0);
    const prevClicks = Number(previous?.clicks ?? 0);
    const prevImpressions = Number(previous?.impressions ?? 0);
    const prevCtr = Number(previous?.ctr ?? 0);
    const prevPosition = Number(previous?.position ?? 0);

    return {
      ...row,
      clicksChange: clicks - prevClicks,
      impressionsChange: impressions - prevImpressions,
      positionChange: position - prevPosition,
      ctrChange: ctr - prevCtr,
    };
  });
}

function mapCachedRows(rows: GscPageCacheRow[]): GscPageRow[] {
  return rows
    .filter((row) => (row.page_slug ?? "").includes("/growth/local/"))
    .map((row) => ({
      keys: [row.page_slug],
      clicks: row.clicks ?? 0,
      impressions: row.impressions ?? 0,
      ctr: row.ctr ?? 0,
      position: row.position ?? 0,
    }));
}

export async function getCachedGscData(): Promise<GscPageRow[]> {
  const supabase = createServiceClient();
  const { data: existingRows } = await supabase
    .from("gsc_pages")
    .select("page_slug,clicks,impressions,ctr,position,updated_at")
    .order("updated_at", { ascending: false })
    .limit(10000);

  const cached = (existingRows as GscPageCacheRow[] | null) ?? [];
  const newest = cached[0]?.updated_at ? new Date(cached[0].updated_at).getTime() : 0;
  const isFresh = newest > 0 && Date.now() - newest < CACHE_TTL_MS;
  if (isFresh) {
    return mapCachedRows(cached);
  }

  const freshRows = await fetchFreshGscPageData();
  if (freshRows.length === 0) {
    return mapCachedRows(cached);
  }

  await supabase.from("gsc_pages").delete().not("page_slug", "is", null);
  await supabase.from("gsc_pages").insert(
    freshRows
      .filter((row) => Array.isArray(row.keys) && row.keys[0])
      .filter((row) => String(row.keys![0]).includes("/growth/local/"))
      .map((row) => ({
        page_slug: String(row.keys![0]),
        clicks: row.clicks ?? 0,
        impressions: row.impressions ?? 0,
        ctr: row.ctr ?? 0,
        position: row.position ?? 0,
        updated_at: new Date().toISOString(),
      }))
  );
  return freshRows;
}

export async function getCachedGscComparisonData(): Promise<{
  current: GscPageRow[];
  previous: GscPageRow[];
}> {
  const currentEnd = new Date();
  const currentStart = new Date(currentEnd);
  currentStart.setDate(currentEnd.getDate() - 6);

  const previousEnd = new Date(currentStart);
  previousEnd.setDate(previousEnd.getDate() - 1);
  const previousStart = new Date(previousEnd);
  previousStart.setDate(previousEnd.getDate() - 6);

  const [currentRaw, previousRaw] = await Promise.all([
    fetchFreshGscPageDataForRange(
      currentStart.toISOString().split("T")[0],
      currentEnd.toISOString().split("T")[0]
    ),
    fetchFreshGscPageDataForRange(
      previousStart.toISOString().split("T")[0],
      previousEnd.toISOString().split("T")[0]
    ),
  ]);

  const current = withComparisonDeltas(currentRaw, previousRaw);
  const previous = withComparisonDeltas(previousRaw, currentRaw);

  return { current, previous };
}

