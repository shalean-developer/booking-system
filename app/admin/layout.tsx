import React from 'react';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/supabase-server';
import { AdminShell } from '@/components/admin/admin-shell';
import { FilterPeriodProvider } from '@/context/FilterPeriodContext';
import { ErrorBoundary } from '@/components/error-boundary';
import { SWRProvider } from '@/components/providers/swr-provider';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side auth check - protect all admin routes
  const userIsAdmin = await isAdmin();

  if (!userIsAdmin) {
    redirect('/login?returnTo=/admin');
  }

  return (
    <ErrorBoundary>
      <SWRProvider>
        <FilterPeriodProvider>
          <AdminShell>{children}</AdminShell>
        </FilterPeriodProvider>
      </SWRProvider>
    </ErrorBoundary>
  );
}

