import {
  buildLocalSeoCanonical,
  buildLocalSeoFaq,
  buildProgrammaticJsonLd,
  crossServiceLinksForArea,
  getLocalSeoLocation,
  nearbyLocationLinks,
  sameRegionLocationLinks,
  expandLocalSeoContentBlocks,
  LOCAL_SEO_SERVICE_IDS,
} from "@/lib/growth/local-seo-data";
import type { LocalSeoServiceId } from "@/lib/growth/local-seo-types";
import type { SeoQuickFixFlags } from "@/lib/seo/quick-fix-state";

function estimateWordCount(input: string): number {
  return input
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function parseServiceAndArea(url: string): { service: LocalSeoServiceId; area: string } | null {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts.length < 4 || parts[0] !== "growth" || parts[1] !== "local") return null;
    const service = parts[2];
    const area = parts[3];
    if (!(LOCAL_SEO_SERVICE_IDS as string[]).includes(service)) return null;
    return { service: service as LocalSeoServiceId, area };
  } catch {
    return null;
  }
}

export function computeQuickFixMetrics(url: string, flags: SeoQuickFixFlags) {
  const parsed = parseServiceAndArea(url);
  if (!parsed) return null;
  const location = getLocalSeoLocation(parsed.area);
  if (!location) return null;

  const canonical = buildLocalSeoCanonical(parsed.service, parsed.area);
  let intro = location.localizedIntro;
  let why: string[] = [];
  let useCases: string[] = [];
  let pricingContext = "";
  if (flags.expandContentBlocks) {
    const expanded = expandLocalSeoContentBlocks({
      service: parsed.service,
      location,
      intro,
      why,
      useCases,
      pricingContext,
    });
    intro = expanded.intro;
    why = expanded.why;
    useCases = expanded.useCases;
    pricingContext = expanded.pricingContext;
  }

  const faq = buildLocalSeoFaq(location, parsed.service);
  const faqCount = flags.injectFaqModule ? faq.length + 2 : faq.length;
  const internalLinks =
    crossServiceLinksForArea(parsed.area, parsed.service).length +
    nearbyLocationLinks(location).length +
    sameRegionLocationLinks(location, parsed.service).length +
    (flags.boostInternalLinks ? 4 : 0);
  const wordCount = estimateWordCount([intro, ...why, ...useCases, pricingContext].join(" "));
  const jsonLd = buildProgrammaticJsonLd({
    service: parsed.service,
    location,
    canonicalUrl: canonical,
    faq,
    priceFromZar: 420,
    includeEnhancedSchema: flags.enhanceJsonLd,
  }) as { "@graph": unknown[] };

  return {
    wordCount,
    internalLinks,
    faqCount,
    jsonLdNodeCount: Array.isArray(jsonLd["@graph"]) ? jsonLd["@graph"].length : 0,
    htmlFingerprint: `${wordCount}-${internalLinks}-${faqCount}-${flags.enhanceJsonLd ? "schema+" : "schema"}`,
  };
}
