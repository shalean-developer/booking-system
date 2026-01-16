'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * Redirect to new unified booking flow
 * The /booking/service/[slug]/details page has service selection built in
 */
function ServiceSelectRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Check for service query parameter (e.g., ?service=Standard)
    const serviceParam = searchParams.get('service');
    const recurring = searchParams.get('recurring');
    const extras = searchParams.get('extras');
    
    // Map service types to slugs
    let slug = 'standard'; // default
    if (serviceParam) {
      const serviceMap: Record<string, string> = {
        'Standard': 'standard',
        'Deep': 'deep',
        'Move In/Out': 'move-in-out',
        'Airbnb': 'airbnb',
        'Carpet': 'carpet',
      };
      slug = serviceMap[serviceParam] || 'standard';
    }
    
    // Build redirect URL with query params
    let redirectUrl = `/booking/service/${slug}/details`;
    const params = new URLSearchParams();
    if (recurring) params.set('recurring', recurring);
    if (extras) params.set('extras', extras);
    if (params.toString()) {
      redirectUrl += `?${params.toString()}`;
    }
    
    router.replace(redirectUrl);
  }, [router, searchParams]);
  
  // Show loading while redirecting
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
        <p className="mt-4 text-sm text-slate-500">Redirecting to booking...</p>
      </div>
    </div>
  );
}

export default function ServiceSelectPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
            <p className="mt-4 text-sm text-slate-500">Loading...</p>
          </div>
        </div>
      }
    >
      <ServiceSelectRedirect />
    </Suspense>
  );
}
