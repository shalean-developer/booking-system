import type { Metadata } from 'next';
import { createMetadata, generateCanonical } from '@/lib/metadata';

export const metadata: Metadata = createMetadata({
  title: 'Login | Shalean Cleaning Services',
  description: 'Sign in to your Shalean account to manage bookings, view cleaning history, and update your preferences.',
  canonical: generateCanonical('/login'),
});

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}









































