import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

/** Session reads use `cookies()` — must not be statically prerendered at build time. */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Shalean — Cleaner',
  description: 'Manage jobs, status, and earnings',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#2563eb',
};

export default function CleanerLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-dvh bg-slate-50">{children}</div>;
}
