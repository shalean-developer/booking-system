import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Button } from "@/components/ui/button";
import {
  createMetadata,
  DESCRIPTION_MAX_LENGTH,
  generateOgImageUrl,
  SITE_URL,
  truncateText,
  type PageMetadata,
} from "@/lib/metadata";
import {
  cleanStructuredData,
  normalizeImageUrl,
  stringifyStructuredData,
} from "@/lib/structured-data-validator";
import {
  getPublishedLocationPageBySlug,
  getPublishedLocationSlugs,
} from "@/lib/location-pages-server";

type Props = {
  params: Promise<{ location: string }>;
};

export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await getPublishedLocationSlugs();
  return slugs.map((location) => ({ location }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { location } = await params;
  const page = await getPublishedLocationPageBySlug(location);
  if (!page) {
    return { title: "Service area | Shalean Cleaning Services" };
  }

  const pageTitle =
    page.meta_title?.trim() ||
    truncateText(`${page.title} | Shalean Cleaning`, 70);
  const rawDesc =
    page.meta_description?.trim() ||
    `Professional home cleaning in ${page.city}. Book vetted cleaners online — flexible scheduling and satisfaction guaranteed.`;
  const description =
    rawDesc.length > DESCRIPTION_MAX_LENGTH
      ? truncateText(rawDesc, DESCRIPTION_MAX_LENGTH)
      : rawDesc;

  const keywordList = page.keywords
    ? page.keywords
        .split(/[,;]/)
        .map((k) => k.trim())
        .filter(Boolean)
    : undefined;

  const ogUrl =
    normalizeImageUrl(page.featured_image || undefined) ||
    generateOgImageUrl("services");

  const pageMeta: PageMetadata = {
    title: pageTitle,
    description,
    canonical: `${SITE_URL}/services/${page.slug}`,
    ...(keywordList && keywordList.length > 0 && { keywords: keywordList }),
    ogType: "website",
    ogImage: {
      url: ogUrl,
      alt: page.title,
    },
  };

  return createMetadata(pageMeta);
}

const BOOK_HREF = "/booking/service/standard/plan";

export default async function ServiceLocationPage({ params }: Props) {
  const { location } = await params;
  const page = await getPublishedLocationPageBySlug(location);

  if (!page) {
    notFound();
  }

  const jsonLd = cleanStructuredData({
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.title,
    description: page.meta_description || undefined,
    url: `${SITE_URL}/services/${page.slug}`,
    isPartOf: {
      "@type": "WebSite",
      name: "Shalean Cleaning Services",
      url: SITE_URL,
    },
    about: {
      "@type": "Service",
      name: "Home cleaning",
      areaServed: {
        "@type": "City",
        name: page.city,
      },
    },
  });

  const breadcrumbItems = [
    { name: "Home", href: "/" },
    { name: "Services", href: "/services" },
    { name: page.city, href: `/services/${page.slug}` },
  ];

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: stringifyStructuredData(jsonLd) }}
      />
      <Header />

      <Breadcrumbs items={breadcrumbItems} />

      <section className="border-b border-slate-100 bg-gradient-to-b from-slate-50/80 to-white">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-medium uppercase tracking-wide text-primary">
                {page.region ? `${page.city} · ${page.region}` : page.city}
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                {page.title}
              </h1>
              {page.hero_subtitle && (
                <p className="mt-4 text-lg leading-relaxed text-slate-600 sm:text-xl">
                  {page.hero_subtitle}
                </p>
              )}
              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  asChild
                  size="lg"
                  className="h-12 rounded-xl px-8 text-base font-semibold shadow-sm"
                >
                  <Link href={BOOK_HREF}>Book Now</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-12 rounded-xl border-slate-200 bg-white px-6 text-base font-semibold"
                >
                  <Link href="/services">View services</Link>
                </Button>
              </div>
            </div>
            {page.featured_image && page.featured_image.trim() !== "" ? (
              <div className="relative aspect-[4/3] w-full max-w-md shrink-0 overflow-hidden rounded-2xl border border-slate-100 bg-slate-100 shadow-sm lg:aspect-square lg:w-80">
                <Image
                  src={page.featured_image}
                  alt={page.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 320px"
                  priority
                />
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="border-b border-slate-100 bg-white py-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-6 rounded-2xl border border-slate-100 bg-slate-50/80 p-6 sm:flex-row sm:items-center sm:p-8">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Ready for a spotless home?</h2>
              <p className="mt-1 text-sm text-slate-600">
                Same-day options in select areas. Eco-friendly products. 100% satisfaction focus.
              </p>
            </div>
            <Button
              asChild
              size="lg"
              className="w-full shrink-0 rounded-xl px-8 font-semibold shadow-sm sm:w-auto"
            >
              <Link href={BOOK_HREF}>Book Now</Link>
            </Button>
          </div>
        </div>
      </section>

      <article className="py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div
            className="blog-prose"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        </div>
      </article>

      <section className="border-t border-slate-100 bg-slate-50/50 py-14">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-slate-900">Book cleaning in {page.city}</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-600">
            Get an instant quote and choose a time that works for you.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-8 h-12 rounded-xl px-10 text-base font-semibold shadow-md"
          >
            <Link href={BOOK_HREF}>Book Now</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
