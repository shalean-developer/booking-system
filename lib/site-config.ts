import { SUPPORT_PHONE_DISPLAY, SUPPORT_PHONE_HREF } from '@/lib/contact';

/** Voice / call line (display). */
export const SITE_PHONE_DISPLAY = SUPPORT_PHONE_DISPLAY;

/** E.164-style value for schema.org (from configured call line). */
export const SITE_PHONE_E164 = SUPPORT_PHONE_HREF.replace(/^tel:/i, '').trim() || '+27871535250';

/** Public support inbox — `NEXT_PUBLIC_SUPPORT_EMAIL` or `SUPPORT_EMAIL` in .env.local */
export const SITE_SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() ||
  process.env.SUPPORT_EMAIL?.trim() ||
  'support@shalean.co.za';

export const SOCIAL_PROFILE_URLS = {
  facebook: "https://www.facebook.com/shaleancleaning",
  instagram: "https://www.instagram.com/shalean_cleaning_services/",
  x: "https://x.com/shaloclean",
} as const;

export const ORGANIZATION_SAME_AS = [
  SOCIAL_PROFILE_URLS.facebook,
  SOCIAL_PROFILE_URLS.instagram,
] as const;
