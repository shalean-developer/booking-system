import type { AuditResult } from "@/lib/seo/audit-engine";
import type { FaqItem } from "@/lib/growth/local-seo-faq";
import type { CompetitorPageData } from "@/lib/seo/competitor-content-fetcher";
import type { GapAnalysisResult } from "@/lib/seo/gap-analysis-engine";

export type SeoContentPatch = {
  title?: string;
  metaDescription?: string;
  intro?: string;
  faq?: FaqItem[];
  internalLinks?: string[];
};

export type SeoPatchInputPage = {
  url: string;
  title: string;
  metaDescription: string;
  intro: string;
  faq: FaqItem[];
  internalLinks: string[];
  audit: AuditResult;
  impressions?: number;
  ctr?: number;
};

export type SeoOptimizationAction = "BOOST_CTR" | "IMPROVE_CONTENT" | "ADD_LINKS" | "FIX_INDEXING";
type CompetitorAwareInput = {
  gapAnalysis?: GapAnalysisResult;
  competitors?: CompetitorPageData[];
};

function withCtaMeta(description: string): string {
  const trimmed = description.trim();
  if (trimmed.toLowerCase().includes("book")) return trimmed;
  return `${trimmed} Book online in minutes with transparent pricing.`;
}

function words(text: string): string[] {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function extractLocalContext(url: string): { service: string; area: string } {
  try {
    const parsed = new URL(url);
    const pathParts = parsed.pathname.split("/").filter(Boolean);
    const service = pathParts[2] ?? "cleaning services";
    const area = (pathParts[3] ?? "your area").replace(/-/g, " ");
    return {
      service: service.replace(/-/g, " "),
      area,
    };
  } catch {
    return { service: "cleaning services", area: "your area" };
  }
}

function ensureMinWords(text: string, minWords: number, filler: string): string {
  const currentWords = words(text);
  if (currentWords.length >= minWords) return text.trim();

  const fillerWords = words(filler);
  const needed = minWords - currentWords.length;
  const extension = fillerWords.slice(0, Math.max(needed, Math.min(fillerWords.length, 90))).join(" ");
  return `${text.trim()} ${extension}`.trim();
}

function ensureTargetWords(text: string, targetWords: number, expansionBlocks: string[]): string {
  const normalizedTarget = Math.max(120, targetWords);
  let output = text.trim();
  if (words(output).length >= normalizedTarget) return output;
  let idx = 0;
  while (words(output).length < normalizedTarget && expansionBlocks.length > 0 && idx < 20) {
    output = `${output} ${expansionBlocks[idx % expansionBlocks.length]}`.trim();
    idx += 1;
  }
  return output;
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function normalizeText(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

function competitorTitleUsesSeparators(competitors: CompetitorPageData[]): boolean {
  if (competitors.length === 0) return false;
  const withSeparators = competitors.filter((competitor) => /[|:-]/.test(competitor.title)).length;
  return withSeparators / competitors.length >= 0.5;
}

function withPowerWords(title: string): string {
  const required = ["same-day", "affordable", "trusted"];
  const lowered = title.toLowerCase();
  const missing = required.filter((word) => !lowered.includes(word));
  if (missing.length === 0) return title;
  const suffix = missing
    .map((word) => (word === "same-day" ? "Same-Day" : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(", ");
  return `${title} | ${suffix}`;
}

function rewriteTitleForCtr(title: string, area: string): string {
  const base = title.replace(/\s*\|\s*Book Trusted Local Cleaners\s*$/i, "").trim();
  const withBenefit = base.toLowerCase().includes("same-day")
    ? base
    : `${base} - Same-Day Availability`;
  if (withBenefit.toLowerCase().includes("book now")) return withBenefit;
  return `${withBenefit} | Book Now`;
}

function rewriteMetaForCtr(meta: string, service: string, area: string): string {
  const normalizedMeta = meta.trim().replace(/\.$/, "");
  return `${normalizedMeta}. Compare trusted ${service} in ${area}, view transparent pricing, and secure your preferred slot today.`;
}

function buildFaq(action: SeoOptimizationAction, page: SeoPatchInputPage): FaqItem[] {
  const { service, area } = extractLocalContext(page.url);
  const baseFaq = [...page.faq];
  const generated: FaqItem[] = [
    {
      question: `How quickly can I book ${service} in ${area}?`,
      answer:
        "Live availability is shown during checkout so you can confirm the nearest available cleaner and secure your preferred timeslot immediately.",
    },
    {
      question: `What impacts pricing for ${service} in ${area}?`,
      answer:
        "Pricing is based on property size, service depth, and selected extras. You can preview pricing changes in real time before confirming your booking.",
    },
    {
      question: "Do I get the same cleaner for repeat bookings?",
      answer:
        "Where availability allows, repeat bookings prioritize cleaner consistency so your instructions and service preferences are maintained over time.",
    },
    {
      question: "What should I prepare before the cleaner arrives?",
      answer:
        "A quick declutter helps cleaners focus on high-impact tasks faster. Any special notes can be added during booking for better service alignment.",
    },
    {
      question: `Why choose this ${service} page for ${area}?`,
      answer:
        "This page includes localized service guidance, realistic pricing context, and links to related services so you can choose the best option with confidence.",
    },
  ];

  const targetCount = action === "FIX_INDEXING" ? 5 : 4;
  const merged = [...baseFaq, ...generated].slice(0, Math.max(3, Math.min(5, targetCount)));
  return merged;
}

function buildCompetitorFaq(competitors: CompetitorPageData[], fallback: FaqItem[]): FaqItem[] {
  const intentFrequency = new Map<string, number>();
  for (const competitor of competitors) {
    for (const intent of competitor.faq) {
      const key = normalizeText(intent).toLowerCase();
      if (!key) continue;
      intentFrequency.set(key, (intentFrequency.get(key) ?? 0) + 1);
    }
  }
  const topIntents = Array.from(intentFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([intent]) => intent)
    .slice(0, 5);

  const intentQuestionMap: Record<string, FaqItem> = {
    faq_pricing: {
      question: "How is the final cleaning price calculated?",
      answer:
        "Pricing is based on property size, selected service depth, and extras so you can align cost with the exact scope you need.",
    },
    faq_timing: {
      question: "How quickly can I get a confirmed booking slot?",
      answer:
        "Live slot availability is shown during checkout, making it easy to secure the earliest suitable appointment.",
    },
    faq_scope: {
      question: "What tasks are included in this service?",
      answer:
        "The service scope is broken down clearly by room and task type so you know exactly what is covered before payment.",
    },
    faq_booking: {
      question: "Can I reschedule or adjust my booking after checkout?",
      answer:
        "You can manage scheduling updates based on availability, and changes are reflected clearly before final confirmation.",
    },
    faq_trust: {
      question: "How do you ensure cleaning quality and reliability?",
      answer:
        "Quality checks, clear service instructions, and vetted cleaner standards help keep outcomes consistent across bookings.",
    },
    faq_general: {
      question: "How do I choose the best cleaning option for my home?",
      answer:
        "Compare service depth, timing, and add-ons to select the option that fits your property condition and goals.",
    },
  };
  const topQuestions = topIntents.map((intent) => intentQuestionMap[intent] ?? intentQuestionMap.faq_general);

  const merged = [...fallback, ...topQuestions];
  const byQuestion = new Map<string, FaqItem>();
  for (const item of merged) {
    byQuestion.set(item.question.trim().toLowerCase(), item);
  }
  return Array.from(byQuestion.values()).slice(0, 10);
}

function buildInternalLinks(page: SeoPatchInputPage, min: number, max: number): string[] {
  const parsed = new URL(page.url);
  const pathParts = parsed.pathname.split("/").filter(Boolean);
  const service = pathParts[2] ?? "cleaning-services";
  const area = pathParts[3] ?? "cape-town";
  const links = [
    `${parsed.origin}/growth/local/cleaning-services/${area}`,
    `${parsed.origin}/growth/local/deep-cleaning/${area}`,
    `${parsed.origin}/growth/local/move-out-cleaning/${area}`,
    `${parsed.origin}/growth/local/office-cleaning/${area}`,
    `${parsed.origin}/growth/local/post-construction-cleaning/${area}`,
    `${parsed.origin}/growth/local/${service}/region/cape-town`,
    `${parsed.origin}/blog`,
    `${parsed.origin}/pricing`,
  ];
  return Array.from(new Set([...page.internalLinks, ...links])).slice(0, Math.max(min, Math.min(max, 8)));
}

export function generateSeoContentPatch(
  page: SeoPatchInputPage,
  action?: SeoOptimizationAction,
  competitorInput?: CompetitorAwareInput
): SeoContentPatch {
  const { audit, impressions = 0, ctr = 0 } = page;
  const patch: SeoContentPatch = {};
  const { service, area } = extractLocalContext(page.url);
  const competitors = competitorInput?.competitors ?? [];
  const gapAnalysis = competitorInput?.gapAnalysis;
  const actionToApply =
    action ??
    (impressions > 200 && ctr < 0.02
      ? "BOOST_CTR"
      : audit.internalLinks < 4
        ? "ADD_LINKS"
        : audit.wordCount < 800 || audit.score < 70
          ? "IMPROVE_CONTENT"
          : undefined);

  if (!actionToApply) return patch;

  const competitorAvgWordCount = avg(competitors.map((competitor) => competitor.wordCount));
  const competitorAvgInternalLinks = avg(competitors.map((competitor) => competitor.internalLinks));
  const targetWordCountFromCompetitors =
    competitorAvgWordCount > 0
      ? Math.ceil(competitorAvgWordCount * (actionToApply === "FIX_INDEXING" ? 1.3 : 1.25))
      : 0;
  const targetInternalLinksFromCompetitors =
    competitorAvgInternalLinks > 0 ? Math.ceil(competitorAvgInternalLinks) + 2 : 0;

  if (actionToApply === "BOOST_CTR") {
    const baseTitle = rewriteTitleForCtr(page.title, area);
    const separatorPattern = competitorTitleUsesSeparators(competitors);
    const patternEnhancedTitle = separatorPattern ? `${baseTitle} | ${area}` : baseTitle;
    patch.title = withPowerWords(patternEnhancedTitle);
    patch.metaDescription = rewriteMetaForCtr(withCtaMeta(page.metaDescription), service, area);
    return patch;
  }

  if (actionToApply === "IMPROVE_CONTENT") {
    let expandedIntro = ensureMinWords(
      `${page.intro} This page is tailored for ${area}, with practical guidance on choosing the right ${service}, expected timelines, and how to get better value from each booking. You can compare service levels, adjust extras, and align cleaning scope to your property needs.`,
      150,
      `Local context for ${area} matters because booking patterns, traffic windows, and cleaner availability can change by neighborhood. Use this page to compare options, understand what is included, and decide based on your home's actual requirements.`
    );
    if (targetWordCountFromCompetitors > 0) {
      expandedIntro = ensureTargetWords(expandedIntro, targetWordCountFromCompetitors, [
        `Compare what is included in entry, standard, and deep ${service} options in ${area}, then match the scope to your property size and timeline.`,
        `Use this localized guide to avoid overpaying for extras you do not need while still getting consistent cleaning quality.`,
        `Choose service depth based on foot traffic, pets, and room usage patterns so each booking delivers measurable value.`,
      ]);
    }
    if (gapAnalysis?.gaps.includes("MISSING_HEADINGS")) {
      expandedIntro = `${expandedIntro}\n\n### Service Inclusions in ${area}\nUnderstand exactly what is included in each service tier and when to upgrade.\n\n### Booking Timeline and Availability\nPlan around cleaner availability and preferred slots to secure the best outcome.\n\n### Pricing Factors and Extras\nReview how home size, service depth, and add-ons affect final pricing.`;
    }
    patch.intro = expandedIntro;
    patch.faq = buildCompetitorFaq(competitors, buildFaq("IMPROVE_CONTENT", page));
    return patch;
  }

  if (actionToApply === "ADD_LINKS") {
    const minLinks = Math.max(5, targetInternalLinksFromCompetitors);
    patch.internalLinks = buildInternalLinks(page, minLinks, Math.max(minLinks, 12));
    return patch;
  }

  // FIX_INDEXING: combine stronger content, links, and FAQ.
  let indexingIntro = ensureMinWords(
    `${page.intro} This ${service} guide for ${area} now includes richer local insights, clearer service scope, and stronger internal pathways to related pages so search engines can better understand topical relevance.`,
    150,
    `A stronger page combines complete intent coverage, clear localized context, and internal connections to adjacent topics. That gives crawlers better signals and helps users discover related services naturally.`
  );
  if (targetWordCountFromCompetitors > 0) {
    indexingIntro = ensureTargetWords(indexingIntro, targetWordCountFromCompetitors, [
      `This section benchmarks service outcomes and expected effort for different property conditions so users can select the right option faster.`,
      `Use localized service guidance, booking windows, and prep checklists to reduce friction and improve conversion quality.`,
      `Connect this page to related resources so readers can continue deeper into booking, pricing, and post-service expectations.`,
    ]);
  }
  if (gapAnalysis?.gaps.includes("MISSING_HEADINGS")) {
    indexingIntro = `${indexingIntro}\n\n### What to Expect on Service Day\nSee arrival flow, checklist coverage, and quality control steps.\n\n### How to Choose the Right Cleaning Scope\nMap your home condition and goals to the most cost-effective scope.\n\n### Related Services and Next Steps\nNavigate to companion services and guides for better long-term outcomes.`;
  }
  patch.intro = indexingIntro;
  patch.faq = buildCompetitorFaq(competitors, buildFaq("FIX_INDEXING", page));
  const minLinks = Math.max(6, targetInternalLinksFromCompetitors);
  patch.internalLinks = buildInternalLinks(page, minLinks, Math.max(minLinks, 14));
  const baseTitle = rewriteTitleForCtr(page.title, area);
  const separatorPattern = competitorTitleUsesSeparators(competitors);
  patch.title = withPowerWords(separatorPattern ? `${baseTitle} | ${area}` : baseTitle);
  patch.metaDescription = rewriteMetaForCtr(withCtaMeta(page.metaDescription), service, area);

  return patch;
}
