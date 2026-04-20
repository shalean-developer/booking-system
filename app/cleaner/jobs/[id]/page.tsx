import { redirect } from 'next/navigation';
import { getCleanerSession } from '@/lib/cleaner-auth';
import { JobDetailClient } from './job-detail-client';

export const dynamic = 'force-dynamic';

export default async function CleanerJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getCleanerSession();
  if (!session) {
    redirect('/cleaner/login');
  }
  const { id } = await params;
  return <JobDetailClient bookingId={id} cleanerId={session.id} />;
}
