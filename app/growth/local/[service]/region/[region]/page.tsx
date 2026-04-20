import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { createMetadata, DESCRIPTION_MAX_LENGTH, SITE_URL, truncateText } from '@/lib/metadata';
import {
  LOCAL_SEO_SERVICE_IDS,
  getServicePageMeta,
  getRegionSlugs,
  getLocationsByRegion,
  slugifyRegion,
} from '@/lib/growth/local-seo-data';
import type { LocalSeoServiceId } from '@/lib/growth/local-seo-types';

type Props = {
  params: Promise<{ service: string; region: string }>;
};

function isServiceId(value: string): value is LocalSeoServiceId {
  return (LOCAL_SEO_SERVICE_IDS as string[]).includes(value);
}

export const revalidate = 86400;

export async function generateStaticParams() {
  const regions = getRegionSlugs();
  return LOCAL_SEO_SERVICE_IDS.flatMap((service) =>
    regions.map((region) => ({
      service,
      region,
    }))
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { service, region } = await params;
  if (!isServiceId(service)) return { title: 'Cleaning services | Shalean' };
  const locations = getLocationsByRegion(region);
  if (locations.length === 0) return { title: 'Cleaning services | Shalean' };
  const regionName = locations[0].region;
  const meta = getServicePageMeta(service, regionName);
  const canonical = `${SITE_URL}/growth/local/${service}/region/${region}`;
  const description = truncateText(
    `Compare ${meta.headline(regionName).toLowerCase()} coverage across ${regionName}. Explore suburb pages, pricing context, and booking options for each local area we serve.`,
    DESCRIPTION_MAX_LENGTH
  );

  return createMetadata({
    title: `${regionName} ${service.replace(/-/g, ' ')} | Shalean`,
    description,
    canonical,
    ogType: 'website',
    keywords: meta.keywordsResolved,
  });
}

export default async function LocalSeoRegionPage({ params }: Props) {
  const { service, region } = await params;
  if (!isServiceId(service)) notFound();
  const locations = getLocationsByRegion(region);
  if (locations.length === 0) notFound();

  const regionName = locations[0].region;
  const meta = getServicePageMeta(service, regionName);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <section className="border-b border-slate-100 bg-gradient-to-b from-slate-50/80 to-white">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            {meta.headline(regionName)}
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Regional coverage overview for {regionName}. Explore suburb pages below to compare availability and book
            a cleaner in your area.
          </p>
          <div className="mt-8">
            <Button asChild size="lg" className="h-12 rounded-xl px-8 text-base font-semibold shadow-sm">
              <Link href={meta.bookHref}>Book online</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold text-slate-900">Suburbs in {regionName}</h2>
        <p className="mt-2 text-slate-600">
          These suburb pages are generated from the same location dataset and link directly into service-specific
          pages.
        </p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {locations.map((location) => (
            <li key={location.slug}>
              <Link
                href={`/growth/local/${service}/${location.slug}`}
                className="block rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium text-slate-800 transition hover:border-primary/40 hover:text-primary"
              >
                {location.displayName}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t border-slate-100 bg-slate-50/50 py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-slate-600">
            Region slug: <code>{slugifyRegion(regionName)}</code> • Total suburb pages: {locations.length}
          </p>
        </div>
      </section>
    </div>
  );
}
