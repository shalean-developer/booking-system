'use client';

import BookingFlow from '@/components/booking-flow';

export function BookingFlowContent({ slug, step }: { slug: string; step: string }) {
  return <BookingFlow initialServiceSlug={slug} initialStep={step} />;
}
