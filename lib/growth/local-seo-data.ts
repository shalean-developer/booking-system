/**
 * Programmatic local SEO — barrel exports.
 */

export type { LocalSeoServiceId, LocalSeoLocation } from '@/lib/growth/local-seo-types';

export {
  LOCAL_SEO_LOCATIONS,
  getLocalSeoLocation,
  resolveNearbyLocations,
  getLocationsByRegion,
  getRegionSlugs,
  slugifyRegion,
  slugifyCity,
  getLocationsByParentCity,
  getRegionsByParentCity,
} from '@/lib/growth/local-seo-locations';

export {
  LOCAL_SEO_SERVICE_IDS,
  SERVICE_PAGE_META,
  getServicePageMeta,
} from '@/lib/growth/local-seo-services';

export { buildSeoPricingExamples } from '@/lib/growth/local-seo-pricing';
export type { SeoPricingExampleRow } from '@/lib/growth/local-seo-pricing';

export { buildLocalSeoFaq } from '@/lib/growth/local-seo-faq';
export type { FaqItem } from '@/lib/growth/local-seo-faq';

export { buildProgrammaticJsonLd, buildLocalSeoCanonical } from '@/lib/growth/local-seo-schema';

export {
  crossServiceLinksForArea,
  nearbyLocationLinks,
  popularServiceLinks,
  sameRegionLocationLinks,
  regionHubLink,
} from '@/lib/growth/local-seo-links';

export {
  whyChooseSection,
  generateHowItWorks,
  generateServiceIncludes,
  generateLocalUseCases,
  generatePricingContext,
  trustMicroSignals,
  orderedContentSections,
  durationExplainer,
  expandLocalSeoContentBlocks,
} from '@/lib/growth/local-seo-content';

export { LOCAL_SEO_TRUST, LOCAL_SEO_TESTIMONIALS } from '@/lib/growth/local-seo-trust';

import type { LocalSeoServiceId } from '@/lib/growth/local-seo-types';
import { getLocalSeoLocation, LOCAL_SEO_LOCATIONS } from '@/lib/growth/local-seo-locations';
import { SERVICE_PAGE_META } from '@/lib/growth/local-seo-services';
import { buildLocalSeoFaq } from '@/lib/growth/local-seo-faq';

/** Legacy shape: `name` maps from `displayName` */
export function getLocalArea(slug: string) {
  const loc = getLocalSeoLocation(slug);
  if (!loc) return undefined;
  return {
    slug: loc.slug,
    name: loc.displayName,
    region: loc.region,
    priceFromZar: 0,
  };
}

export function getServiceCopy(service: LocalSeoServiceId) {
  const m = SERVICE_PAGE_META[service];
  return {
    title: (area: string) => m.metaTitle(area),
    description: (area: string) => m.metaDescription(area),
    bookHref: m.bookHref,
    keywords: m.keywords,
  };
}

export function localSeoFaq(areaName: string, service: LocalSeoServiceId) {
  const loc = LOCAL_SEO_LOCATIONS.find((l) => l.displayName === areaName);
  const fallback = LOCAL_SEO_LOCATIONS[0];
  return buildLocalSeoFaq(loc ?? fallback, service);
}
