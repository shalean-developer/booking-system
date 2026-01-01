import type { ServiceType } from '@/types/booking';
import type { LucideIcon } from 'lucide-react';
import { Home, Building, Star, Calendar } from 'lucide-react';
import { PRICING } from '@/lib/pricing';
import type { BookingFormService } from '@/lib/useBookingFormData';

// Icon name to component mapping
export const iconMap: Record<string, LucideIcon> = {
  Home,
  Building,
  Star,
  Calendar,
};

// Fallback services (used when database is unavailable)
export const fallbackServices: BookingFormService[] = [
  {
    type: 'Standard',
    label: 'Standard Cleaning',
    subLabel: 'Weekly or fortnightly upkeep',
    description: 'Kitchen, bathrooms, dusting, floors and tidy-up to keep your home guest ready.',
    badge: 'Popular',
    image: '/images/service-standard-cleaning.jpg',
    checklist: [
      'Kitchen counters, stovetop and appliance fronts wiped',
      'Bathrooms sanitised and mirrors polished',
      'Dusting, vacuuming and mopping throughout the home',
      'Beds made plus general tidy of living spaces',
    ],
    icon: 'Home',
    displayOrder: 0,
  },
  {
    type: 'Deep',
    label: 'Deep Cleaning',
    subLabel: 'Once-off refresh',
    description: 'Inside appliances, grout scrub and detailed wipe-downs for seasonal or post-event resets.',
    image: '/images/service-deep-cleaning.jpg',
    checklist: [
      'Inside oven, fridge and cupboards detailed clean',
      'Tile grout, taps and bathroom fittings scrubbed',
      'Baseboards, skirting and door frames wiped down',
      'Built-up grime and limescale treated throughout',
    ],
    icon: 'Star',
    displayOrder: 1,
  },
  {
    type: 'Move In/Out',
    label: 'Move In / Out',
    subLabel: 'Make moving day easier',
    description: 'Full top-to-bottom clean including cupboards and surfaces so you can hand over with confidence.',
    image: '/images/move-turnover.jpg',
    checklist: [
      'Cabinets, shelves and wardrobes cleaned inside',
      'Appliances deep cleaned and polished ready for handover',
      'Walls, switches and skirting wiped for scuff marks',
      'Floors vacuumed and mopped in every room',
    ],
    icon: 'Building',
    displayOrder: 2,
  },
  {
    type: 'Airbnb',
    label: 'Airbnb Cleaning',
    subLabel: 'For short-term rentals',
    description: 'Quick turnarounds with linen change, staging touches and supply restock between guests.',
    image: '/images/service-airbnb-cleaning.jpg',
    checklist: [
      'Fresh linen change, beds styled and throw cushions fluffed',
      'Bathroom reset with hotel touches and toiletries replenished',
      'Kitchen tidied with dishes done and surfaces sanitised',
      'Amenities restocked and space lightly staged for arrivals',
    ],
    icon: 'Calendar',
    displayOrder: 3,
  },
];

// Fallback extras (used when database is unavailable)
export const fallbackAllExtrasList = Object.keys(PRICING.extras) as Array<keyof typeof PRICING.extras>;

// Standard/Airbnb extras: include Laundry & Ironing (combined) since PRICING only has combined version
export const fallbackStandardAndAirbnbExtras: Array<keyof typeof PRICING.extras> = [
  'Inside Fridge',
  'Inside Oven',
  'Laundry & Ironing',
  'Interior Walls',
  'Interior Windows',
  'Inside Cabinets',
];

// Deep and Move In/Out extras: exclude Standard/Airbnb extras (including Laundry & Ironing)
// Note: If database has separate "Laundry" and "Ironing", they will be filtered out via API logic
export const fallbackDeepAndMoveExtras = fallbackAllExtrasList.filter(
  (extra) => !fallbackStandardAndAirbnbExtras.includes(extra) && 
             extra !== 'Laundry & Ironing'
);

export const fallbackQuantityExtras = new Set<keyof typeof PRICING.extras>([
  'Carpet Cleaning',
  'Couch Cleaning',
  'Ceiling Cleaning',
  'Mattress Cleaning',
]);

export const DEFAULT_QUANTITY = 1;
export const MAX_QUANTITY = 5;

export const fallbackExtrasDisplayNames: Partial<Record<keyof typeof PRICING.extras, string>> = {
  'Outside Window Cleaning': 'Exterior Windows',
};

export const fallbackExtrasMeta: Record<keyof typeof PRICING.extras, { blurb: string }> = {
  'Inside Fridge': { blurb: 'Wipe shelves, trays and seals' },
  'Inside Oven': { blurb: 'Remove grease and baked-on mess' },
  'Inside Cabinets': { blurb: 'Empty, dust and reset cupboards' },
  'Interior Windows': { blurb: 'Inside glass, tracks and frames' },
  'Interior Walls': { blurb: 'Spot-clean scuffs and marks' },
  'Laundry & Ironing': { blurb: 'Wash, dry, fold and press 10–15 garments per visit' },
  'Carpet Cleaning': { blurb: 'Deep clean high-traffic carpet zones' },
  'Ceiling Cleaning': { blurb: 'Remove cobwebs and ceiling dust build-up' },
  'Garage Cleaning': { blurb: 'Sweep, dust and organise your garage floor' },
  'Balcony Cleaning': { blurb: 'Wash floors, railings and outdoor furniture' },
  'Couch Cleaning': { blurb: 'Refresh upholstery with fabric-safe cleaner' },
  'Mattress Cleaning': { blurb: 'Deep clean and sanitize mattresses' },
  'Outside Window Cleaning': { blurb: 'Exterior glass and frames washed' },
};

