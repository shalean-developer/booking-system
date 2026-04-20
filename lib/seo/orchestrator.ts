import { revalidatePath } from "next/cache";
import {
  LOCAL_SEO_LOCATIONS,
  LOCAL_SEO_SERVICE_IDS,
  buildLocalSeoCanonical,
  buildLocalSeoFaq,
  crossServiceLinksForArea,
  generateLocalUseCases,
  generatePricingContext,
  getLocalSeoLocation,
  getServicePageMeta,
  nearbyLocationLinks,
  sameRegionLocationLinks,
  whyChooseSection,
} from "@/lib/growth/local-seo-data";
import type { LocalSeoServiceId } from "@/lib/growth/local-seo-types";
import { SITE_URL } from "@/lib/metadata";
import { auditPage, type AuditResult } from "@/lib/seo/audit-engine";
import { getCachedGscData } from "@/lib/seo/gsc-cache";
import { buildOptimizationActions, type GscPageData } from "@/lib/seo/decision-engine";
import { optimizePages } from "@/lib/seo/optimization-engine";
import { getTopResults } from "@/lib/seo/serp-client";
import { fetchCompetitorPage, type CompetitorPageData } from "@/lib/seo/competitor-content-fetcher";
import { analyzeGap } from "@/lib/seo/gap-analysis-engine";
import { createServiceClient } from "@/lib/supabase-server";

type GscRow = {
  keys?: string[];
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
};

type SeoCycleSummary = {
  pagesAnalyzed: number;
  decisionsGenerated: number;
  decisionsSelected: number;
  pagesSkippedRecent: number;
  pagesOptimized: number;
  avgScoreBefore: number;
  avgScoreAfter: number;
};

type RunSeoOptimizationOptions = {
  maxPagesPerRun?: number;
  skipRecentlyUpdatedDays?: number;
};

type SeoPatchUpdatedRow = {
  page_slug: string;
  updated_at: string | null;
};

type CandidatePage = {
  path: string;
  url: string;
  service: LocalSeoServiceId;
  areaSlug: string;
  impressions: number;
  ctr: number;
  position: number;
  inSitemap: boolean;
  audit: AuditResult;
};

function estimateWordCount(input: string): number {
  return input
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return round2(values.reduce((a, b) => a + b, 0) / values.length);
}

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

function aggregateNormalizedPageRows(rows: GscRow[]): GscRow[] {
  const byPage = new Map<
    string,
    { clicks: number; impressions: number; weightedPositionSum: number }
  >();

  for (const row of rows) {
    const rawKey = Array.isArray(row.keys) && row.keys.length > 0 ? String(row.keys[0]) : "";
    const key = normalizeUrl(rawKey);
    if (!key) continue;
    if (!key.includes("/growth/local/")) continue;

    const clicks = Number(row.clicks ?? 0);
    const impressions = Number(row.impressions ?? 0);
    const position = Number(row.position ?? 0);

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
    const impressions = agg.impressions;
    const clicks = agg.clicks;
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

function parseGrowthLocalPath(path: string): { service: LocalSeoServiceId; areaSlug: string } | null {
  try {
    const parts = normalizeUrl(path).split("/").filter(Boolean);
    if (parts.length < 4 || parts[0] !== "growth" || parts[1] !== "local") return null;
    const service = parts[2];
    const areaSlug = parts[3];
    if (!(LOCAL_SEO_SERVICE_IDS as string[]).includes(service)) return null;
    return { service: service as LocalSeoServiceId, areaSlug };
  } catch {
    return null;
  }
}

function buildPageAuditData(service: LocalSeoServiceId, areaSlug: string, url: string): {
  title: string;
  description: string;
  intro: string;
  faq: ReturnType<typeof buildLocalSeoFaq>;
  internalLinks: string[];
  audit: AuditResult;
} {
  const location = getLocalSeoLocation(areaSlug);
  if (!location) {
    throw new Error(`Unknown location slug: ${areaSlug}`);
  }
  const meta = getServicePageMeta(service, location.displayName);
  const faq = buildLocalSeoFaq(location, service);
  const intro = location.localizedIntro;
  const why = whyChooseSection(location, service);
  const useCases = generateLocalUseCases(service, location);
  const pricingContext = generatePricingContext(service, location);
  const internalLinks = [
    ...crossServiceLinksForArea(areaSlug, service).map((x) => x.href),
    ...nearbyLocationLinks(location).map((x) => x.href),
    ...sameRegionLocationLinks(location, service).map((x) => x.href),
  ];
  const wordCount = estimateWordCount(
    [intro, ...why, ...useCases, pricingContext, ...faq.map((x) => `${x.question} ${x.answer}`)].join(" ")
  );
  const audit = auditPage({
    url,
    title: meta.metaTitle(location.displayName),
    description: meta.metaDescription(location.displayName),
    introText: intro,
    hasSchema: true,
    hasFAQ: faq.length > 0,
    wordCount,
    internalLinks: internalLinks.length,
  });
  return {
    title: meta.metaTitle(location.displayName),
    description: meta.metaDescription(location.displayName),
    intro,
    faq,
    internalLinks,
    audit,
  };
}

function buildSitemapLocalPages(): string[] {
  const urls: string[] = [];
  for (const service of LOCAL_SEO_SERVICE_IDS) {
    for (const location of LOCAL_SEO_LOCATIONS) {
      urls.push(normalizeUrl(buildLocalSeoCanonical(service, location.slug)));
    }
  }
  return urls;
}

function extractKeywordFromPath(path: string): string {
  const parts = normalizeUrl(path).split("/").filter(Boolean);
  const service = parts[2]?.replace(/-/g, " ").trim() ?? "";
  const area = parts[3]?.replace(/-/g, " ").trim() ?? "";
  return `${service} ${area}`.trim();
}

export async function runSeoOptimizationCycle(
  options: RunSeoOptimizationOptions = {}
): Promise<SeoCycleSummary> {
  const maxPagesPerRun = Math.max(1, Math.min(20, options.maxPagesPerRun ?? 20));
  const skipRecentlyUpdatedDays = Math.max(7, options.skipRecentlyUpdatedDays ?? 7);

  // 1) Fetch GSC data (cached)
  const gscRows = aggregateNormalizedPageRows((await getCachedGscData()) as GscRow[]);
  const gscMap = new Map<string, GscRow>();
  for (const row of gscRows) {
    const key = row.keys?.[0] ? normalizeUrl(String(row.keys[0])) : undefined;
    if (key) gscMap.set(key, row);
  }

  const sitemapPaths = buildSitemapLocalPages();
  const candidatePaths = Array.from(new Set([...sitemapPaths, ...Array.from(gscMap.keys())]));
  const candidates: CandidatePage[] = [];
  const pageDataByPath = new Map<
    string,
    ReturnType<typeof buildPageAuditData> & { slug: string; path: string; url: string; position: number; impressions: number; ctr: number }
  >();
  const auditsByPage: Record<string, AuditResult> = {};
  const gscDecisionRows: GscPageData[] = [];

  // 2) Run auditPage() on all pages
  for (const path of candidatePaths) {
    const parsed = parseGrowthLocalPath(path);
    if (!parsed) continue;
    const url = `${SITE_URL}${path}`;
    const pageData = buildPageAuditData(parsed.service, parsed.areaSlug, url);
    const row = gscMap.get(path);
    const impressions = row?.impressions ?? 0;
    const ctr = row?.ctr ?? 0;
    const position = row?.position ?? 50;
    const inSitemap = sitemapPaths.includes(path);
    const slug = `growth/local/${parsed.service}/${parsed.areaSlug}`;

    candidates.push({
      path,
      url,
      service: parsed.service,
      areaSlug: parsed.areaSlug,
      impressions,
      ctr,
      position,
      inSitemap,
      audit: pageData.audit,
    });

    auditsByPage[path] = pageData.audit;
    pageDataByPath.set(path, {
      ...pageData,
      slug,
      path,
      url,
      position,
      impressions,
      ctr,
    });
    gscDecisionRows.push({
      page: path,
      impressions,
      ctr,
      position,
      existsDays: inSitemap ? 30 : 0,
    });
  }

  // 3) Generate decisions using decision engine
  const decisions = buildOptimizationActions({
    gscPages: gscDecisionRows,
    auditsByPage,
  });

  const decisionsLimited = decisions.slice(0, maxPagesPerRun);
  const decisionSlugs = decisionsLimited
    .map((decision) => normalizeUrl(decision.page).replace(/^\/+/, ""))
    .filter(Boolean);

  const cutoffIso = new Date(Date.now() - skipRecentlyUpdatedDays * 24 * 60 * 60 * 1000).toISOString();
  const recentSlugSet = new Set<string>();
  if (decisionSlugs.length > 0) {
    try {
      const supabase = createServiceClient();
      const { data } = await supabase
        .from("seo_patches")
        .select("page_slug,updated_at")
        .in("page_slug", decisionSlugs)
        .gte("updated_at", cutoffIso);
      for (const row of ((data as SeoPatchUpdatedRow[] | null) ?? [])) {
        if (row.page_slug) {
          recentSlugSet.add(row.page_slug.replace(/^\/+/, ""));
        }
      }
    } catch {
      // Fallback: if recent-check fails, continue with selected decisions.
    }
  }

  const decisionsToOptimize = decisionsLimited.filter((decision) => {
    const slug = normalizeUrl(decision.page).replace(/^\/+/, "");
    return !recentSlugSet.has(slug);
  });
  const pagesSkippedRecent = decisionsLimited.length - decisionsToOptimize.length;

  const actionLogs = decisionsToOptimize.map((decision) => {
    const page = pageDataByPath.get(decision.page);
    return {
      page: decision.page,
      action: decision.action,
      before: {
        ctr: page?.ctr ?? 0,
        position: page?.position ?? 0,
      },
      after: null as null,
    };
  });

  // 4/5) Optimize pages using optimization engine (which applies patches)
  const optimizedPages = await optimizePages({
    decisions: decisionsToOptimize,
    fetchPageData: async (page) => {
      const data = pageDataByPath.get(page);
      if (!data) return null;
      return {
        page: data.path,
        slug: data.slug,
        url: data.url,
        title: data.title,
        metaDescription: data.description,
        intro: data.intro,
        faq: data.faq,
        internalLinks: data.internalLinks,
        audit: data.audit,
      };
    },
    getCompetitorContext: async ({ page, pageData }) => {
      try {
        const keyword = extractKeywordFromPath(page);
        if (!keyword) return null;

        const serpResults = await getTopResults(keyword);
        const ownPath = normalizeUrl(pageData.url);
        const competitorUrls = serpResults
          .map((result) => result.url)
          .filter((resultUrl) => normalizeUrl(resultUrl) !== ownPath)
          .slice(0, 3);
        if (competitorUrls.length === 0) return null;

        const competitorPages = (
          await Promise.all(
            competitorUrls.map(async (url) => {
              try {
                return await fetchCompetitorPage(url);
              } catch {
                return null;
              }
            })
          )
        ).filter((item): item is CompetitorPageData => Boolean(item));

        if (competitorPages.length === 0) return null;

        const yourPage: CompetitorPageData = {
          title: pageData.title,
          description: pageData.metaDescription,
          headings: [pageData.title, ...pageData.faq.map((item) => item.question)].filter(Boolean),
          wordCount: pageData.audit?.wordCount ?? estimateWordCount(pageData.intro),
          faq: pageData.faq.map((item) => item.question).filter(Boolean),
          internalLinks: pageData.internalLinks.length,
        };

        const gapAnalysis = analyzeGap(yourPage, competitorPages);
        return {
          gapAnalysis,
          competitors: competitorPages,
        };
      } catch {
        // Do not block optimization if competitor context fails.
        return null;
      }
    },
  });

  const optimizedApplied = optimizedPages.filter((item) => !item.skipped);
  const updatedPaths = Array.from(new Set(optimizedApplied.map((item) => normalizeUrl(item.page))));
  const beforeScores: number[] = [];
  const afterScores: number[] = [];

  for (const result of optimizedApplied) {
    const page = pageDataByPath.get(normalizeUrl(result.page));
    if (!page) continue;
    const patchedAudit = auditPage({
      url: page.url,
      title: result.patch.title ?? page.title,
      description: result.patch.metaDescription ?? page.description,
      introText: result.patch.intro ?? page.intro,
      hasSchema: true,
      hasFAQ: (result.patch.faq ?? page.faq).length > 0,
      wordCount: estimateWordCount(
        [
          result.patch.intro ?? page.intro,
          ...(result.patch.faq ?? page.faq).map((x) => `${x.question} ${x.answer}`),
        ].join(" ")
      ),
      internalLinks: (result.patch.internalLinks ?? page.internalLinks).length,
    });
    beforeScores.push(page.audit.score);
    afterScores.push(patchedAudit.score);
  }

  // 6) Revalidate updated pages
  for (const path of Array.from(new Set(updatedPaths))) {
    try {
      revalidatePath(path);
    } catch {
      // Safe fallback: do not fail cycle if running outside request/action context.
    }
  }

  const summary: SeoCycleSummary = {
    pagesAnalyzed: candidates.length,
    decisionsGenerated: decisions.length,
    decisionsSelected: decisionsToOptimize.length,
    pagesSkippedRecent,
    pagesOptimized: optimizedApplied.length,
    avgScoreBefore: avg(beforeScores),
    avgScoreAfter: avg(afterScores),
  };

  // 7) Log results
  try {
    const supabase = createServiceClient();
    await supabase.from("seo_logs").insert({
      pages_analyzed: summary.pagesAnalyzed,
      decisions_generated: summary.decisionsGenerated,
      decisions_selected: summary.decisionsSelected,
      pages_skipped_recent: summary.pagesSkippedRecent,
      pages_optimized: summary.pagesOptimized,
      before_score: summary.avgScoreBefore,
      after_score: summary.avgScoreAfter,
      details: actionLogs,
      created_at: new Date().toISOString(),
    });
  } catch {
    // Do not break the cycle if logging table is unavailable.
  }

  return summary;
}

