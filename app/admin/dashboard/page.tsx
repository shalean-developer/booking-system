import { redirect } from 'next/navigation';

/**
 * Canonical profit dashboard lives at `/admin/profit`.
 */
export default async function AdminDashboardLegacyRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const p = new URLSearchParams();
  const set = (k: string, v: string | string[] | undefined) => {
    const s = typeof v === 'string' ? v : Array.isArray(v) ? v[0] : undefined;
    if (s?.trim()) p.set(k, s.trim());
  };
  set('from', sp.from);
  set('to', sp.to);
  set('service', sp.service);
  set('cleaner', sp.cleaner);
  set('mode', sp.mode);
  const q = p.toString();
  redirect(q ? `/admin/profit?${q}` : '/admin/profit');
}
