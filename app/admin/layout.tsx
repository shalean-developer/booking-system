import React from 'react';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/supabase-server';
import { AdminNavbar } from '@/components/admin/navigation/navbar';
import { AdminSidebar } from '@/components/admin/navigation/sidebar';
import { FilterPeriodProvider } from '@/context/FilterPeriodContext';

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
    <div className="min-h-screen bg-gray-50">
      <FilterPeriodProvider>
        <AdminNavbar />
        <div className="flex">
          <AdminSidebar />
          <main className="flex-1 min-h-[calc(100vh-4rem)] overflow-auto lg:ml-64 pt-0">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
              {children}
            </div>
          </main>
        </div>
      </FilterPeriodProvider>
    </div>
  );
}

