import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { Suspense } from 'react';

import { BookingFlowContent } from '../booking-flow-content';
import { createMetadata, generateCanonical } from '@/lib/metadata';
import { isValidStep } from '@/lib/booking-utils';

const ALLOWED_SERVICE_SLUGS = [
  'standard',
  'deep',
  'move-in-out',
  'airbnb',
  'carpet',
] as const;

type AllowedServiceSlug = (typeof ALLOWED_SERVICE_SLUGS)[number];

function isValidServiceSlug(value: string): value is AllowedServiceSlug {
  return (ALLOWED_SERVICE_SLUGS as readonly string[]).includes(value);
}

function getServiceTitle(slug: AllowedServiceSlug): string {
  switch (slug) {
    case 'standard':
      return 'Standard Cleaning';
    case 'deep':
      return 'Deep Cleaning';
    case 'move-in-out':
      return 'Move In/Out Cleaning';
    case 'airbnb':
      return 'Airbnb Cleaning';
    case 'carpet':
      return 'Carpet Cleaning';
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; step: string }>;
}): Promise<Metadata> {
  const { slug, step } = await params;

  if (!isValidServiceSlug(slug)) {
    return createMetadata({
      title: 'Book Cleaning Service | Shalean',
      description:
        'Book professional cleaning services in Cape Town. Choose from regular cleaning, deep cleaning, move-in/out, and Airbnb cleaning. Same-day availability.',
      canonical: generateCanonical('/booking'),
      robots: 'noindex,follow',
    });
  }

  // Validate step - redirect invalid steps
  if (!isValidStep(step)) {
    return createMetadata({
      title: `Book ${getServiceTitle(slug)} | Shalean`,
      description:
        'Book professional cleaning services in Cape Town with transparent pricing and flexible scheduling. Choose your service, add extras, and confirm in minutes.',
      canonical: generateCanonical(`/booking/${slug}/details`),
      robots: 'index,follow',
    });
  }

  const canonicalPath = `/booking/${slug}/${step}`;

  return createMetadata({
    title: `Book ${getServiceTitle(slug)} | Shalean`,
    description:
      'Book professional cleaning services in Cape Town with transparent pricing and flexible scheduling. Choose your service, add extras, and confirm in minutes.',
    canonical: generateCanonical(canonicalPath),
    robots: 'index,follow',
  });
}

export default async function BookingServiceStepPage({
  params,
}: {
  params: Promise<{ slug: string; step: string }>;
}) {
  const { slug, step } = await params;

  if (!isValidServiceSlug(slug)) {
    notFound();
  }

  // Redirect invalid steps to details
  if (!isValidStep(step)) {
    redirect(`/booking/${slug}/details`);
  }

  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading booking...</p>
        </div>
      </div>
    }>
      <BookingFlowContent slug={slug} step={step} />
    </Suspense>
  );
}
