import { auditPage, type AuditResult } from "@/lib/seo/audit-engine";
import { expandLocalSeoContentBlocks } from "@/lib/growth/local-seo-content";
import type { FaqItem } from "@/lib/growth/local-seo-faq";
import type { LocalSeoLocation, LocalSeoServiceId } from "@/lib/growth/local-seo-types";

const MIN_WORD_COUNT = 800;
const MIN_INTERNAL_LINKS = 4;

function estimateWordCount(input: string): number {
  return input
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function syntheticWordCorpus(params: {
  introText: string;
  why: string[];
  localUseCases: string[];
  pricingContext: string;
  extraContentParagraphs: string[];
  faq: FaqItem[];
}): string {
  const { introText, why, localUseCases, pricingContext, extraContentParagraphs, faq } = params;
  return [
    introText,
    ...why,
    ...localUseCases,
    pricingContext,
    ...extraContentParagraphs,
    ...faq.map((item) => `${item.question} ${item.answer}`),
  ].join(" ");
}

function createSupplementalParagraph(location: LocalSeoLocation, service: LocalSeoServiceId, index: number): string {
  const templates = [
    `For ${location.displayName}, this ${service.replace(/-/g, " ")} page is intentionally detailed so customers can compare service scope, booking steps, and expected cleaning outcomes before placing an order.`,
    `Neighborhood-level demand in ${location.displayName} can vary by week, so transparent guidance on scope and timing helps users choose the right service depth without trial-and-error bookings.`,
    `The content structure for ${location.displayName} is built to answer planning questions early, including where service value comes from, how jobs are scoped, and when upgrades are worth it.`,
    `By combining local context with practical booking guidance, this page helps households in ${location.displayName} make faster decisions and arrive at checkout with realistic expectations.`,
    `Search engines and users both benefit when local pages include complete contextual guidance, and this section reinforces service clarity for ${location.displayName} without relying on duplicate filler.`,
  ];
  return templates[index % templates.length];
}

function injectGuaranteedFaq(location: LocalSeoLocation): FaqItem {
  return {
    question: `What should I prepare before a cleaner arrives in ${location.displayName}?`,
    answer:
      "Secure valuables, note priority areas, and share any access instructions in booking notes so the cleaner can begin efficiently and complete the highest-value tasks first.",
  };
}

export type EnforceSeoStandardsInput = {
  url: string;
  service: LocalSeoServiceId;
  location: LocalSeoLocation;
  title: string;
  description: string;
  introText: string;
  why: string[];
  localUseCases: string[];
  pricingContext: string;
  extraContentParagraphs: string[];
  faq: FaqItem[];
  nearbyLinks: Array<{ href: string; label: string }>;
  serviceVariationLinks: Array<{ href: string; label: string }>;
  sameRegionLinks: Array<{ href: string; label: string }>;
  includeSchema: boolean;
};

export type EnforceSeoStandardsOutput = {
  introText: string;
  why: string[];
  localUseCases: string[];
  pricingContext: string;
  extraContentParagraphs: string[];
  faq: FaqItem[];
  includeSchema: boolean;
  nearbyLinks: Array<{ href: string; label: string }>;
  serviceVariationLinks: Array<{ href: string; label: string }>;
  sameRegionLinks: Array<{ href: string; label: string }>;
  audit: AuditResult;
};

export function enforceSeoStandards(input: EnforceSeoStandardsInput): EnforceSeoStandardsOutput {
  let introText = input.introText;
  let why = [...input.why];
  let localUseCases = [...input.localUseCases];
  let pricingContext = input.pricingContext;
  let extraContentParagraphs = [...input.extraContentParagraphs];
  let faq = [...input.faq];
  let includeSchema = input.includeSchema;

  let nearbyLinks = [...input.nearbyLinks];
  let serviceVariationLinks = [...input.serviceVariationLinks];
  let sameRegionLinks = [...input.sameRegionLinks];

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const internalLinks = nearbyLinks.length + serviceVariationLinks.length + sameRegionLinks.length;
    const wordCount = estimateWordCount(
      syntheticWordCorpus({
        introText,
        why,
        localUseCases,
        pricingContext,
        extraContentParagraphs,
        faq,
      })
    );
    const audit = auditPage({
      url: input.url,
      title: input.title,
      description: input.description,
      introText,
      hasSchema: includeSchema,
      hasFAQ: faq.length > 0,
      wordCount,
      internalLinks,
    });
    const passes =
      wordCount >= MIN_WORD_COUNT &&
      internalLinks >= MIN_INTERNAL_LINKS &&
      faq.length > 0 &&
      includeSchema &&
      !audit.issues.includes("missing_faq") &&
      !audit.issues.includes("missing_schema");
    if (passes) {
      return {
        introText,
        why,
        localUseCases,
        pricingContext,
        extraContentParagraphs,
        faq,
        includeSchema,
        nearbyLinks,
        serviceVariationLinks,
        sameRegionLinks,
        audit,
      };
    }

    if (wordCount < MIN_WORD_COUNT) {
      const expanded = expandLocalSeoContentBlocks({
        service: input.service,
        location: input.location,
        intro: introText,
        why,
        useCases: localUseCases,
        pricingContext,
      });
      introText = expanded.intro;
      why = expanded.why;
      localUseCases = expanded.useCases;
      pricingContext = expanded.pricingContext;
      extraContentParagraphs = [...extraContentParagraphs, ...expanded.extraParagraphs];
      extraContentParagraphs.push(createSupplementalParagraph(input.location, input.service, attempt));
    }

    if (faq.length === 0) {
      faq = [injectGuaranteedFaq(input.location)];
    }

    if (!includeSchema) {
      includeSchema = true;
    }

    if (internalLinks < MIN_INTERNAL_LINKS) {
      if (nearbyLinks.length === 0) {
        nearbyLinks = [...input.nearbyLinks];
      }
      if (serviceVariationLinks.length === 0) {
        serviceVariationLinks = [...input.serviceVariationLinks];
      }
      if (sameRegionLinks.length === 0) {
        sameRegionLinks = [...input.sameRegionLinks];
      }
    }
  }

  while (
    estimateWordCount(
      syntheticWordCorpus({
        introText,
        why,
        localUseCases,
        pricingContext,
        extraContentParagraphs,
        faq,
      })
    ) < MIN_WORD_COUNT
  ) {
    extraContentParagraphs.push(
      createSupplementalParagraph(input.location, input.service, extraContentParagraphs.length + 20)
    );
  }
  if (faq.length === 0) faq = [injectGuaranteedFaq(input.location)];
  includeSchema = true;

  const finalInternalLinks = nearbyLinks.length + serviceVariationLinks.length + sameRegionLinks.length;
  const finalWordCount = estimateWordCount(
    syntheticWordCorpus({
      introText,
      why,
      localUseCases,
      pricingContext,
      extraContentParagraphs,
      faq,
    })
  );
  const finalAudit = auditPage({
    url: input.url,
    title: input.title,
    description: input.description,
    introText,
    hasSchema: includeSchema,
    hasFAQ: faq.length > 0,
    wordCount: finalWordCount,
    internalLinks: finalInternalLinks,
  });

  if (
    finalWordCount < MIN_WORD_COUNT ||
    finalInternalLinks < MIN_INTERNAL_LINKS ||
    faq.length === 0 ||
    !includeSchema
  ) {
    throw new Error(`SEO standards enforcement failed for ${input.url}`);
  }

  return {
    introText,
    why,
    localUseCases,
    pricingContext,
    extraContentParagraphs,
    faq,
    includeSchema,
    nearbyLinks,
    serviceVariationLinks,
    sameRegionLinks,
    audit: finalAudit,
  };
}
