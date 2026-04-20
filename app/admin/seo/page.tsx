import { createServiceClient } from "@/lib/supabase-server";
import Link from "next/link";
import {
  LOCAL_SEO_LOCATIONS,
  LOCAL_SEO_SERVICE_IDS,
  getLocalSeoLocation,
  getServicePageMeta,
  buildLocalSeoCanonical,
  buildLocalSeoFaq,
  crossServiceLinksForArea,
  nearbyLocationLinks,
  sameRegionLocationLinks,
  expandLocalSeoContentBlocks,
} from "@/lib/growth/local-seo-data";
import { auditPage, type AuditIssue } from "@/lib/seo/audit-engine";
import { generateSeoContentPatch, type SeoContentPatch } from "@/lib/seo/ai-optimizer";
import { getQuickFixConfig, toQuickFixFlags } from "@/lib/seo/quick-fix-state";
import { getCachedGscData } from "@/lib/seo/gsc-cache";
import { getTopResults } from "@/lib/seo/serp-client";
import { fetchCompetitorPage, type CompetitorPageData } from "@/lib/seo/competitor-content-fetcher";
import { analyzeGap } from "@/lib/seo/gap-analysis-engine";
import { getOutrankScore } from "@/lib/seo/outrank-scoring";

type RecentPost = {
  title: string | null;
  slug: string | null;
  created_at: string | null;
};

type TopPost = {
  slug: string | null;
  views: number | null;
};

type GscRow = {
  keys?: string[];
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
};

type SeoDashboardProps = {
  searchParams?: Promise<{
    filter?: string;
    keyword?: string;
    autoImprove?: string;
  }>;
};

type ProgrammaticPageHealth = {
  url: string;
  service: string;
  area: string;
  indexed: boolean;
  indexingStatus: "Indexed" | "Discovered (no impressions)" | "Not indexed" | "Unknown";
  highOpportunity: boolean;
  opportunityScore: number;
  boostCtrPatch?: SeoContentPatch;
  impressions: number;
  clicks: number;
  position: number;
  ctr: number;
  contentScore: number;
  title: string;
  description: string;
  wordCount: number;
  internalLinksCount: number;
  faqQuestions: string[];
  issues: AuditIssue[];
  suggestions: { id: string; text: string; patch?: SeoContentPatch }[];
};

export const dynamic = "force-dynamic";

function calculateOpportunityScore(impressions: number, ctr: number): number {
  if (impressions <= 100 || ctr >= 0.02) return 0;
  const ctrGap = 0.02 - ctr;
  return Math.round(impressions * ctrGap * 100);
}

function suggestionsFromPatch(patch: SeoContentPatch): { id: string; text: string; patch?: SeoContentPatch }[] {
  const out: { id: string; text: string; patch?: SeoContentPatch }[] = [];
  if (patch.intro) {
    out.push({
      id: "expand-intro-local-context",
      text: "Apply AI intro rewrite for richer local context",
      patch: { intro: patch.intro },
    });
  }
  if (patch.faq && patch.faq.length > 0) {
    out.push({
      id: "expand-faq",
      text: "Apply AI FAQ expansion",
      patch: { faq: patch.faq },
    });
  }
  if (patch.internalLinks && patch.internalLinks.length > 0) {
    out.push({
      id: "add-internal-links",
      text: "Apply AI internal link patch",
      patch: { internalLinks: patch.internalLinks },
    });
  }
  if (patch.title || patch.metaDescription) {
    out.push({
      id: "add-service-keywords",
      text: "Apply AI title/meta CTR patch",
      patch: {
        title: patch.title,
        metaDescription: patch.metaDescription,
      },
    });
  }
  if (out.length === 0) {
    out.push({ id: "maintain-and-refresh", text: "No strong AI patch needed for this page" });
  }
  return out;
}

function estimateWordCount(input: string): number {
  return input
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function issueLabel(issue: AuditIssue): string {
  if (issue === "missing_title") return "Missing title";
  if (issue === "missing_description") return "Missing description";
  if (issue === "missing_schema") return "Missing schema";
  if (issue === "missing_faq") return "Missing FAQ";
  if (issue === "low_word_count") return "Low word count";
  if (issue === "no_internal_links") return "No internal links";
  return "Duplicate pattern";
}

function scoreBadge(score: number): { label: string; className: string } {
  if (score >= 80) {
    return { label: `🟢 ${score}`, className: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  }
  if (score >= 50) {
    return { label: `🟡 ${score}`, className: "bg-amber-50 text-amber-700 border-amber-200" };
  }
  return { label: `🔴 ${score}`, className: "bg-rose-50 text-rose-700 border-rose-200" };
}

export default async function SeoDashboard({ searchParams }: SeoDashboardProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const activeFilter = resolvedSearchParams.filter ?? "all";
  const selectedKeyword = resolvedSearchParams.keyword?.trim() ?? "";
  const autoImproveParam = resolvedSearchParams.autoImprove === "1";
  const supabase = createServiceClient();

  const { count: totalBlogs } = await supabase
    .from("blog_posts")
    .select("*", { count: "exact", head: true });

  const { count: publishedBlogs } = await supabase
    .from("blog_posts")
    .select("*", { count: "exact", head: true })
    .eq("status", "published");

  const { count: locations } = await supabase
    .from("service_location_pages")
    .select("*", { count: "exact", head: true });

  const { data: recentPosts } = await supabase
    .from("blog_posts")
    .select("title, slug, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: topPosts } = await supabase.rpc("top_posts");
  let gscRows: GscRow[] = [];
  let gscPageRows: GscRow[] = [];
  let gscError: string | null = null;
  let hasGscPageData = false;

  try {
    const cachedRows = await getCachedGscData();
    gscPageRows = cachedRows;
    gscRows = cachedRows;
    hasGscPageData = cachedRows.length > 0;
  } catch (error) {
    gscError = "Could not load cached Search Console data.";
  }

  const byClicks = [...gscRows].sort((a, b) => (b.clicks ?? 0) - (a.clicks ?? 0));
  const byPosition = [...gscRows].sort((a, b) => (a.position ?? 999) - (b.position ?? 999));
  const quickWins = [...gscRows]
    .filter((row) => (row.impressions ?? 0) >= 500 && (row.ctr ?? 0) < 0.03)
    .sort((a, b) => (b.impressions ?? 0) - (a.impressions ?? 0))
    .slice(0, 5);

  const quickFixConfig = await getQuickFixConfig();
  const autoImprovePages = autoImproveParam || quickFixConfig.autoImprovePages;
  const gscByPage = new Map<string, GscRow>();
  for (const row of gscPageRows) {
    const key = row.keys?.[0];
    if (key) gscByPage.set(key, row);
  }

  const allProgrammaticPages: ProgrammaticPageHealth[] = LOCAL_SEO_SERVICE_IDS.flatMap((service) =>
    LOCAL_SEO_LOCATIONS.map((location) => {
      const url = buildLocalSeoCanonical(service, location.slug);
      const pageRow = gscByPage.get(url);
      const impressions = pageRow?.impressions ?? 0;
      const clicks = pageRow?.clicks ?? 0;
      const position = pageRow?.position ?? 0;
      const ctr = pageRow?.ctr ?? 0;
      const indexingStatus: ProgrammaticPageHealth["indexingStatus"] = !hasGscPageData
        ? "Unknown"
        : pageRow
          ? impressions > 0
            ? "Indexed"
            : "Discovered (no impressions)"
          : "Not indexed";
      const indexed = indexingStatus === "Indexed";
      const highOpportunity = impressions > 100 && ctr < 0.02;
      const opportunityScore = calculateOpportunityScore(impressions, ctr);
      const meta = getServicePageMeta(service, location.displayName);
      const boostCtrPatch: SeoContentPatch | undefined = highOpportunity
        ? {
            title: `${meta.metaTitle(location.displayName)} | Book Trusted Local Cleaners`,
            metaDescription: `${meta.metaDescription(location.displayName)} Book online in minutes with transparent pricing.`,
          }
        : undefined;
      const faq = buildLocalSeoFaq(location, service);
      const pageState = quickFixConfig.pages[url];
      const quickFixFlags = toQuickFixFlags(pageState?.appliedFixes ?? [], autoImprovePages);

      let baseInternalLinks =
        crossServiceLinksForArea(location.slug, service).length +
        nearbyLocationLinks(location).length +
        sameRegionLocationLinks(location, service).length;
      if (quickFixFlags.boostInternalLinks) {
        baseInternalLinks += Math.min(4, crossServiceLinksForArea(location.slug, service).length);
      }

      let introText = location.localizedIntro;
      let why: string[] = [];
      let useCases: string[] = [];
      let pricingContext = "";
      if (quickFixFlags.expandContentBlocks) {
        const expanded = expandLocalSeoContentBlocks({
          service,
          location,
          intro: location.localizedIntro,
          why,
          useCases,
          pricingContext,
        });
        introText = expanded.intro;
        why = expanded.why;
        useCases = expanded.useCases;
        pricingContext = expanded.pricingContext;
      }

      const effectiveFaq = quickFixFlags.injectFaqModule
        ? [...faq, { question: `Extra local FAQ for ${location.displayName}`, answer: `Expanded local guidance for ${location.displayName}.` }]
        : faq;
      const syntheticContent = [introText, ...why, ...useCases, pricingContext, ...effectiveFaq.map((x) => `${x.question} ${x.answer}`)].join(" ");
      const wordCount = estimateWordCount(syntheticContent);
      const internalLinks = baseInternalLinks;
      const hasFAQ = effectiveFaq.length > 0;
      const hasSchema = true;

      const duplicatePatternKey = location.localizedIntro.length < 170 ? "short-intro-pattern" : undefined;
      const audit = auditPage({
        url,
        title: meta.metaTitle(location.displayName),
        description: meta.metaDescription(location.displayName),
        introText,
        hasSchema,
        hasFAQ,
        wordCount,
        internalLinks,
        duplicatePatternKey,
      });

      const aiPatch = generateSeoContentPatch({
        url,
        title: meta.metaTitle(location.displayName),
        metaDescription: meta.metaDescription(location.displayName),
        intro: introText,
        faq: effectiveFaq,
        internalLinks: [
          ...crossServiceLinksForArea(location.slug, service).map((x) => x.href),
          ...nearbyLocationLinks(location).map((x) => x.href),
          ...sameRegionLocationLinks(location, service).map((x) => x.href),
        ],
        audit,
        impressions,
        ctr,
      });
      const suggestions = suggestionsFromPatch(aiPatch);

      return {
        url,
        service,
        area: location.displayName,
        indexed,
        indexingStatus,
        highOpportunity,
        opportunityScore,
        boostCtrPatch,
        impressions,
        clicks,
        position,
        ctr,
        contentScore: audit.score,
        title: meta.metaTitle(location.displayName),
        description: meta.metaDescription(location.displayName),
        wordCount,
        internalLinksCount: internalLinks,
        faqQuestions: effectiveFaq.map((item) => item.question),
        issues: audit.issues,
        suggestions,
      };
    })
  );

  const filteredProgrammaticPages = allProgrammaticPages
    .filter((page) => {
      if (activeFilter === "weak") return page.contentScore < 50;
      if (activeFilter === "high-impr-low-ctr") return page.impressions >= 500 && page.ctr < 0.03;
      if (activeFilter === "not-indexed") return !page.indexed;
      return true;
    })
    .sort((a, b) => b.opportunityScore - a.opportunityScore);

  const keywordRelatedPages =
    selectedKeyword.length === 0
      ? []
      : allProgrammaticPages
          .filter((page) => {
            const loc = getLocalSeoLocation(page.url.split("/").pop() ?? "");
            const haystack = [page.url, page.service, page.area, loc?.region ?? ""].join(" ").toLowerCase();
            return selectedKeyword
              .toLowerCase()
              .split(/\s+/)
              .some((token) => token.length > 2 && haystack.includes(token));
          })
          .slice(0, 12);

  const primaryKeywordPage = keywordRelatedPages[0];
  let competitorSnapshot:
    | {
        keyword: string;
        competitors: CompetitorPageData[];
        gap: ReturnType<typeof analyzeGap>;
        outrank: ReturnType<typeof getOutrankScore>;
      }
    | null = null;

  if (selectedKeyword && primaryKeywordPage) {
    try {
      const serp = await getTopResults(selectedKeyword);
      const ownPath = new URL(primaryKeywordPage.url).pathname;
      const competitorUrls = serp
        .map((result) => result.url)
        .filter((url) => {
          try {
            return new URL(url).pathname !== ownPath;
          } catch {
            return false;
          }
        })
        .slice(0, 3);

      const competitors = (
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

      if (competitors.length > 0) {
        const yourPageCompetitorView: CompetitorPageData = {
          title: primaryKeywordPage.title,
          description: primaryKeywordPage.description,
          headings: [primaryKeywordPage.title, ...primaryKeywordPage.faqQuestions],
          wordCount: primaryKeywordPage.wordCount,
          faq: primaryKeywordPage.faqQuestions,
          internalLinks: primaryKeywordPage.internalLinksCount,
        };
        const gap = analyzeGap(yourPageCompetitorView, competitors);
        const outrank = getOutrankScore(
          {
            title: primaryKeywordPage.title,
            wordCount: primaryKeywordPage.wordCount,
            internalLinks: primaryKeywordPage.internalLinksCount,
            faqCount: primaryKeywordPage.faqQuestions.length,
            contentScore: primaryKeywordPage.contentScore,
          },
          competitors
        );
        competitorSnapshot = {
          keyword: selectedKeyword,
          competitors,
          gap,
          outrank,
        };
      }
    } catch {
      competitorSnapshot = null;
    }
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-xl font-semibold">SEO Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-4">
          <p className="text-sm text-gray-500">Total Blogs</p>
          <p className="text-2xl font-bold">{totalBlogs ?? 0}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-sm text-gray-500">Published</p>
          <p className="text-2xl font-bold">{publishedBlogs ?? 0}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-sm text-gray-500">Location Pages</p>
          <p className="text-2xl font-bold">{locations ?? 0}</p>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <h2 className="mb-3 font-medium">Recent Posts</h2>
        <div className="space-y-2">
          {(recentPosts as RecentPost[] | null)?.map((post, index) => (
            <div key={post.slug ?? `${post.created_at ?? "post"}-${index}`} className="flex justify-between gap-3">
              <span className="truncate">{post.title ?? "Untitled"}</span>
              {post.slug ? (
                <a
                  href={`/blog/${post.slug}`}
                  className="text-sm text-blue-600"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View
                </a>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <h2 className="mb-3 font-medium">Top Posts</h2>
        <div className="space-y-2">
          {(topPosts as TopPost[] | null)?.map((post) => (
            <div key={post.slug ?? "unknown"}>
              {post.slug ?? "unknown"} ({post.views ?? 0} views)
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <h2 className="mb-3 font-medium">Top Keywords</h2>
        <p className="mb-3 text-xs text-gray-500">
          Click any keyword to view related programmatic pages currently ranking.
        </p>

        <div className="space-y-4">
          {gscError ? (
            <p className="text-sm text-amber-700">{gscError}</p>
          ) : gscRows.length === 0 ? (
            <p className="text-sm text-gray-500">No keyword data available yet.</p>
          ) : (
            <>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase text-gray-500">Sorted by Clicks</p>
                <div className="space-y-2">
                  {byClicks.map((row) => (
                    <div
                      key={`clicks-${row.keys?.[0] ?? "unknown-keyword"}`}
                      className="grid grid-cols-12 gap-3 text-sm"
                    >
                      <Link
                        href={`/admin/seo?keyword=${encodeURIComponent(row.keys?.[0] ?? "")}&filter=${encodeURIComponent(activeFilter)}`}
                        className="col-span-5 truncate text-blue-700 hover:underline"
                      >
                        {row.keys?.[0] ?? "unknown"}
                      </Link>
                      <span className="col-span-2 text-gray-600">{row.clicks ?? 0} clicks</span>
                      <span className="col-span-2 text-gray-600">{row.impressions ?? 0} impressions</span>
                      <span className="col-span-1 text-gray-600">
                        {((row.ctr ?? 0) * 100).toFixed(1)}%
                      </span>
                      <span className="col-span-2 text-gray-600">Pos {Math.round(row.position ?? 0)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="mb-2 text-xs font-semibold uppercase text-gray-500">Sorted by Best Position</p>
                <div className="space-y-2">
                  {byPosition.slice(0, 10).map((row) => (
                    <div
                      key={`position-${row.keys?.[0] ?? "unknown-keyword"}`}
                      className="grid grid-cols-12 gap-3 text-sm"
                    >
                      <Link
                        href={`/admin/seo?keyword=${encodeURIComponent(row.keys?.[0] ?? "")}&filter=${encodeURIComponent(activeFilter)}`}
                        className="col-span-6 truncate text-blue-700 hover:underline"
                      >
                        {row.keys?.[0] ?? "unknown"}
                      </Link>
                      <span className="col-span-2 text-gray-600">Pos {Math.round(row.position ?? 0)}</span>
                      <span className="col-span-2 text-gray-600">{row.clicks ?? 0} clicks</span>
                      <span className="col-span-2 text-gray-600">
                        {((row.ctr ?? 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-medium">Programmatic SEO Health</h2>
            <p className="text-xs text-gray-500">
              Audits all `/growth/local/[service]/[area]` pages with indexing, rankings, content score, and AI fixes.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/admin/seo?filter=all${selectedKeyword ? `&keyword=${encodeURIComponent(selectedKeyword)}` : ""}`}
              className={`rounded border px-2.5 py-1 text-xs ${activeFilter === "all" ? "bg-gray-900 text-white" : "bg-white text-gray-700"}`}
            >
              All
            </Link>
            <Link
              href={`/admin/seo?filter=weak${selectedKeyword ? `&keyword=${encodeURIComponent(selectedKeyword)}` : ""}`}
              className={`rounded border px-2.5 py-1 text-xs ${activeFilter === "weak" ? "bg-gray-900 text-white" : "bg-white text-gray-700"}`}
            >
              Weak pages
            </Link>
            <Link
              href={`/admin/seo?filter=high-impr-low-ctr${selectedKeyword ? `&keyword=${encodeURIComponent(selectedKeyword)}` : ""}`}
              className={`rounded border px-2.5 py-1 text-xs ${activeFilter === "high-impr-low-ctr" ? "bg-gray-900 text-white" : "bg-white text-gray-700"}`}
            >
              High impr, low CTR
            </Link>
            <Link
              href={`/admin/seo?filter=not-indexed${selectedKeyword ? `&keyword=${encodeURIComponent(selectedKeyword)}` : ""}`}
              className={`rounded border px-2.5 py-1 text-xs ${activeFilter === "not-indexed" ? "bg-gray-900 text-white" : "bg-white text-gray-700"}`}
            >
              Not indexed
            </Link>
          </div>
        </div>

        <form action="/api/seo/quick-fix" method="post" className="mt-4 inline-block">
          <input type="hidden" name="action" value="toggle-auto-improve" />
          <input type="hidden" name="enabled" value={autoImprovePages ? "false" : "true"} />
          <button
            type="submit"
            className={`rounded border px-3 py-1.5 text-xs font-medium ${autoImprovePages ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-gray-300 bg-white text-gray-700"}`}
          >
            Auto Improve Pages: {autoImprovePages ? "ON" : "OFF"}
          </button>
        </form>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[1200px] w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="px-3 py-2 font-semibold">URL</th>
                <th className="px-3 py-2 font-semibold">Indexing status</th>
                <th className="px-3 py-2 font-semibold">Impressions</th>
                <th className="px-3 py-2 font-semibold">Clicks</th>
                <th className="px-3 py-2 font-semibold">Avg position</th>
                <th className="px-3 py-2 font-semibold">Opportunity score</th>
                <th className="px-3 py-2 font-semibold">Content score</th>
                <th className="px-3 py-2 font-semibold">Issues</th>
                <th className="px-3 py-2 font-semibold">AI Suggestions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProgrammaticPages.slice(0, 80).map((page) => {
                const badge = scoreBadge(page.contentScore);
                return (
                  <tr key={page.url} className="border-t align-top">
                    <td className="px-3 py-3">
                      <a
                        href={page.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-700 hover:underline"
                      >
                        {page.url.replace("https://shalean.co.za", "")}
                      </a>
                    </td>
                    <td className="px-3 py-3">{page.indexingStatus}</td>
                    <td className="px-3 py-3">{page.impressions}</td>
                    <td className="px-3 py-3">{page.clicks}</td>
                    <td className="px-3 py-3">{page.position.toFixed(1)}</td>
                    <td className="px-3 py-3">
                      <div className="space-y-1">
                        <div className="font-medium text-gray-900">{page.opportunityScore}</div>
                        {page.highOpportunity ? (
                          <div className="inline-flex rounded border border-violet-200 bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700">
                            High Opportunity
                          </div>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex rounded border px-2 py-1 text-xs font-medium ${badge.className}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {page.issues.length === 0 ? (
                        <span className="text-emerald-700">No critical issues</span>
                      ) : (
                        <ul className="list-disc space-y-1 pl-4">
                          {page.issues.map((issue) => (
                            <li key={`${page.url}-${issue}`}>{issueLabel(issue)}</li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="space-y-2">
                        {page.highOpportunity ? (
                          <div className="rounded border border-violet-200 bg-violet-50 p-2">
                            <p className="text-xs font-medium text-violet-800">Boost CTR</p>
                            <p className="mt-1 text-xs text-violet-700">
                              Suggestion: rewrite title for stronger intent-match and improve meta description with
                              clearer value + CTA.
                            </p>
                            <form action="/api/seo/quick-fix" method="post" className="mt-2">
                              <input type="hidden" name="action" value="apply-fix" />
                              <input type="hidden" name="url" value={page.url} />
                              <input type="hidden" name="fixId" value="add-service-keywords" />
                              {page.boostCtrPatch ? (
                                <input type="hidden" name="patch" value={JSON.stringify(page.boostCtrPatch)} />
                              ) : null}
                              <button
                                type="submit"
                                className="rounded border border-violet-300 bg-white px-2 py-1 text-xs font-medium text-violet-700"
                              >
                                Boost CTR
                              </button>
                            </form>
                          </div>
                        ) : null}
                        {page.suggestions.map((suggestion) => (
                          <div key={`${page.url}-${suggestion.id}`} className="rounded border bg-gray-50 p-2">
                            <p className="text-xs text-gray-700">- {suggestion.text}</p>
                            <form action="/api/seo/quick-fix" method="post" className="mt-2">
                              <input type="hidden" name="action" value="apply-fix" />
                              <input type="hidden" name="url" value={page.url} />
                              <input type="hidden" name="fixId" value={suggestion.id} />
                              {suggestion.patch ? (
                                <input type="hidden" name="patch" value={JSON.stringify(suggestion.patch)} />
                              ) : null}
                              <button
                                type="submit"
                                className="rounded border border-blue-300 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700"
                              >
                                Apply Fix
                              </button>
                            </form>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedKeyword && (
        <div className="rounded-xl border bg-white p-4">
          <h2 className="mb-2 font-medium">Keyword to Ranking Pages</h2>
          <p className="mb-3 text-sm text-gray-600">
            Keyword: <span className="font-semibold">{selectedKeyword}</span>
          </p>
          {keywordRelatedPages.length === 0 ? (
            <p className="text-sm text-gray-500">No related programmatic pages found for this keyword.</p>
          ) : (
            <div className="space-y-2">
              {keywordRelatedPages.map((page) => (
                <div key={`kw-${selectedKeyword}-${page.url}`} className="grid grid-cols-12 gap-3 text-sm">
                  <a
                    href={page.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="col-span-7 truncate text-blue-700 hover:underline"
                  >
                    {page.url.replace("https://shalean.co.za", "")}
                  </a>
                  <span className="col-span-2 text-gray-600">{page.clicks} clicks</span>
                  <span className="col-span-2 text-gray-600">{page.impressions} impressions</span>
                  <span className="col-span-1 text-gray-600">Pos {page.position.toFixed(1)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedKeyword && competitorSnapshot && (
        <div className="rounded-xl border bg-white p-4">
          <h2 className="mb-2 font-medium">Competitor Comparison</h2>
          <p className="mb-3 text-sm text-gray-600">
            Keyword: <span className="font-semibold">{competitorSnapshot.keyword}</span>
          </p>
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="rounded-lg border bg-gray-50 p-3">
              <p className="text-xs text-gray-500">Outrank Score</p>
              <p className="text-2xl font-bold">{competitorSnapshot.outrank.outrankScore}/100</p>
            </div>
            <div className="rounded-lg border bg-gray-50 p-3">
              <p className="text-xs text-gray-500">Competitor Avg Words</p>
              <p className="text-lg font-semibold">{competitorSnapshot.outrank.competitorAverages.wordCount}</p>
            </div>
            <div className="rounded-lg border bg-gray-50 p-3">
              <p className="text-xs text-gray-500">Competitor Avg Links</p>
              <p className="text-lg font-semibold">{competitorSnapshot.outrank.competitorAverages.internalLinks}</p>
            </div>
            <div className="rounded-lg border bg-gray-50 p-3">
              <p className="text-xs text-gray-500">Competitor Avg Content Score</p>
              <p className="text-lg font-semibold">{competitorSnapshot.outrank.competitorAverages.contentScore}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
              <p className="mb-2 text-sm font-semibold text-rose-800">Weaknesses</p>
              {competitorSnapshot.outrank.weaknesses.length === 0 ? (
                <p className="text-sm text-emerald-700">No major weaknesses identified.</p>
              ) : (
                <ul className="list-disc space-y-1 pl-4 text-sm text-rose-800">
                  {competitorSnapshot.outrank.weaknesses.map((weakness) => (
                    <li key={weakness}>{weakness}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="mb-2 text-sm font-semibold text-amber-800">Gap Recommendations</p>
              {competitorSnapshot.gap.recommendations.length === 0 ? (
                <p className="text-sm text-amber-800">No major gap recommendations.</p>
              ) : (
                <ul className="list-disc space-y-1 pl-4 text-sm text-amber-800">
                  {competitorSnapshot.gap.recommendations.map((recommendation) => (
                    <li key={recommendation}>{recommendation}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border bg-white p-4">
        <h2 className="mb-3 font-medium">Quick Wins</h2>
        <p className="mb-3 text-xs text-gray-500">
          High impressions and low CTR terms to prioritize in titles/meta descriptions.
        </p>

        <div className="space-y-2">
          {quickWins.length === 0 ? (
            <p className="text-sm text-gray-500">No quick-win terms found in the current top keyword set.</p>
          ) : (
            quickWins.map((row) => (
              <div key={`quick-${row.keys?.[0] ?? "unknown-keyword"}`} className="grid grid-cols-12 gap-3 text-sm">
                <span className="col-span-6 truncate">{row.keys?.[0] ?? "unknown"}</span>
                <span className="col-span-3 text-gray-600">{row.impressions ?? 0} impressions</span>
                <span className="col-span-3 text-gray-600">{((row.ctr ?? 0) * 100).toFixed(1)}% CTR</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
