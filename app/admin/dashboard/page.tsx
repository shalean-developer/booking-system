import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

/** Revenue lives in the SPA at /admin — keep this URL as a stable alias. */
export default function AdminRevenueRedirectPage() {
  redirect('/admin?nav=revenue');
}
