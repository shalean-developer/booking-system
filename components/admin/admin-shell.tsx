'use client';

import { usePathname } from 'next/navigation';
import { AdminNavbar } from '@/components/admin/navigation/navbar';
import { AdminSidebar } from '@/components/admin/navigation/sidebar';

/** Routes that ship their own full layout (aligned with `/admin` SPA) — skip legacy navbar + sidebar. */
function usesStandaloneAdminChrome(pathname: string | null) {
  if (!pathname) return false;
  if (pathname === '/admin') return true;
  if (pathname === '/admin/schedule' || pathname.startsWith('/admin/schedule/')) return true;
  if (pathname === '/admin/growth' || pathname.startsWith('/admin/growth/')) return true;
  return false;
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (usesStandaloneAdminChrome(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 min-h-[calc(100vh-4rem)] overflow-auto lg:ml-64 pt-0">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
