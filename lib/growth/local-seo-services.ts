import type { LocalSeoServiceId } from '@/lib/growth/local-seo-types';

const BOOK_STANDARD = '/booking/service/standard/plan';
const BOOK_DEEP = '/booking/service/deep/plan';
const BOOK_MOVE = '/booking/service/move-in-out/plan';

export type ServicePageMeta = {
  bookHref: string;
  /** H1 / primary headline fragment */
  headline: (areaDisplayName: string) => string;
  /** Unique <title> (may include brand via layout template — use absolute in metadata) */
  metaTitle: (areaDisplayName: string) => string;
  metaDescription: (areaDisplayName: string) => string;
  keywords: string[];
  /** V4 service used for pricing examples */
  pricingFocus: 'standard' | 'deep' | 'move';
};

function kw(base: string[], areaDisplayName: string): string[] {
  return [...base, `cleaning ${areaDisplayName}`, `Shalean ${areaDisplayName}`];
}

export const LOCAL_SEO_SERVICE_IDS: LocalSeoServiceId[] = [
  'cleaning-services',
  'deep-cleaning',
  'move-out-cleaning',
  'same-day-cleaning',
  'affordable-cleaning',
  'weekly-cleaning',
];

export const SERVICE_PAGE_META: Record<LocalSeoServiceId, ServicePageMeta> = {
  'cleaning-services': {
    bookHref: BOOK_STANDARD,
    headline: (a) => `Professional home cleaning in ${a}`,
    metaTitle: (a) => `${a} home cleaning — book vetted cleaners | Shalean`,
    metaDescription: (a) =>
      `Book trusted house cleaning in ${a}. Instant V4 pricing, flexible times, eco-conscious products. Same-week slots in many areas — see live price examples and book online.`,
    keywords: ['house cleaning', 'home cleaning', 'maid service', 'apartment cleaning'],
    pricingFocus: 'standard',
  },
  'deep-cleaning': {
    bookHref: BOOK_DEEP,
    headline: (a) => `Deep cleaning services in ${a}`,
    metaTitle: (a) => `Deep cleaning ${a} — intensive home clean | Shalean`,
    metaDescription: (a) =>
      `Top-to-bottom deep cleaning in ${a}: kitchens, bathrooms, floors, and detail work. Realistic hours and crew size from Shalean V4 pricing — book your slot online.`,
    keywords: ['deep clean', 'spring cleaning', 'intensive clean', 'top to bottom clean'],
    pricingFocus: 'deep',
  },
  'move-out-cleaning': {
    bookHref: BOOK_MOVE,
    headline: (a) => `Move-out & end-of-lease cleaning in ${a}`,
    metaTitle: (a) => `Move out cleaning ${a} — handover-ready | Shalean`,
    metaDescription: (a) =>
      `Deposit-focused move out cleaning in ${a}. Thorough kitchen and bathroom work, flexible scheduling, transparent V4 quotes before you pay.`,
    keywords: ['move out cleaning', 'end of lease', 'vacate clean', 'deposit clean'],
    pricingFocus: 'move',
  },
  'same-day-cleaning': {
    bookHref: BOOK_STANDARD,
    headline: (a) => `Same-day & urgent cleaning in ${a}`,
    metaTitle: (a) => `Same day cleaning ${a} — fast booking | Shalean`,
    metaDescription: (a) =>
      `Need a clean in ${a} soon? Book online and grab the next available slots — Shalean shows V4 price and duration upfront. Subject to cleaner availability in your suburb.`,
    keywords: ['same day cleaning', 'urgent cleaning', 'last minute cleaner', 'fast booking'],
    pricingFocus: 'standard',
  },
  'affordable-cleaning': {
    bookHref: BOOK_STANDARD,
    headline: (a) => `Affordable house cleaning in ${a}`,
    metaTitle: (a) => `Affordable cleaning ${a} — transparent prices | Shalean`,
    metaDescription: (a) =>
      `See real V4 price examples for ${a} before you book — no hidden fees on the labour line. Compare quick vs premium modes and choose what fits your budget.`,
    keywords: ['cheap cleaning', 'affordable maid', 'budget cleaning', 'transparent pricing'],
    pricingFocus: 'standard',
  },
  'weekly-cleaning': {
    bookHref: BOOK_STANDARD,
    headline: (a) => `Weekly & recurring cleaning in ${a}`,
    metaTitle: (a) => `Weekly cleaning ${a} — recurring home service | Shalean`,
    metaDescription: (a) =>
      `Keep ${a} homes consistently clean with recurring bookings. Shalean’s V4 engine shows time and price for typical homes — set your frequency during checkout.`,
    keywords: ['weekly cleaning', 'recurring maid', 'regular cleaning', 'subscription style'],
    pricingFocus: 'standard',
  },
};

export function getServicePageMeta(service: LocalSeoServiceId, areaDisplayName: string) {
  const m = SERVICE_PAGE_META[service];
  return {
    ...m,
    keywordsResolved: kw(m.keywords, areaDisplayName),
  };
}
