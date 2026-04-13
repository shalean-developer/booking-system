import type { Metadata } from 'next';
import { createMetadata, generateCanonical } from '@/lib/metadata';
import StepGuardClient from './step-guard-client'; // ✅ NEW

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
        'Plan and book home or office cleaning in Cape Town...',
      canonical: generateCanonical(path),
    });
  }

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
  return (
    <>
      <StepGuardClient /> {/* ✅ ADD THIS */}
      {children}
    </>
  );
}