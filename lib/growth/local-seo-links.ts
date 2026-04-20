import type { LocalSeoServiceId } from '@/lib/growth/local-seo-types';
import { LOCAL_SEO_SERVICE_IDS } from '@/lib/growth/local-seo-services';
import { buildLocalSeoCanonical } from '@/lib/growth/local-seo-schema';
import type { LocalSeoLocation } from '@/lib/growth/local-seo-types';
import { getLocationsByRegion, resolveNearbyLocations, slugifyRegion } from '@/lib/growth/local-seo-locations';

const SERVICE_LABEL: Record<LocalSeoServiceId, string> = {
  'cleaning-services': 'Professional cleaning services',
  'deep-cleaning': 'Deep cleaning services',
  'move-out-cleaning': 'Move-out cleaning',
  'same-day-cleaning': 'Same-day cleaning',
  'affordable-cleaning': 'Trusted cleaners',
  'weekly-cleaning': 'Weekly cleaning',
};

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function crossServiceLinksForArea(
  areaSlug: string,
  current: LocalSeoServiceId
): { href: string; label: string }[] {
  return LOCAL_SEO_SERVICE_IDS.filter((id) => id !== current).map((id) => ({
    href: buildLocalSeoCanonical(id, areaSlug),
    label: SERVICE_LABEL[id],
  }));
}

export function nearbyLocationLinks(location: LocalSeoLocation): { href: string; label: string }[] {
  const nearby = resolveNearbyLocations(location, 6);
  const seed = hash(location.slug);
  const patterns = [
    (name: string) => `Professional cleaning services in ${name}`,
    (name: string) => `Book a cleaner in ${name}`,
    (name: string) => `Trusted cleaners in ${name}`,
  ];
  return nearby.map((n) => ({
    href: buildLocalSeoCanonical('cleaning-services', n.slug),
    label: patterns[(seed + hash(n.slug)) % patterns.length](n.displayName),
  }));
}

export function sameRegionLocationLinks(
  location: LocalSeoLocation,
  service: LocalSeoServiceId,
  limit = 6
): { href: string; label: string }[] {
  return getLocationsByRegion(slugifyRegion(location.region))
    .filter((l) => l.slug !== location.slug)
    .slice(0, limit)
    .map((l) => ({
      href: buildLocalSeoCanonical(service, l.slug),
      label: `Trusted cleaners in ${l.displayName}`,
    }));
}

export function regionHubLink(location: LocalSeoLocation, service: LocalSeoServiceId): {
  href: string;
  label: string;
} {
  const regionSlug = slugifyRegion(location.region);
  return {
    href: `/growth/local/${service}/region/${regionSlug}`,
    label: `Explore all cleaning services in ${location.region}`,
  };
}

/** Popular service × location links (internal linking). */
export function popularServiceLinks(areaSlug: string, areaDisplayName: string) {
  const s: LocalSeoServiceId[] = [
    'cleaning-services',
    'deep-cleaning',
    'move-out-cleaning',
    'weekly-cleaning',
  ];
  const seed = hash(areaSlug);
  return s.map((id, index) => ({
    href: buildLocalSeoCanonical(id, areaSlug),
    label:
      id === 'cleaning-services'
        ? [
            `Professional cleaning services in ${areaDisplayName}`,
            `Book a cleaner in ${areaDisplayName}`,
            `Trusted cleaners in ${areaDisplayName}`,
          ][(seed + index) % 3]
        : id === 'deep-cleaning'
          ? `Deep cleaning in ${areaDisplayName}`
          : id === 'move-out-cleaning'
            ? `Move-out cleaning in ${areaDisplayName}`
            : `Weekly cleaning in ${areaDisplayName}`,
  }));
}
