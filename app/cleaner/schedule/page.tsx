import { redirect } from 'next/navigation';

/** Canonical mobile path → calendar / schedule */
export default function CleanerScheduleAliasPage() {
  redirect('/cleaner/dashboard/calendar');
}
