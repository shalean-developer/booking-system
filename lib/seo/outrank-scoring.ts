import type { CompetitorPageData } from "@/lib/seo/competitor-content-fetcher";

export type OutrankBreakdown = {
  wordCount: boolean;
  internalLinks: boolean;
  faqAdvantage: boolean;
  titleStrength: boolean;
  contentScore: boolean;
};

export type OutrankScoreResult = {
  outrankScore: number;
  breakdown: OutrankBreakdown;
  weaknesses: string[];
  competitorAverages: {
    wordCount: number;
    internalLinks: number;
    contentScore: number;
    faqCoverage: number;
  };
};

type YourPageForOutrank = {
  title: string;
  wordCount: number;
  internalLinks: number;
  faqCount: number;
  contentScore: number;
};

const TITLE_POWER_WORDS = [
  "same-day",
  "same day",
  "affordable",
  "cheap",
  "trusted",
  "best",
  "professional",
  "fast",
];

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function titleStrengthScore(title: string): number {
  const normalized = title.toLowerCase();
  let score = 0;
  for (const word of TITLE_POWER_WORDS) {
    if (normalized.includes(word)) score += 1;
  }
  if (normalized.includes("|") || normalized.includes("-")) score += 0.5;
  return score;
}

function estimateCompetitorContentScore(page: CompetitorPageData): number {
  let score = 0;
  if (page.wordCount >= 800) score += 40;
  else score += Math.max(0, Math.min(40, Math.round((page.wordCount / 800) * 40)));
  if (page.internalLinks >= 6) score += 25;
  else score += Math.max(0, Math.min(25, Math.round((page.internalLinks / 6) * 25)));
  if (page.faq.length > 0) score += 20;
  if (page.headings.length >= 6) score += 15;
  else score += Math.max(0, Math.min(15, Math.round((page.headings.length / 6) * 15)));
  return Math.max(0, Math.min(100, score));
}

export function getOutrankScore(
  yourPage: YourPageForOutrank,
  competitors: CompetitorPageData[]
): OutrankScoreResult {
  const validCompetitors = competitors.filter((c) => c.wordCount > 0 || c.headings.length > 0);
  if (validCompetitors.length === 0) {
    return {
      outrankScore: 0,
      breakdown: {
        wordCount: false,
        internalLinks: false,
        faqAdvantage: false,
        titleStrength: false,
        contentScore: false,
      },
      weaknesses: ["No competitor data available for scoring."],
      competitorAverages: {
        wordCount: 0,
        internalLinks: 0,
        contentScore: 0,
        faqCoverage: 0,
      },
    };
  }

  const competitorAvgWordCount = average(validCompetitors.map((c) => c.wordCount));
  const competitorAvgInternalLinks = average(validCompetitors.map((c) => c.internalLinks));
  const competitorFaqCoverage =
    validCompetitors.filter((c) => c.faq.length > 0).length / validCompetitors.length;
  const competitorAvgTitleStrength = average(validCompetitors.map((c) => titleStrengthScore(c.title)));
  const competitorAvgContentScore = average(validCompetitors.map(estimateCompetitorContentScore));

  const breakdown: OutrankBreakdown = {
    wordCount: yourPage.wordCount > competitorAvgWordCount,
    internalLinks: yourPage.internalLinks > competitorAvgInternalLinks,
    faqAdvantage: yourPage.faqCount > 0 && competitorFaqCoverage < 0.5,
    titleStrength: titleStrengthScore(yourPage.title) > competitorAvgTitleStrength,
    contentScore: yourPage.contentScore > competitorAvgContentScore,
  };

  const outrankScore =
    (breakdown.wordCount ? 20 : 0) +
    (breakdown.internalLinks ? 20 : 0) +
    (breakdown.faqAdvantage ? 20 : 0) +
    (breakdown.titleStrength ? 20 : 0) +
    (breakdown.contentScore ? 20 : 0);

  const weaknesses: string[] = [];
  if (!breakdown.wordCount) weaknesses.push("Word count is below competitor average.");
  if (!breakdown.internalLinks) weaknesses.push("Internal linking is weaker than competitors.");
  if (!breakdown.faqAdvantage) weaknesses.push("FAQ advantage is missing.");
  if (!breakdown.titleStrength) weaknesses.push("Title pattern is weaker than top competitors.");
  if (!breakdown.contentScore) weaknesses.push("Overall content quality score trails competitors.");

  return {
    outrankScore,
    breakdown,
    weaknesses,
    competitorAverages: {
      wordCount: Math.round(competitorAvgWordCount),
      internalLinks: Math.round(competitorAvgInternalLinks * 10) / 10,
      contentScore: Math.round(competitorAvgContentScore),
      faqCoverage: Math.round(competitorFaqCoverage * 100),
    },
  };
}
