'use client';

import dynamic from 'next/dynamic';

export const LazyHomeServiceAreas = dynamic(
  () => import('@/components/home-service-areas').then((mod) => ({ default: mod.HomeServiceAreas })),
  {
    ssr: false,
    loading: () => (
      <div className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse bg-gray-200 h-96 rounded-lg" />
        </div>
      </div>
    ),
  }
);

export const LazyHomeFlagshipServices = dynamic(
  () => import('@/components/home-flagship-services').then((mod) => ({ default: mod.HomeFlagshipServices })),
  {
    ssr: false,
    loading: () => (
      <div className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse bg-gray-200 h-96 rounded-lg" />
        </div>
      </div>
    ),
  }
);

export const LazyHomeServiceOfferings = dynamic(
  () => import('@/components/home-service-offerings').then((mod) => ({ default: mod.HomeServiceOfferings })),
  {
    ssr: false,
    loading: () => (
      <div className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="animate-pulse bg-gray-200 h-80 rounded-lg" />
            <div className="animate-pulse bg-gray-200 h-80 rounded-lg" />
            <div className="animate-pulse bg-gray-200 h-80 rounded-lg" />
          </div>
        </div>
      </div>
    ),
  }
);

export const LazyHomeReviewsShowcase = dynamic(
  () => import('@/components/home-reviews-showcase').then((mod) => ({ default: mod.HomeReviewsShowcase })),
  {
    ssr: false,
    loading: () => (
      <div className="py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse bg-gray-200 h-64 rounded-lg" />
        </div>
      </div>
    ),
  }
);

export const LazyHomeFeaturedIn = dynamic(
  () => import('@/components/home-featured-in').then((mod) => ({ default: mod.HomeFeaturedIn })),
  {
    ssr: false,
    loading: () => (
      <div className="py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse bg-gray-200 h-32 rounded-lg" />
        </div>
      </div>
    ),
  }
);

export const LazyHomeFinalCTA = dynamic(
  () => import('@/components/home-final-cta').then((mod) => ({ default: mod.HomeFinalCTA })),
  {
    ssr: false,
    loading: () => (
      <div className="py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse bg-gray-200 h-48 rounded-lg" />
        </div>
      </div>
    ),
  }
);

export const LazyHomeTeam = dynamic(
  () => import('@/components/home-team').then((mod) => ({ default: mod.HomeTeam })),
  {
    ssr: false,
    loading: () => (
      <div className="py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-pulse bg-gray-200 h-8 w-64 mx-auto mb-4 rounded" />
            <div className="animate-pulse bg-gray-200 h-4 w-96 mx-auto mb-8 rounded" />
            <div className="grid gap-4 md:grid-cols-3 sm:gap-6 lg:gap-8">
              <div className="animate-pulse bg-gray-200 h-64 rounded" />
              <div className="animate-pulse bg-gray-200 h-64 rounded" />
              <div className="animate-pulse bg-gray-200 h-64 rounded" />
            </div>
          </div>
        </div>
      </div>
    ),
  }
);

export const LazyHomeBlog = dynamic(
  () => import('@/components/home-blog').then((mod) => ({ default: mod.HomeBlog })),
  {
    ssr: false,
    loading: () => (
      <div className="py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-pulse bg-gray-200 h-8 w-64 mx-auto mb-4 rounded" />
            <div className="animate-pulse bg-gray-200 h-4 w-96 mx-auto mb-8 rounded" />
            <div className="grid gap-4 md:grid-cols-3 sm:gap-6 lg:gap-8">
              <div className="animate-pulse bg-gray-200 h-80 rounded" />
              <div className="animate-pulse bg-gray-200 h-80 rounded" />
              <div className="animate-pulse bg-gray-200 h-80 rounded" />
            </div>
          </div>
        </div>
      </div>
    ),
  }
);

export const LazyHomeFAQ = dynamic(
  () => import('@/components/home-faq').then((mod) => ({ default: mod.HomeFAQ })),
  {
    ssr: false,
    loading: () => (
      <div className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="animate-pulse bg-gray-200 h-8 w-64 mx-auto mb-4 rounded" />
          </div>
          <div className="space-y-4">
            <div className="animate-pulse bg-white h-20 rounded-lg" />
            <div className="animate-pulse bg-white h-20 rounded-lg" />
          </div>
        </div>
      </div>
    ),
  }
);

export const LazyHomeFooter = dynamic(
  () => import('@/components/home-footer').then((mod) => ({ default: mod.HomeFooter })),
  {
    ssr: false,
    loading: () => (
      <div className="bg-gray-900 text-white py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse bg-gray-800 h-32 rounded" />
        </div>
      </div>
    ),
  }
);

