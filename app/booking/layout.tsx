import { Header } from '@/components/header';
import type { Metadata } from 'next';
import { createMetadata, generateCanonical } from '@/lib/metadata';

export const metadata: Metadata = createMetadata({
  title: 'Book Cleaning Service | Shalean',
  description: 'Book professional cleaning services in Cape Town. Choose from regular cleaning, deep cleaning, move-in/out, and Airbnb cleaning. Same-day availability.',
  canonical: generateCanonical('/booking/service/select'),
});

export default function BookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      {children}
    </>
  );
}

