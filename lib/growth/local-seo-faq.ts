import type { LocalSeoServiceId } from '@/lib/growth/local-seo-types';
import type { LocalSeoLocation } from '@/lib/growth/local-seo-types';

export type FaqItem = { question: string; answer: string };

const SERVICE_LABEL: Record<LocalSeoServiceId, string> = {
  'cleaning-services': 'cleaning services',
  'deep-cleaning': 'deep cleaning',
  'move-out-cleaning': 'move-out cleaning',
  'same-day-cleaning': 'same-day cleaning',
  'affordable-cleaning': 'affordable cleaning',
  'weekly-cleaning': 'weekly cleaning',
};

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function deterministicShuffle<T>(items: T[], seed: number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = (seed + i * 17) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function buildLocalSeoFaq(location: LocalSeoLocation, service: LocalSeoServiceId): FaqItem[] {
  const a = location.displayName;
  const region = location.region;
  const serviceLabel = SERVICE_LABEL[service];
  const nearby = location.nearbySlugs
    .slice(0, 2)
    .map((slug) =>
      slug
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
    )
    .join(' and ');
  const seed = hash(`${service}-${location.slug}`);

  const coreFaqs: FaqItem[] = [
    {
      question: `How do I book a cleaner in ${a}?`,
      answer:
        'Choose your service type, bedrooms, bathrooms, and any extras on our booking flow. You will see V4 price and estimated duration before you pay — the same engine that powers the examples on this page.',
    },
    {
      question: `Does Shalean cover all suburbs in ${a} and ${region}?`,
      answer:
        'We operate where we have cleaner capacity. Enter your full address at checkout to confirm availability for your exact suburb — routing is automated from your postcode and area.',
    },
    {
      question: 'Are cleaners vetted and insured?',
      answer:
        'Shalean works with trained, background-checked cleaners. Service specifics (including liability) are summarised in our terms — ask support if you need a formal certificate for your estate.',
    },
    {
      question: 'How long will a typical clean take?',
      answer:
        'Duration depends on service type, home size, and extras. The table on this page shows real V4 hours for common scenarios — deep and move-out jobs often use a multi-person crew when hours exceed thresholds.',
    },
    {
      question: 'Can I reschedule or cancel?',
      answer:
        'Yes — use your customer dashboard or contact support. Fees may apply for very late cancellations as set out in our terms.',
    },
  ];

  const locationFaqs: FaqItem[] = [
    {
      question: `Do you offer ${serviceLabel} in ${a}?`,
      answer: `Yes, we provide ${serviceLabel} throughout ${a}${nearby ? ` and nearby areas like ${nearby}` : ''}.`,
    },
    {
      question: `How quickly can I book a cleaner in ${a}?`,
      answer: `Same-day and next-day bookings are available depending on cleaner capacity in ${a}.`,
    },
    {
      question: `Do cleaners already work in ${a} neighborhoods?`,
      answer: nearby
        ? `Yes. Teams regularly cover ${a} and nearby areas including ${nearby}.`
        : `Yes. Teams regularly cover ${a} and nearby residential areas in the region.`,
    },
  ];

  const serviceSpecific: FaqItem[] = [];

  if (service === 'same-day-cleaning') {
    serviceSpecific.push({
      question: `Is same-day cleaning guaranteed in ${a}?`,
      answer:
        'Same-day depends on live capacity in your suburb. Book as early as possible — the system only shows slots cleaners can accept.',
    });
  }

  if (service === 'weekly-cleaning' || service === 'affordable-cleaning') {
    serviceSpecific.push({
      question: 'What is the difference between Quick and Premium on standard cleans?',
      answer:
        'Quick and Premium use different V4 tables for price and time — Premium is suited to larger or more detailed homes. Compare the two examples above for typical totals.',
    });
  }

  if (service === 'deep-cleaning') {
    serviceSpecific.push({
      question: `When should I book a deep clean instead of a standard clean in ${a}?`,
      answer:
        'Choose deep cleaning for seasonal refreshes, after renovations, or when kitchens and bathrooms need intensive attention. Standard cleans maintain week-to-week hygiene.',
    });
  }

  if (service === 'move-out-cleaning') {
    serviceSpecific.push({
      question: 'Is oven or fridge cleaning included?',
      answer:
        'Add ovens, fridges, and other extras as line items during booking — they extend time and price through the same V4 extras engine.',
    });
  }

  const merged = deterministicShuffle([...serviceSpecific, ...locationFaqs, ...coreFaqs], seed);
  return merged.slice(0, 8);
}
