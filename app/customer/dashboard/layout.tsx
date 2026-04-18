import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerAuthUser } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export default async function CustomerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerAuthUser();
  if (!user) {
    redirect('/login?returnTo=/customer/dashboard');
  }

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-gray-600 transition hover:text-gray-900"
          >
            ← Back to dashboard
          </Link>
          <span className="text-xs text-gray-400 truncate max-w-[50%] sm:max-w-none">
            {user.email}
          </span>
        </div>
      </header>
      {children}
    </div>
  );
}
