import { google } from "googleapis";
import { NextResponse } from "next/server";

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  try {
    const parsed = new URL(trimmed);
    let pathname = parsed.pathname.toLowerCase();
    if (pathname.length > 1 && pathname.endsWith("/")) {
      pathname = pathname.slice(0, -1);
    }
    return pathname || "/";
  } catch {
    let pathOnly = trimmed.split("?")[0].toLowerCase();
    if (!pathOnly.startsWith("/")) pathOnly = `/${pathOnly}`;
    if (pathOnly.length > 1 && pathOnly.endsWith("/")) {
      pathOnly = pathOnly.slice(0, -1);
    }
    return pathOnly || "/";
  }
}

function aggregateNormalizedPageRows(rows: any[]): any[] {
  const byPage = new Map<
    string,
    { clicks: number; impressions: number; weightedPositionSum: number }
  >();

  for (const row of rows) {
    const rawKey = Array.isArray(row?.keys) && row.keys.length > 0 ? String(row.keys[0]) : "";
    const key = normalizeUrl(rawKey);
    if (!key) continue;
    const clicks = Number(row?.clicks ?? 0);
    const impressions = Number(row?.impressions ?? 0);
    const position = Number(row?.position ?? 0);

    const existing = byPage.get(key) ?? {
      clicks: 0,
      impressions: 0,
      weightedPositionSum: 0,
    };
    existing.clicks += Number.isFinite(clicks) ? clicks : 0;
    existing.impressions += Number.isFinite(impressions) ? impressions : 0;
    existing.weightedPositionSum +=
      (Number.isFinite(position) ? position : 0) * (Number.isFinite(impressions) ? impressions : 0);
    byPage.set(key, existing);
  }

  return Array.from(byPage.entries()).map(([key, agg]) => {
    const clicks = agg.clicks;
    const impressions = agg.impressions;
    const ctr = impressions > 0 ? clicks / impressions : 0;
    const position = impressions > 0 ? agg.weightedPositionSum / impressions : 0;
    return {
      keys: [key],
      clicks,
      impressions,
      ctr,
      position,
    };
  });
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
      return await webmasters.searchanalytics.query({
        siteUrl,
        requestBody,
      });
    } catch (error) {
      lastError = error;
      if (attempt < backoffMs.length) {
        await sleep(backoffMs[attempt]);
      }
    }
  }

  throw lastError;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dimension = searchParams.get("dimension") === "page" ? "page" : "query";
    const rowLimitRaw = Number(searchParams.get("rowLimit") ?? "10");
    const rowLimit = Number.isFinite(rowLimitRaw)
      ? Math.max(1, Math.min(1000, rowLimitRaw))
      : 10;
    const pageContains = searchParams.get("pageContains")?.trim();

    const credentials = JSON.parse(process.env.GSC_CREDENTIALS!);
    const client = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ["https://www.googleapis.com/auth/webmasters.readonly"]
    });

    const webmasters = google.webmasters({
      version: "v3",
      auth: client
    });

    const configuredSite = process.env.GSC_SITE_URL?.trim();
    const candidateSites = Array.from(
      new Set(
        [configuredSite, "https://shalean.co.za", "sc-domain:shalean.co.za"].filter(
          Boolean
        ) as string[]
      )
    );

    let responseData: any = null;
    let lastError: string | null = null;
    let partialDataUsed = false;

    for (const siteUrl of candidateSites) {
      try {
        if (dimension === "page") {
          let startRow = 0;
          const batchSize = 1000;
          const allRows: any[] = [];

          while (true) {
            try {
              const queryResponse = await queryWithRetry(webmasters, siteUrl, {
                startDate: "2024-01-01",
                endDate: new Date().toISOString().split("T")[0],
                dimensions: [dimension],
                rowLimit: batchSize,
                startRow,
                ...(pageContains && {
                  dimensionFilterGroups: [
                    {
                      filters: [
                        {
                          dimension: "page",
                          operator: "contains",
                          expression: pageContains,
                        },
                      ],
                    },
                  ],
                }),
              });

              const rows = (queryResponse.data?.rows as any[] | undefined) ?? [];
              if (rows.length === 0) break;
              allRows.push(...rows);
              if (rows.length < batchSize) break;
              startRow += batchSize;
            } catch (error: any) {
              console.error("[seo/search-console] page batch failed after retries", {
                siteUrl,
                startRow,
                message: error?.message ?? "Unknown GSC error",
              });
              partialDataUsed = true;
              break;
            }
          }

          responseData = { rows: allRows };
        } else {
          try {
            const queryResponse = await queryWithRetry(webmasters, siteUrl, {
              startDate: "2024-01-01",
              endDate: new Date().toISOString().split("T")[0],
              dimensions: [dimension],
              rowLimit,
            });
            responseData = queryResponse.data;
          } catch (error: any) {
            console.error("[seo/search-console] query failed after retries", {
              siteUrl,
              message: error?.message ?? "Unknown GSC error",
            });
            partialDataUsed = true;
            responseData = { rows: [] };
          }
        }
        break;
      } catch (error: any) {
        lastError = error?.message ?? "Unknown Search Console error";
      }
    }

    if (!responseData) {
      console.error("[seo/search-console] returning empty response after failures", {
        message: lastError ?? "Unable to query Search Console for configured site URLs.",
      });
      responseData = { rows: [] };
    }

    if (dimension === "page" && Array.isArray(responseData.rows)) {
      responseData.rows = aggregateNormalizedPageRows(responseData.rows);
    }

    return NextResponse.json({
      ...responseData,
      partial: partialDataUsed,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
