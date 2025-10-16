'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CalculatorRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/booking/service/select');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
        <p className="mt-4 text-slate-600">Redirecting to booking...</p>
      </div>
    </div>
  );
}
