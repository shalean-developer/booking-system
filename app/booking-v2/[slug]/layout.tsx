import type { Metadata } from 'next';
import { generateCanonical } from '@/lib/metadata';

export const metadata: Metadata = {
  alternates: {
    canonical: generateCanonical('/booking/service/select'),
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function BookingV2SlugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

