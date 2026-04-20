/**
 * Sitewide trust signals for programmatic SEO (replace with CMS/API later).
 */
export const LOCAL_SEO_TRUST = {
  ratingValue: 4.8,
  bestRating: 5,
  reviewCount: 2840,
  /** Approximate completed jobs — marketing aggregate */
  completedBookingsDisplay: '15,000+',
} as const;

export const LOCAL_SEO_TESTIMONIALS: { quote: string; name: string; context: string }[] = [
  {
    name: 'Nomsa K.',
    context: 'Homeowner',
    quote:
      'Booking took minutes and the team was on time. The place felt properly cleaned, not just tidied.',
  },
  {
    name: 'David R.',
    context: 'Apartment',
    quote:
      'Clear pricing before paying — no surprises. Great for busy weeks when I cannot clean myself.',
  },
  {
    name: 'Priya M.',
    context: 'Move-out',
    quote:
      'They focused on kitchen and bathrooms properly before handover. Made moving week less stressful.',
  },
];
