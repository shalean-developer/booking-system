'use client';

import dynamic from 'next/dynamic';

// Dynamically import Toaster to reduce initial bundle size
const Toaster = dynamic(
  () => import('sonner').then((mod) => mod.Toaster),
  {
    ssr: false,
    loading: () => null,
  }
);

export default function ToasterWrapper() {
  return <Toaster position="top-center" richColors />;
}

