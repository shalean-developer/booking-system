import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/supabase-server';
import { CleanerPerformanceClient } from './performance-client';

export const dynamic = 'force-dynamic';

export default async function CleanerPerformancePage() {
  const admin = await isAdmin();
  
  if (!admin) {
    redirect('/admin');
  }

  return <CleanerPerformanceClient />;
}


