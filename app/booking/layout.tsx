import type { Metadata } from 'next';
import { createMetadata, generateCanonical } from '@/lib/metadata';

export const metadata: Metadata = createMetadata({
  title: 'Book Cleaning Service | Shalean',
  description:
    'Book house cleaning in Cape Town and nearby areas including Bellville, Claremont, Sea Point, Durbanville, Milnerton, Wynberg, and more. Same-day slots available.',
  keywords: [
    'house cleaning cape town',
    'home cleaning cape town',
    'house cleaners bellville',
    'house cleaning claremont',
    'house cleaning sea point',
    'house cleaning durbanville',
    'house cleaning milnerton',
    'house cleaning wynberg',
    'deep cleaning cape town',
    'move out cleaning cape town',
  ],
  canonical: generateCanonical('/booking/service/standard/plan'),
});

export default function BookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
    </>
  );
}

