import { SITE_URL } from '@/lib/metadata';
import type { LocalSeoServiceId } from '@/lib/growth/local-seo-types';
import type { LocalSeoLocation } from '@/lib/growth/local-seo-types';
import { getServicePageMeta } from '@/lib/growth/local-seo-services';
import type { FaqItem } from '@/lib/growth/local-seo-faq';

const SERVICE_TYPE_MAP: Record<LocalSeoServiceId, string> = {
  'cleaning-services': 'House cleaning service',
  'deep-cleaning': 'Deep cleaning service',
  'move-out-cleaning': 'End of tenancy cleaning service',
  'same-day-cleaning': 'Same-day cleaning service',
  'affordable-cleaning': 'Affordable cleaning service',
  'weekly-cleaning': 'Weekly cleaning service',
};

export function buildLocalSeoCanonical(service: LocalSeoServiceId, areaSlug: string): string {
  return `${SITE_URL}/growth/local/${service}/${areaSlug}`;
}

export function buildProgrammaticJsonLd(params: {
  service: LocalSeoServiceId;
  location: LocalSeoLocation;
  canonicalUrl: string;
  faq: FaqItem[];
  priceFromZar: number;
  includeEnhancedSchema?: boolean;
}) {
  const { service: serviceId, location, canonicalUrl, faq, includeEnhancedSchema = false } = params;
  const seo = getServicePageMeta(serviceId, location.displayName);

  const business = {
    '@type': 'LocalBusiness',
    '@id': `${canonicalUrl}#business`,
    name: 'Shalean Cleaning Services',
    url: SITE_URL,
    areaServed: {
      '@type': 'City',
      name: location.displayName,
    },
  };

  const svc = {
    '@type': 'Service',
    '@id': `${canonicalUrl}#service`,
    name: seo.metaTitle(location.displayName),
    description: seo.metaDescription(location.displayName),
    url: canonicalUrl,
    serviceType: SERVICE_TYPE_MAP[serviceId],
    provider: {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
    },
    areaServed: { '@type': 'City', name: location.displayName },
    availableChannel: {
      '@type': 'ServiceChannel',
      serviceLocation: {
        '@type': 'Place',
        name: location.displayName,
      },
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'ZAR',
      availability: 'https://schema.org/InStock',
      url: canonicalUrl,
    },
  };

  const faqPage = {
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };

  const graph: Record<string, unknown>[] = [business, svc, faqPage];
  if (includeEnhancedSchema) {
    graph.push({
      '@type': 'WebPage',
      '@id': `${canonicalUrl}#webpage`,
      url: canonicalUrl,
      name: seo.metaTitle(location.displayName),
      description: seo.metaDescription(location.displayName),
      inLanguage: 'en-ZA',
      primaryImageOfPage: `${SITE_URL}/logo-icon.png`,
      about: [{ '@id': `${canonicalUrl}#service` }],
    });
    graph.push({
      '@type': 'ItemList',
      '@id': `${canonicalUrl}#service-links`,
      name: `Related cleaning services in ${location.displayName}`,
      numberOfItems: 3,
    });
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
}
