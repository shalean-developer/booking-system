import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { SeoPageViewLogger } from '@/components/seo-page-view-logger';
import { createMetadata, SITE_URL, truncateText, DESCRIPTION_MAX_LENGTH } from '@/lib/metadata';
import { stringifyStructuredData } from '@/lib/structured-data-validator';
import {
  getLocalSeoLocation,
  getServicePageMeta,
  buildSeoPricingExamples,
  buildLocalSeoFaq,
  buildProgrammaticJsonLd,
  buildLocalSeoCanonical,
  crossServiceLinksForArea,
  nearbyLocationLinks,
  popularServiceLinks,
  sameRegionLocationLinks,
  regionHubLink,
  getLocationsByParentCity,
  getRegionsByParentCity,
  slugifyRegion,
  whyChooseSection,
  generateHowItWorks,
  generateServiceIncludes,
  generateLocalUseCases,
  generatePricingContext,
  trustMicroSignals,
  orderedContentSections,
  durationExplainer,
  expandLocalSeoContentBlocks,
  LOCAL_SEO_LOCATIONS,
  LOCAL_SEO_SERVICE_IDS,
  LOCAL_SEO_TRUST,
  LOCAL_SEO_TESTIMONIALS,
} from '@/lib/growth/local-seo-data';
import type { LocalSeoServiceId } from '@/lib/growth/local-seo-types';
import type { SeoContentPatch } from '@/lib/seo/ai-optimizer';
import { getQuickFixPageStateForUrl } from '@/lib/seo/quick-fix-state';
import { enforceSeoStandards } from '@/lib/seo/enforce-seo-standards';
import { getSeoPatch, mergeSeoContent } from '@/lib/seo/patch-engine';

type Props = { params: Promise<{ service: string; area: string }> };

function isServiceId(s: string): s is LocalSeoServiceId {
  return (LOCAL_SEO_SERVICE_IDS as string[]).includes(s);
}

function dedupeFaqByQuestion<T extends { question: string; answer: string }>(faq: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of faq) {
    const key = item.question.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function dedupeLinksByHref<T extends { href: string; label: string }>(links: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of links) {
    const key = item.href.trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

/** Daily ISR — search engines see fresh trust/pricing copy without rebuilding every request */
export const revalidate = 86400;

export async function generateStaticParams() {
  const out: { service: string; area: string }[] = [];
  for (const service of LOCAL_SEO_SERVICE_IDS) {
    for (const a of LOCAL_SEO_LOCATIONS) {
      out.push({ service, area: a.slug });
    }
  }
  return out;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { service: s, area: areaSlug } = await params;
  if (!isServiceId(s)) return { title: 'Cleaning services | Shalean' };
  const location = getLocalSeoLocation(areaSlug);
  if (!location) return { title: 'Cleaning services | Shalean' };
  const meta = getServicePageMeta(s, location.displayName);
  const canonical = buildLocalSeoCanonical(s, areaSlug);
  const patch = await getSeoPatch(`${s}/${areaSlug}`);
  const patchedMeta = mergeSeoContent(
    {
      title: meta.metaTitle(location.displayName),
      metaDescription: meta.metaDescription(location.displayName),
    },
    patch
  );
  const patchedTitle = patchedMeta.title;
  const patchedDescription = patchedMeta.metaDescription;
  const desc = truncateText(patchedDescription, DESCRIPTION_MAX_LENGTH);

  return createMetadata({
    title: patchedTitle,
    description: desc,
    canonical,
    keywords: meta.keywordsResolved,
    ogType: 'website',
  });
}

export default async function LocalSeoPage({ params }: Props) {
  const { service: s, area: areaSlug } = await params;
  if (!isServiceId(s)) notFound();
  const location = getLocalSeoLocation(areaSlug);
  if (!location) notFound();

  const meta = getServicePageMeta(s, location.displayName);
  const path = `/growth/local/${s}/${areaSlug}`;
  const canonical = buildLocalSeoCanonical(s, areaSlug);
  const pricingExamples = buildSeoPricingExamples(s);
  const priceFromZar =
    pricingExamples.length > 0 ? Math.min(...pricingExamples.map((p) => p.priceZar)) : 420;

  const quickFixState = await getQuickFixPageStateForUrl(canonical);
  const quickFixFlags = quickFixState.flags;
  const patch = await getSeoPatch(`${s}/${areaSlug}`);
  const contentPatch = mergeSeoContent<SeoContentPatch>(quickFixState.contentPatch ?? {}, patch);
  const patchedTitle = contentPatch.title ?? meta.metaTitle(location.displayName);
  const patchedMetaDescription = contentPatch.metaDescription ?? meta.metaDescription(location.displayName);
  const faq = buildLocalSeoFaq(location, s);
  const injectedFaq =
    quickFixFlags.injectFaqModule
      ? [
          ...faq,
          {
            question: `What neighborhoods around ${location.displayName} are commonly booked?`,
            answer: location.nearbySlugs.length
              ? `Customers frequently book in ${location.displayName} and nearby areas like ${location.nearbySlugs.slice(0, 3).map((slug) => slug.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')).join(', ')}.`
              : `Customers frequently book in ${location.displayName} and nearby suburbs in ${location.region}.`,
          },
          {
            question: `How should I choose between service options in ${location.displayName}?`,
            answer:
              'Compare examples on this page first, then adjust bedrooms, bathrooms, and extras in checkout to match your exact home and preferred cleaning depth.',
          },
        ].slice(0, 10)
      : faq;
  const baseNearby = nearbyLocationLinks(location);
  const baseServiceVariations = crossServiceLinksForArea(areaSlug, s);
  const baseSameRegion = sameRegionLocationLinks(location, s, 12);
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Cleaning Services',
        item: `${SITE_URL}/services`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: location.displayName,
        item: `${SITE_URL}/growth/local/cleaning-services/${location.slug}`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: meta.headline(location.displayName),
        item: canonical,
      },
    ],
  };

  const nearby = baseNearby.slice(0, quickFixFlags.boostInternalLinks ? 10 : 6);
  const serviceVariations = baseServiceVariations.slice(0, quickFixFlags.boostInternalLinks ? 10 : 6);
  const popular = popularServiceLinks(areaSlug, location.displayName);
  const sameRegion = baseSameRegion.slice(0, quickFixFlags.boostInternalLinks ? 12 : 6);
  const regionLink = regionHubLink(location, s);
  const isCapeTownCityHub = s === 'cleaning-services' && areaSlug === 'cape-town';
  const capeTownRegions = isCapeTownCityHub ? getRegionsByParentCity('Cape Town') : [];
  const capeTownSuburbs = isCapeTownCityHub
    ? getLocationsByParentCity('Cape Town').filter((l) => l.slug !== 'cape-town')
    : [];
  let introText = contentPatch.intro ?? location.localizedIntro;
  let why = whyChooseSection(location, s);
  const howItWorks = generateHowItWorks(s, location);
  const serviceIncludes = generateServiceIncludes(s);
  let localUseCases = generateLocalUseCases(s, location);
  let pricingContext = generatePricingContext(s, location);
  let extraContentParagraphs: string[] = [];
  if (quickFixFlags.expandContentBlocks) {
    const expanded = expandLocalSeoContentBlocks({
      service: s,
      location,
      intro: introText,
      why,
      useCases: localUseCases,
      pricingContext,
    });
    introText = expanded.intro;
    why = expanded.why;
    localUseCases = expanded.useCases;
    pricingContext = expanded.pricingContext;
    extraContentParagraphs = expanded.extraParagraphs;
  }
  const enforcedSeo = enforceSeoStandards({
    url: canonical,
    service: s,
    location,
    title: patchedTitle,
    description: patchedMetaDescription,
    introText,
    why,
    localUseCases,
    pricingContext,
    extraContentParagraphs,
    faq: dedupeFaqByQuestion(contentPatch.faq && contentPatch.faq.length > 0 ? contentPatch.faq : injectedFaq),
    nearbyLinks: nearby,
    serviceVariationLinks: serviceVariations,
    sameRegionLinks: sameRegion,
    includeSchema: quickFixFlags.enhanceJsonLd,
  });
  introText = enforcedSeo.introText;
  why = enforcedSeo.why;
  localUseCases = enforcedSeo.localUseCases;
  pricingContext = enforcedSeo.pricingContext;
  extraContentParagraphs = enforcedSeo.extraContentParagraphs;
  const finalFaq = enforcedSeo.faq;
  const patchInternalLinks = contentPatch.internalLinks ?? [];
  const internalLinkObjects = patchInternalLinks.map((href) => ({
    href,
    label: `Related local cleaning page`,
  }));
  const finalNearby = dedupeLinksByHref([...enforcedSeo.nearbyLinks, ...internalLinkObjects]).slice(0, 12);
  const finalServiceVariations = dedupeLinksByHref([
    ...enforcedSeo.serviceVariationLinks,
    ...internalLinkObjects,
  ]).slice(0, 12);
  const finalSameRegion = enforcedSeo.sameRegionLinks;
  const jsonLd = buildProgrammaticJsonLd({
    service: s,
    location,
    canonicalUrl: canonical,
    faq: finalFaq,
    priceFromZar,
    includeEnhancedSchema: enforcedSeo.includeSchema,
  });
  const trustSignals = trustMicroSignals();
  const sectionOrder = orderedContentSections(s, location);
  const testimonials = LOCAL_SEO_TESTIMONIALS.slice(0, 2);

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: stringifyStructuredData(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: stringifyStructuredData(breadcrumbJsonLd) }}
      />
      <SeoPageViewLogger service={s} area_slug={areaSlug} path={path} />
      <Header />

      <section className="border-b border-slate-100 bg-gradient-to-b from-slate-50/80 to-white">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-800 font-semibold">
              ★ {LOCAL_SEO_TRUST.ratingValue}/{LOCAL_SEO_TRUST.bestRating} · {LOCAL_SEO_TRUST.completedBookingsDisplay}{' '}
              cleans
            </span>
            <span className="text-slate-400">|</span>
            <span>{location.displayName} · {location.region}</span>
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            {meta.headline(location.displayName)}
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-slate-600 sm:text-xl">{introText}</p>
          {location.neighborhoodNote ? (
            <p className="mt-3 text-sm text-slate-500">{location.neighborhoodNote}</p>
          ) : null}
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="h-12 rounded-xl px-8 text-base font-semibold shadow-sm">
              <Link href={meta.bookHref}>Book online</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 rounded-xl border-slate-200 bg-white px-6 text-base font-semibold"
            >
              <Link href="/services">All services</Link>
            </Button>
          </div>
        </div>
      </section>

      <article className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-14">
        <section aria-labelledby="why-heading">
          <h2 id="why-heading" className="text-2xl font-semibold text-slate-900">
            Why choose Shalean in {location.displayName}
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-600">
            {why.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </section>

        {sectionOrder.map((sectionKey) => {
          if (sectionKey === 'how') {
            return (
              <section key="how" aria-labelledby="how-it-works-heading">
                <h2 id="how-it-works-heading" className="text-2xl font-semibold text-slate-900">
                  How service works in {location.displayName}
                </h2>
                <ol className="mt-4 list-decimal space-y-2 pl-5 text-slate-600">
                  {howItWorks.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </section>
            );
          }

          if (sectionKey === 'includes') {
            return (
              <section key="includes" aria-labelledby="includes-heading">
                <h2 id="includes-heading" className="text-2xl font-semibold text-slate-900">
                  What&apos;s included
                </h2>
                <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-600">
                  {serviceIncludes.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            );
          }

          return (
            <section key="useCases" aria-labelledby="local-use-cases-heading">
              <h2 id="local-use-cases-heading" className="text-2xl font-semibold text-slate-900">
                Local use cases in {location.displayName}
              </h2>
              <p className="mt-3 text-slate-600">{localUseCases[0]}</p>
              <p className="mt-3 text-slate-600">{localUseCases[1]}</p>
              {extraContentParagraphs.map((paragraph) => (
                <p key={paragraph} className="mt-3 text-slate-600">
                  {paragraph}
                </p>
              ))}
            </section>
          );
        })}

        <section aria-labelledby="pricing-heading">
          <h2 id="pricing-heading" className="text-2xl font-semibold text-slate-900">
            Pricing examples in {location.displayName} (V4 engine)
          </h2>
          <p className="mt-3 text-slate-600">{pricingContext}</p>
          <p className="mt-3 text-slate-600">
            Figures below are live outputs from <strong>calculateBookingV4</strong> (labour line). Checkout may add
            surge, loyalty, or promo layers — your quote step shows the final total.
          </p>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">Scenario</th>
                  <th className="px-4 py-3 font-semibold">Home</th>
                  <th className="px-4 py-3 font-semibold">Price</th>
                  <th className="px-4 py-3 font-semibold">Est. hours</th>
                  <th className="px-4 py-3 font-semibold">Team</th>
                </tr>
              </thead>
              <tbody>
                {pricingExamples.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 text-slate-900">{row.label}</td>
                    <td className="px-4 py-3 text-slate-600">{row.homeDescription}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">R{row.priceZar.toLocaleString('en-ZA')}</td>
                    <td className="px-4 py-3 text-slate-600">{row.hoursOnSite} h</td>
                    <td className="px-4 py-3 text-slate-600">{row.teamSize}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-slate-500">{pricingExamples[0]?.modeLabel ?? 'V4'}</p>
        </section>

        <section aria-labelledby="duration-heading">
          <h2 id="duration-heading" className="text-2xl font-semibold text-slate-900">
            How long cleaning takes in {location.displayName}
          </h2>
          <p className="mt-3 text-slate-600">{durationExplainer(s)}</p>
        </section>

        <section aria-labelledby="popular-heading">
          <h2 id="popular-heading" className="text-2xl font-semibold text-slate-900">
            Popular cleaning services in {location.displayName}
          </h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {popular.map((p) => (
              <li key={p.href}>
                <Link href={p.href} className="font-medium text-primary hover:underline">
                  {p.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="nearby-heading">
          <h2 id="nearby-heading" className="text-2xl font-semibold text-slate-900">
            Nearby areas
          </h2>
          <p className="mt-3 text-slate-600">
            Explore home cleaning pages for suburbs near {location.displayName} — internal links help Google understand
            local coverage.
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {finalNearby.map((n) => (
              <li key={n.href}>
                <Link
                  href={n.href}
                  className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-800 hover:border-primary hover:bg-white"
                >
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="region-heading">
          <h2 id="region-heading" className="text-2xl font-semibold text-slate-900">
            More areas in {location.region}
          </h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {finalSameRegion.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="font-medium text-primary hover:underline">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-slate-600">
            <Link href={regionLink.href} className="font-medium text-primary hover:underline">
              {regionLink.label}
            </Link>
          </p>
        </section>

        {isCapeTownCityHub && (
          <section aria-labelledby="cape-town-hub-heading">
            <h2 id="cape-town-hub-heading" className="text-2xl font-semibold text-slate-900">
              Cape Town cleaning coverage
            </h2>
            <p className="mt-3 text-slate-600">
              Browse cleaning coverage by region and suburb across Cape Town.
            </p>
            <h3 className="mt-6 text-lg font-semibold text-slate-900">Regions</h3>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {capeTownRegions.map((region) => (
                <li key={region}>
                  <Link
                    href={`/growth/local/cleaning-services/region/${slugifyRegion(region)}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {region}
                  </Link>
                </li>
              ))}
            </ul>
            <h3 className="mt-8 text-lg font-semibold text-slate-900">Suburbs</h3>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {capeTownSuburbs.map((suburb) => (
                <li key={suburb.slug}>
                  <Link
                    href={`/growth/local/cleaning-services/${suburb.slug}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {suburb.displayName}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="related-heading">
          <h2 id="related-heading" className="text-2xl font-semibold text-slate-900">
            Other service pages for {location.displayName}
          </h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {finalServiceVariations.map((c) => (
              <li key={c.href}>
                <Link href={c.href} className="text-primary font-medium hover:underline">
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="trust-heading">
          <h2 id="trust-heading" className="text-2xl font-semibold text-slate-900">
            What customers say
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {trustSignals.map((signal) => (
              <li
                key={signal}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
              >
                {signal}
              </li>
            ))}
          </ul>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {testimonials.map((t) => (
              <blockquote
                key={t.name}
                className="rounded-2xl border border-slate-100 bg-slate-50/80 p-5 text-slate-700"
              >
                <p className="text-sm leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                <footer className="mt-3 text-xs font-semibold text-slate-500">
                  {t.name} · {t.context}
                </footer>
              </blockquote>
            ))}
          </div>
        </section>

        <section aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="text-2xl font-semibold text-slate-900">
            FAQ — {location.displayName}
          </h2>
          <dl className="mt-6 space-y-6">
            {finalFaq.map((item) => (
              <div key={item.question}>
                <dt className="font-semibold text-slate-900">{item.question}</dt>
                <dd className="mt-1 text-slate-600">{item.answer}</dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-8 text-center">
          <p className="text-sm font-semibold text-slate-900">Book {location.displayName} cleaning</p>
          <Button asChild className="mt-4 rounded-xl px-8 font-semibold" size="lg">
            <Link href={meta.bookHref}>Get a live quote</Link>
          </Button>
          <p className="mt-4 text-xs text-slate-500">
            <Link href="/" className="underline underline-offset-2">
              {SITE_URL.replace('https://', '')}
            </Link>
            {' · '}
            <Link href={canonical} className="underline underline-offset-2">
              Canonical URL
            </Link>
          </p>
        </div>
      </article>
    </div>
  );
}
