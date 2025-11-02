import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/supabase-server';
import { AdminSidebarV3 } from '@/components/admin/sidebar-v3';
import { AdminNavbarV3 } from '@/components/admin/navbar-v3';

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
    <div className="min-h-screen bg-gray-100/50 flex">
      {/* Sidebar */}
      <AdminSidebarV3 />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col ml-16 lg:ml-16">
        {/* Top Navigation */}
        <AdminNavbarV3 />
        
        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

