import type { ServiceType } from '@/types/booking';

/** Maps marketing `/services/*` hrefs to API `service` values for pricing. */
export const HREF_TO_CORE_SERVICE: Record<string, ServiceType> = {
  '/services/regular-cleaning': 'Standard',
  '/services/deep-cleaning': 'Deep',
  '/services/move-turnover': 'Move In/Out',
  '/services/apartment-cleaning': 'Standard',
  '/services/home-maintenance': 'Standard',
  '/services/office-cleaning': 'Standard',
  '/services/airbnb-cleaning': 'Airbnb',
  '/services/post-construction-cleaning': 'Deep',
  '/services/window-cleaning': 'Standard',
  '/services/one-time-cleaning': 'Standard',
};
