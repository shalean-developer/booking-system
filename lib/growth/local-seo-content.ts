import type { LocalSeoServiceId } from '@/lib/growth/local-seo-types';
import type { LocalSeoLocation } from '@/lib/growth/local-seo-types';

const SERVICE_NAME: Record<LocalSeoServiceId, string> = {
  'cleaning-services': 'cleaning service',
  'deep-cleaning': 'deep cleaning service',
  'move-out-cleaning': 'move-out cleaning service',
  'same-day-cleaning': 'same-day cleaning service',
  'affordable-cleaning': 'affordable cleaning service',
  'weekly-cleaning': 'weekly cleaning service',
};

const SERVICE_LABEL_SHORT: Record<LocalSeoServiceId, string> = {
  'cleaning-services': 'cleaning',
  'deep-cleaning': 'deep cleaning',
  'move-out-cleaning': 'move-out cleaning',
  'same-day-cleaning': 'same-day cleaning',
  'affordable-cleaning': 'affordable cleaning',
  'weekly-cleaning': 'weekly cleaning',
};

const LOCATION_FACTORS = [
  'high-density housing',
  'busy work schedules',
  'coastal climate conditions',
  'frequent move-ins and rentals',
  'family homes and shared living spaces',
] as const;

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function getContentVariationSeed(service: LocalSeoServiceId, location: LocalSeoLocation): number {
  return hash(`${service}-${location.slug}`);
}

function pickNearbyNames(location: LocalSeoLocation, count = 2): string {
  if (!location.nearbySlugs || location.nearbySlugs.length === 0) return '';
  return location.nearbySlugs
    .slice(0, count)
    .map((slug) =>
      slug
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
    )
    .join(', ');
}

const INTRO_TEMPLATES: Array<(args: { service: string; location: string }) => string> = [
  ({ service, location }) =>
    `Looking for ${service} in ${location}? Our team provides reliable, professional cleaning tailored to homes in ${location}.`,
  ({ service, location }) =>
    `${location} residents trust our ${service} for consistent, high-quality results. Book a service designed for your area.`,
  ({ service, location }) =>
    `Our ${service} in ${location} is built around local needs — from busy households to move-out cleans.`,
  ({ service, location }) =>
    `Need a trusted ${service} in ${location}? We deliver flexible, professional cleaning with transparent pricing.`,
  ({ service, location }) =>
    `Book a ${service} in ${location} with a team that understands local homes, schedules, and expectations.`,
];

export function generateLocalizedIntro(location: LocalSeoLocation, service: LocalSeoServiceId): string {
  const serviceLabel = SERVICE_NAME[service];
  const seed = hash(`${service}-${location.slug}`);
  const template = INTRO_TEMPLATES[seed % INTRO_TEMPLATES.length];
  const nearby = pickNearbyNames(location, 2);
  const locationContext = nearby
    ? `This service is available across ${location.region || 'Cape Town'} including nearby areas like ${nearby}.`
    : `This service is available across ${location.region || 'Cape Town'} including nearby residential zones.`;
  const microLocal = nearby
    ? `We regularly serve homes near ${nearby} in ${location.displayName}.`
    : `We regularly serve homes near popular residential areas in ${location.displayName}.`;

  return `${template({ service: serviceLabel, location: location.displayName })} ${locationContext} ${microLocal}`;
}

export function generateHowItWorks(service: LocalSeoServiceId, location: LocalSeoLocation): string[] {
  const serviceLabel = SERVICE_LABEL_SHORT[service];
  return [
    `Book your ${serviceLabel} in ${location.name} online in minutes.`,
    `We match you with a vetted cleaner familiar with ${location.name}.`,
    `The cleaner arrives fully equipped and completes the service.`,
    `You review and manage future bookings easily.`,
  ];
}

const SERVICE_INCLUDES: Record<LocalSeoServiceId, string[]> = {
  'cleaning-services': [
    'Kitchen, bathroom, and living area cleaning',
    'Floors, surfaces, and high-touch point sanitization',
    'Service scope tailored to bedrooms, bathrooms, and extras',
  ],
  'deep-cleaning': [
    'Detailed kitchen and bathroom cleaning',
    'Inside appliances and cabinets',
    'Wall spot cleaning and dust removal',
  ],
  'move-out-cleaning': [
    'Full property reset for handover',
    'Inside cupboards and drawers',
    'Appliance and surface deep cleaning',
  ],
  'same-day-cleaning': [
    'Priority-ready standard cleaning checklist',
    'Focused cleaning for kitchens, bathrooms, and floors',
    'Fast turnaround based on available cleaner capacity',
  ],
  'affordable-cleaning': [
    'Essential cleaning coverage for key home areas',
    'Flexible service depth for budget-friendly planning',
    'Transparent options before checkout',
  ],
  'weekly-cleaning': [
    'Recurring upkeep for kitchens, bathrooms, and floors',
    'Consistent service scope for week-to-week maintenance',
    'Flexible scheduling around your household routine',
  ],
};

export function generateServiceIncludes(service: LocalSeoServiceId): string[] {
  return SERVICE_INCLUDES[service];
}

const USE_CASE_OPENERS: Array<(service: string, location: string) => string> = [
  (service, location) =>
    `${location} has a mix of apartments and family homes, so our ${service} is designed to adapt to different property types.`,
  (service, location) =>
    `Property needs vary across ${location}, and our ${service} flexes between compact apartments, shared spaces, and larger homes.`,
  (service, location) =>
    `From weekday upkeep to handover prep, our ${service} in ${location} is structured for practical day-to-day property needs.`,
];

const USE_CASE_FOLLOWUPS: Array<(service: string, location: string) => string> = [
  (service, location) =>
    `We regularly help customers in ${location} prepare homes for move-ins, rentals, and regular upkeep.`,
  (service, location) =>
    `Customers in ${location} commonly book this service before guests arrive, after busy weeks, or during property transitions.`,
  (service, location) =>
    `Many households in ${location} use this service to stay ahead of weekly cleaning load and maintain consistent standards.`,
];

export function generateLocalUseCases(service: LocalSeoServiceId, location: LocalSeoLocation): string[] {
  const seed = getContentVariationSeed(service, location);
  const label = SERVICE_LABEL_SHORT[service];
  const first = USE_CASE_OPENERS[seed % USE_CASE_OPENERS.length](label, location.name);
  const second = USE_CASE_FOLLOWUPS[(seed + 1) % USE_CASE_FOLLOWUPS.length](label, location.name);
  return [first, second];
}

export function generatePricingContext(service: LocalSeoServiceId, location: LocalSeoLocation): string {
  const label = SERVICE_LABEL_SHORT[service];
  return `Our pricing for ${label} in ${location.name} is based on property size, service level, and time required. Get an instant quote tailored to your home.`;
}

export function trustMicroSignals(): string[] {
  return ['Background-checked cleaners', 'Flexible scheduling', 'Transparent pricing'];
}

export function orderedContentSections(service: LocalSeoServiceId, location: LocalSeoLocation): Array<'how' | 'includes' | 'useCases'> {
  const variants: Array<Array<'how' | 'includes' | 'useCases'>> = [
    ['how', 'includes', 'useCases'],
    ['includes', 'useCases', 'how'],
    ['useCases', 'how', 'includes'],
  ];
  return variants[getContentVariationSeed(service, location) % variants.length];
}

export function whyChooseSection(location: LocalSeoLocation, service: LocalSeoServiceId): string[] {
  const a = location.displayName;
  const seed = hash(`${service}-${location.slug}`);
  const locationFactor = LOCATION_FACTORS[seed % LOCATION_FACTORS.length];
  const nearby = pickNearbyNames(location, 2);
  const common = [
    `Transparent V4 pricing: the examples on this page use the same calculateBookingV4 engine as checkout — no manual “from” guesses.`,
    `Cleaners are vetted and briefed for punctuality; job duration reflects bedroom, bathroom, and extra-room inputs.`,
    `Our cleaners are experienced with ${locationFactor} in ${a}, ensuring efficient and tailored service.`,
    nearby
      ? `We regularly support homes around ${nearby}, so crews are familiar with ${a} travel and scheduling patterns.`
      : `We regularly support homes across popular residential areas in ${a}, with consistent quality standards.`,
    `Support via WhatsApp for members — reschedule or ask questions without waiting on a call centre.`,
  ];

  const byIntent: Record<LocalSeoServiceId, string[]> = {
    'cleaning-services': [
      `Ideal for ${a} residents who want reliable upkeep — apartments, freestanding homes, and townhouses.`,
      `Premium and Quick standard modes let you balance budget vs. time on site.`,
    ],
    'deep-cleaning': [
      `Deep cleans target built-up grime in kitchens and bathrooms — popular before hosting or after travel.`,
      `Crew sizing follows V4 hour rules: larger jobs may deploy two or three cleaners to finish within the estimated window.`,
    ],
    'move-out-cleaning': [
      `Move-out visits prioritise handover-ready finishes: floors, surfaces, and wet areas landlords inspect first.`,
      `Book early if your lease end falls on month-end — slots fill faster in ${a} during peak moving season.`,
    ],
    'same-day-cleaning': [
      `When you need a slot fast in ${a}, book online and pick the earliest time the system offers — capacity is live.`,
      `Same-day is subject to cleaner availability; pricing still follows V4 so you see the full labour line before paying.`,
    ],
    'affordable-cleaning': [
      `“Affordable” here means transparent: Quick mode often suits smaller homes; Premium adds time for detail work.`,
      `Compare the two standard examples above — then tune bedrooms and bathrooms to match your real layout.`,
    ],
    'weekly-cleaning': [
      `Recurring cleans keep ${a} homes consistently manageable — less catch-up scrubbing on weekends.`,
      `Set frequency during booking; weekly customers often pair standard cleans with seasonal deep visits.`,
    ],
  };

  return [...byIntent[service], ...common];
}

export function durationExplainer(service: LocalSeoServiceId): string {
  if (service === 'deep-cleaning' || service === 'move-out-cleaning') {
    return 'Deep and move-out services use higher minimum hours than standard cleans — the table shows realistic on-site time for typical homes. Crew size may increase when hours exceed internal thresholds so the job finishes safely within the window.';
  }
  if (service === 'same-day-cleaning') {
    return 'Duration still follows V4 — urgent bookings are not priced on a separate “rush” table for the labour line; any surge layers would appear at checkout if active for your slot.';
  }
  return 'Standard cleans apply time guards so estimates stay realistic for scheduling — your final duration is recalculated when you change bedrooms, bathrooms, extras, or Quick vs Premium mode in the booking flow.';
}

type ExpandedLocalSeoCopyInput = {
  service: LocalSeoServiceId;
  location: LocalSeoLocation;
  intro: string;
  why: string[];
  useCases: string[];
  pricingContext: string;
};

type ExpandedLocalSeoCopyOutput = {
  intro: string;
  why: string[];
  useCases: string[];
  pricingContext: string;
  extraParagraphs: string[];
};

/**
 * Deterministically expands page copy for low-word-count fixes while preserving local intent.
 */
export function expandLocalSeoContentBlocks(input: ExpandedLocalSeoCopyInput): ExpandedLocalSeoCopyOutput {
  const { service, location, intro, why, useCases, pricingContext } = input;
  const seed = getContentVariationSeed(service, location);
  const nearby = pickNearbyNames(location, 3);
  const expandedIntro = `${intro} ${
    nearby
      ? `Customers comparing ${location.displayName} with nearby areas like ${nearby} can use this page to benchmark scope, time, and value before booking.`
      : `Customers in ${location.displayName} can use this page to benchmark scope, time, and value before booking.`
  }`;

  const extraWhy = [
    `The copy and examples on this page are generated for ${location.displayName}, so the guidance reflects local booking patterns rather than generic national averages.`,
    `For ${location.displayName}, most households optimize around predictable arrival windows and transparent total pricing shown before checkout.`,
    `Support and rescheduling are handled with local context in mind, which helps reduce missed appointments and repeat explanation loops.`,
  ][seed % 3];

  const extraUseCase = [
    `In ${location.displayName}, many customers mix routine upkeep with periodic deeper resets to keep effort manageable throughout the month.`,
    `A common pattern in ${location.displayName} is booking around school terms, guests, or tenant handovers where predictable timing matters.`,
    `Households in ${location.displayName} often start with one focused clean and then switch to recurring maintenance once baseline standards are restored.`,
  ][(seed + 1) % 3];

  const expandedPricing = `${pricingContext} Booking windows and final totals are recalculated from your selected property inputs, so estimates remain consistent from page view to checkout.`;

  return {
    intro: expandedIntro,
    why: [...why, extraWhy],
    useCases: [...useCases, extraUseCase],
    pricingContext: expandedPricing,
    extraParagraphs: [
      `Coverage for ${location.displayName} is connected to nearby suburbs and regional service pages to help users compare options quickly while keeping internal navigation clear for search engines.`,
      `This page is updated using the same deterministic content pipeline used across local service pages, which keeps structure stable and avoids thin duplicated templates.`,
    ],
  };
}
