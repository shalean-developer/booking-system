import type { Metadata } from 'next';
import { createMetadata, generateCanonical } from '@/lib/metadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ serviceType: string; step: string }>;
}): Promise<Metadata> {
  const { serviceType, step } = await params;
  const path = `/booking/service/${serviceType}/${step}`;

  if (step === 'plan') {
    return createMetadata({
      title: 'Book a Cleaning Plan | Shalean Cleaning Services',
      description:
        'Plan and book home or office cleaning in Cape Town. Choose regular, deep, or one-off cleaning. Same-day options, transparent pricing, and vetted cleaners.',
      canonical: generateCanonical(path),
    });
  }

  // Other steps use minimal metadata (parent booking layout provides defaults)
  return {
    title: 'Book Cleaning Service | Shalean',
    alternates: { canonical: generateCanonical(path) },
  };
}

export default function ServiceStepLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
