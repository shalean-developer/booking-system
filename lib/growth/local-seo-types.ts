/**
 * Programmatic SEO: service × location × intent pages.
 */

export type LocalSeoServiceId =
  | 'cleaning-services'
  | 'deep-cleaning'
  | 'move-out-cleaning'
  | 'same-day-cleaning'
  | 'affordable-cleaning'
  | 'weekly-cleaning';

export type LocalSeoLocation = {
  slug: string;
  name: string;
  displayName: string;
  region: string;
  parentCity: string;
  /** Internal linking: other `LocalSeoLocation.slug` values nearby */
  nearbySlugs: string[];
  /** Optional local landmarks for micro-local relevance */
  landmarks?: string[];
  /** Unique 2–4 sentence intro for this market (avoid duplicate thin content). */
  localizedIntro: string;
  /** Optional suburb character line for micro-variation */
  neighborhoodNote?: string;
};
