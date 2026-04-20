import type { CompetitorPageData } from "@/lib/seo/competitor-content-fetcher";

export type GapCode =
  | "LOW_WORD_COUNT"
  | "MISSING_HEADINGS"
  | "MISSING_FAQ"
  | "WEAK_TITLE"
  | "LOW_INTERNAL_LINKS";

export type GapAnalysisResult = {
  gaps: GapCode[];
  recommendations: string[];
};

const TITLE_MODIFIERS = [
  "cheap",
  "affordable",
  "same-day",
  "same day",
  "near me",
  "best",
  "trusted",
  "professional",
  "fast",
  "emergency",
];

function normalizeText(input: string): string {
  return input.toLowerCase().replace(/\s+/g, " ").trim();
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function includesModifier(title: string): boolean {
  const normalized = normalizeText(title);
  return TITLE_MODIFIERS.some((modifier) => normalized.includes(modifier));
}

function toHeadingSet(headings: string[]): Set<string> {
  return new Set(
    headings
      .map((heading) => normalizeText(heading))
      .filter(Boolean)
  );
}

function headingLabel(heading: string): string {
  return heading
    .replace(/^section_/i, "")
    .replace(/_/g, " ")
    .toLowerCase();
}

export function analyzeGap(
  yourPage: CompetitorPageData,
  competitors: CompetitorPageData[]
): GapAnalysisResult {
  const validCompetitors = competitors.filter(
    (page) => page && (page.wordCount > 0 || page.headings.length > 0 || page.faq.length > 0)
  );

  if (validCompetitors.length === 0) {
    return {
      gaps: [],
      recommendations: ["Collect competitor data first to generate a meaningful gap report."],
    };
  }

  const gaps = new Set<GapCode>();
  const recommendations: string[] = [];

  const competitorAvgWordCount = average(validCompetitors.map((page) => page.wordCount));
  if (competitorAvgWordCount > yourPage.wordCount) {
    gaps.add("LOW_WORD_COUNT");
    recommendations.push(
      `Expand page copy depth. Competitor average is ${Math.round(competitorAvgWordCount)} words versus ${yourPage.wordCount} words on your page.`
    );
  }

  const yourHeadingSet = toHeadingSet(yourPage.headings);
  const headingFrequency = new Map<string, number>();
  for (const competitor of validCompetitors) {
    const uniqueCompetitorHeadings = toHeadingSet(competitor.headings);
    for (const heading of uniqueCompetitorHeadings) {
      headingFrequency.set(heading, (headingFrequency.get(heading) ?? 0) + 1);
    }
  }

  const importantHeadings = Array.from(headingFrequency.entries())
    .filter(([, count]) => count >= Math.ceil(validCompetitors.length / 2))
    .map(([heading]) => heading);

  const missingImportantHeadings = importantHeadings.filter((heading) => !yourHeadingSet.has(heading));
  if (missingImportantHeadings.length > 0) {
    gaps.add("MISSING_HEADINGS");
    recommendations.push(
      `Add missing section types used by competitors: ${missingImportantHeadings
        .slice(0, 4)
        .map(headingLabel)
        .join(", ")}.`
    );
  }

  const competitorsWithFaqRatio =
    validCompetitors.filter((page) => page.faq.length > 0).length / validCompetitors.length;
  if (competitorsWithFaqRatio >= 0.5 && yourPage.faq.length === 0) {
    gaps.add("MISSING_FAQ");
    recommendations.push("Add a FAQ section covering key buying, pricing, and service expectation questions.");
  }

  const competitorModifierUsageRatio =
    validCompetitors.filter((page) => includesModifier(page.title)).length / validCompetitors.length;
  if (competitorModifierUsageRatio >= 0.5 && !includesModifier(yourPage.title)) {
    gaps.add("WEAK_TITLE");
    recommendations.push(
      "Strengthen title with clear intent modifiers (e.g. affordable, same-day, trusted) while staying natural."
    );
  }

  const competitorAvgInternalLinks = average(validCompetitors.map((page) => page.internalLinks));
  if (competitorAvgInternalLinks > yourPage.internalLinks) {
    gaps.add("LOW_INTERNAL_LINKS");
    recommendations.push(
      `Increase relevant internal links. Competitors average ${Math.round(competitorAvgInternalLinks)} links versus ${yourPage.internalLinks} on your page.`
    );
  }

  return {
    gaps: Array.from(gaps),
    recommendations,
  };
}
