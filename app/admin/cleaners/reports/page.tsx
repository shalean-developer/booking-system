import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/supabase-server';
import { CleanerReportsClient } from './reports-client';

export const dynamic = 'force-dynamic';

export default async function CleanerReportsPage() {
  const admin = await isAdmin();
  
  if (!admin) {
    redirect('/admin');
  }

  return <CleanerReportsClient />;
}

