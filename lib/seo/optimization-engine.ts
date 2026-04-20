import { auditPage, type AuditResult } from "@/lib/seo/audit-engine";
import { applySeoPatch, type SeoPageIdentity } from "@/lib/seo/patch-engine";
import { generateSeoContentPatch, type SeoPatchInputPage, type SeoContentPatch } from "@/lib/seo/ai-optimizer";
import type { OptimizationAction } from "@/lib/seo/decision-engine";
import type { CompetitorPageData } from "@/lib/seo/competitor-content-fetcher";
import type { GapAnalysisResult } from "@/lib/seo/gap-analysis-engine";

export type OptimizationPageData = Omit<SeoPatchInputPage, "audit"> & {
  page: string;
  slug?: string;
  audit?: AuditResult;
  hasSchema?: boolean;
};

export type OptimizedPageResult = {
  page: string;
  action: OptimizationAction["action"];
  patch: SeoContentPatch;
  skipped: boolean;
  reason?: string;
};

export type OptimizePagesInput = {
  decisions: OptimizationAction[];
  fetchPageData: (page: string) => Promise<OptimizationPageData | null>;
  getCompetitorContext?: (input: {
    page: string;
    action: OptimizationAction["action"];
    pageData: OptimizationPageData;
  }) => Promise<{ gapAnalysis?: GapAnalysisResult; competitors?: CompetitorPageData[] } | null>;
};

function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function hasPatchContent(patch: SeoContentPatch): boolean {
  return Boolean(
    patch.title ||
      patch.metaDescription ||
      patch.intro ||
      (patch.faq && patch.faq.length > 0) ||
      (patch.internalLinks && patch.internalLinks.length > 0)
  );
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function appearsKeywordStuffed(text: string): boolean {
  const tokens = normalizeWhitespace(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2);

  if (tokens.length < 20) return false;
  const counts = new Map<string, number>();
  for (const token of tokens) {
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }
  const maxFrequency = Math.max(...Array.from(counts.values()));
  return maxFrequency / tokens.length > 0.12;
}

function sanitizeTextPatch(candidate: string): string | null {
  const candidateNorm = normalizeWhitespace(candidate);
  if (!candidateNorm) return null;
  if (appearsKeywordStuffed(candidateNorm)) return null;
  return candidateNorm;
}

function sanitizePatch(
  pageData: OptimizationPageData,
  patch: SeoContentPatch
): { patch: SeoContentPatch; reason?: string } {
  const sanitized: SeoContentPatch = {};
  const pageOrigin = new URL(pageData.url).origin;

  if (typeof patch.title === "string") {
    const title = sanitizeTextPatch(patch.title);
    if (title) sanitized.title = title;
  }
  if (typeof patch.metaDescription === "string") {
    const metaDescription = sanitizeTextPatch(patch.metaDescription);
    if (metaDescription) sanitized.metaDescription = metaDescription;
  }
  if (typeof patch.intro === "string") {
    const intro = sanitizeTextPatch(patch.intro);
    if (intro) {
      // Never remove original body context; only allow additive enhancement.
      sanitized.intro = intro.includes(normalizeWhitespace(pageData.intro))
        ? intro
        : `${normalizeWhitespace(pageData.intro)} ${intro}`;
    }
  }
  if (Array.isArray(patch.faq) && patch.faq.length > 0) {
    const existingFaq = pageData.faq.filter((item) => item.question.trim() && item.answer.trim());
    const incomingFaq = patch.faq
      .filter((item) => item.question.trim() && item.answer.trim())
      .map((item) => ({
        question: normalizeWhitespace(item.question),
        answer: normalizeWhitespace(item.answer),
      }))
      .filter((item) => !appearsKeywordStuffed(`${item.question} ${item.answer}`));

    // Keep existing FAQ entries; only append/improve.
    const mergedByQuestion = new Map<string, { question: string; answer: string }>();
    for (const item of existingFaq) {
      mergedByQuestion.set(item.question.trim().toLowerCase(), {
        question: normalizeWhitespace(item.question),
        answer: normalizeWhitespace(item.answer),
      });
    }
    for (const item of incomingFaq) {
      mergedByQuestion.set(item.question.trim().toLowerCase(), item);
    }
    sanitized.faq = Array.from(mergedByQuestion.values()).slice(0, 12);
  }
  if (Array.isArray(patch.internalLinks) && patch.internalLinks.length > 0) {
    const safeLinks = Array.from(
      new Set(
        patch.internalLinks
          .map((href) => href.trim())
          .filter(Boolean)
          .filter((href) => {
            try {
              const parsed = new URL(href, pageOrigin);
              // Keep internal links on the same site and strip tracking params.
              return parsed.origin === pageOrigin;
            } catch {
              return false;
            }
          })
      )
    ).slice(0, 12);
    if (safeLinks.length > 0) {
      sanitized.internalLinks = Array.from(new Set([...pageData.internalLinks, ...safeLinks]));
    }
  }

  if (!hasPatchContent(sanitized)) {
    return {
      patch: {},
      reason: "Patch rejected by safety constraints (non-destructive/readability/internal-link checks).",
    };
  }
  return { patch: sanitized };
}

function normalizePagePath(page: string): string {
  const trimmed = page.trim();
  if (!trimmed) return "";
  try {
    const parsed = new URL(trimmed);
    return parsed.pathname || "/";
  } catch {
    return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  }
}

function toPageIdentity(pageData: OptimizationPageData): SeoPageIdentity {
  const normalizedPath = normalizePagePath(pageData.page);
  const slug = pageData.slug ?? normalizedPath.replace(/^\/+/, "");
  return {
    slug,
    url: pageData.url,
  };
}

function ensureAudit(pageData: OptimizationPageData): AuditResult {
  if (pageData.audit) return pageData.audit;
  return auditPage({
    url: pageData.url,
    title: pageData.title,
    description: pageData.metaDescription,
    introText: pageData.intro,
    hasSchema: pageData.hasSchema ?? true,
    hasFAQ: pageData.faq.length > 0,
    wordCount: countWords(
      `${pageData.intro} ${pageData.faq.map((item) => `${item.question} ${item.answer}`).join(" ")}`
    ),
    internalLinks: pageData.internalLinks.length,
  });
}

export async function optimizePages(input: OptimizePagesInput): Promise<OptimizedPageResult[]> {
  const optimizedPages: OptimizedPageResult[] = [];

  for (const decision of input.decisions) {
    const pageData = await input.fetchPageData(decision.page);
    if (!pageData) {
      optimizedPages.push({
        page: decision.page,
        action: decision.action,
        patch: {},
        skipped: true,
        reason: "Page data not found.",
      });
      continue;
    }

    const audit = ensureAudit(pageData);
    const competitorContext = input.getCompetitorContext
      ? await input.getCompetitorContext({
          page: decision.page,
          action: decision.action,
          pageData,
        })
      : null;
    const patch = generateSeoContentPatch(
      {
        url: pageData.url,
        title: pageData.title,
        metaDescription: pageData.metaDescription,
        intro: pageData.intro,
        faq: pageData.faq,
        internalLinks: pageData.internalLinks,
        audit,
      },
      decision.action,
      {
        gapAnalysis: competitorContext?.gapAnalysis,
        competitors: competitorContext?.competitors,
      }
    );
    const sanitized = sanitizePatch(pageData, patch);
    if (!hasPatchContent(sanitized.patch)) {
      optimizedPages.push({
        page: pageData.page,
        action: decision.action,
        patch: {},
        skipped: true,
        reason: sanitized.reason ?? `No ${decision.action} changes generated for page.`,
      });
      continue;
    }

    await applySeoPatch(toPageIdentity(pageData), sanitized.patch);
    optimizedPages.push({
      page: pageData.page,
      action: decision.action,
      patch: sanitized.patch,
      skipped: false,
    });
  }

  return optimizedPages;
}
