import { redirect } from 'next/navigation';

/** Notifications list removed; use dashboard + unread-count API. */
export default function AdminNotificationsRedirect() {
  redirect('/admin');
}
