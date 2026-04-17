'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const ShaleanAuth = dynamic(
  () => import('@/components/shalean-auth').then((mod) => mod.ShaleanAuth),
  { ssr: false }
);

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <ShaleanAuth initialTab="signin" />
    </Suspense>
  );
}
