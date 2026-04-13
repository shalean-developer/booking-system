'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { ShaleanAuth } from '@/components/shalean-auth';

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <ShaleanAuth initialTab="signup" />
    </Suspense>
  );
}
