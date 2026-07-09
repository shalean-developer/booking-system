import type { Metadata } from 'next';
import { createMetadata, generateCanonical } from '@/lib/metadata';

export const metadata: Metadata = createMetadata({
  title: 'Book Cleaning Service | Shalean',
  description: 'Book house cleaning in Cape Town and nearby areas.',
  canonical: generateCanonical('/booking-v2'),
});

export default function BookingV2Layout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-zinc-50 text-zinc-900">{children}</div>;
}
