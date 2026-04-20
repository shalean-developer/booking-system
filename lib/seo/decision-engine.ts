import type { AuditResult } from "@/lib/seo/audit-engine";

export type OptimizationActionType = "BOOST_CTR" | "IMPROVE_CONTENT" | "ADD_LINKS" | "FIX_INDEXING";

export type OptimizationAction = {
  page: string;
  action: OptimizationActionType;
  priority: number;
  reasons: string[];
};

export type GscPageData = {
  page: string;
  impressions?: number | null;
  ctr?: number | null;
  position?: number | null;
  firstSeenAt?: string | Date | null;
  publishedAt?: string | Date | null;
  createdAt?: string | Date | null;
  existsDays?: number | null;
};

export type DecisionEngineInput = {
  gscPages: GscPageData[];
  auditsByPage: Record<string, AuditResult | undefined>;
  now?: Date;
};

const ISSUE_SEVERITY: Record<OptimizationActionType, number> = {
  BOOST_CTR: 0.8,
  IMPROVE_CONTENT: 0.7,
  ADD_LINKS: 0.5,
  FIX_INDEXING: 1,
};

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getPageAgeDays(page: GscPageData, now: Date): number {
  const explicitExistsDays = Number(page.existsDays ?? NaN);
  if (Number.isFinite(explicitExistsDays)) {
    return Math.max(0, explicitExistsDays);
  }

  const candidateDates = [page.firstSeenAt, page.publishedAt, page.createdAt].map(toDate).filter(Boolean) as Date[];
  if (candidateDates.length === 0) return 0;

  const oldest = candidateDates.reduce((acc, value) => (value.getTime() < acc.getTime() ? value : acc));
  const diffMs = now.getTime() - oldest.getTime();
  if (diffMs <= 0) return 0;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function getWordCountSeverity(wordCount: number): number {
  if (wordCount >= 800) return 0;
  return clamp01((800 - wordCount) / 800);
}

function getContentScoreSeverity(contentScore: number): number {
  if (contentScore >= 70) return 0;
  return clamp01((70 - contentScore) / 70);
}

function normalizePageKey(page: string): string {
  const trimmed = page.trim();
  if (!trimmed) return trimmed;
  try {
    const parsed = new URL(trimmed);
    return `${parsed.pathname}${parsed.search}` || "/";
  } catch {
    return trimmed;
  }
}

function computePriority(input: {
  impressions: number;
  position: number;
  severity: number;
}): number {
  const impressionsWeight = clamp01(Math.log10(input.impressions + 1) / 4) * 60;
  const positionWeight = clamp01((51 - Math.max(1, input.position)) / 50) * 20;
  const severityWeight = clamp01(input.severity) * 20;
  return Math.round((impressionsWeight + positionWeight + severityWeight) * 100) / 100;
}

export function buildOptimizationActions(input: DecisionEngineInput): OptimizationAction[] {
  const now = input.now ?? new Date();
  const actions: OptimizationAction[] = [];
  const normalizedAuditsByPage = new Map<string, AuditResult>();

  for (const [page, audit] of Object.entries(input.auditsByPage)) {
    if (!audit) continue;
    normalizedAuditsByPage.set(normalizePageKey(page), audit);
  }

  for (const gscPage of input.gscPages) {
    const page = normalizePageKey(gscPage.page);
    if (!page) continue;

    const audit = input.auditsByPage[page] ?? normalizedAuditsByPage.get(page);
    if (!audit) continue;

    const impressions = Number(gscPage.impressions ?? 0);
    const ctr = Number(gscPage.ctr ?? 0);
    const position = Number(gscPage.position ?? 50);
    const pageAgeDays = getPageAgeDays(gscPage, now);

    if (impressions > 200 && ctr < 0.02) {
      const reasons = [
        `High impressions (${impressions}) with low CTR (${(ctr * 100).toFixed(2)}%).`,
        "Improving title/meta can unlock more clicks from existing visibility.",
      ];
      actions.push({
        page,
        action: "BOOST_CTR",
        reasons,
        priority: computePriority({
          impressions,
          position,
          severity: ISSUE_SEVERITY.BOOST_CTR + clamp01((0.02 - Math.max(0, ctr)) / 0.02) * 0.2,
        }),
      });
    }

    if (audit.wordCount < 800 || audit.score < 70) {
      const reasons: string[] = [];
      if (audit.wordCount < 800) {
        reasons.push(`Word count is low (${audit.wordCount} < 800).`);
      }
      if (audit.score < 70) {
        reasons.push(`Content score is below target (${audit.score} < 70).`);
      }

      actions.push({
        page,
        action: "IMPROVE_CONTENT",
        reasons,
        priority: computePriority({
          impressions,
          position,
          severity:
            ISSUE_SEVERITY.IMPROVE_CONTENT +
            Math.max(getWordCountSeverity(audit.wordCount), getContentScoreSeverity(audit.score)) * 0.3,
        }),
      });
    }

    if (audit.internalLinks < 4) {
      const reasons = [`Only ${audit.internalLinks} internal links found (target: 4+).`];
      actions.push({
        page,
        action: "ADD_LINKS",
        reasons,
        priority: computePriority({
          impressions,
          position,
          severity: ISSUE_SEVERITY.ADD_LINKS + clamp01((4 - audit.internalLinks) / 4) * 0.2,
        }),
      });
    }

    if (impressions === 0 && pageAgeDays > 14) {
      const reasons = [
        "Page has zero impressions.",
        `Page age is ${pageAgeDays} days (> 14 days).`,
      ];
      actions.push({
        page,
        action: "FIX_INDEXING",
        reasons,
        priority: computePriority({
          impressions,
          position,
          severity: ISSUE_SEVERITY.FIX_INDEXING,
        }),
      });
    }
  }

  return actions.sort((a, b) => b.priority - a.priority).slice(0, 20);
}
