import { redirect } from 'next/navigation';
import { getCleanerSession } from '@/lib/cleaner-auth';
import { CalendarClient } from './calendar-client';

export default async function CalendarPage() {
  const session = await getCleanerSession();
  
  if (!session) {
    redirect('/cleaner/login');
  }

  return <CalendarClient cleaner={session} />;
}

