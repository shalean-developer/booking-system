import { redirect } from 'next/navigation';

/**
 * Growth referral entry: `/ref?code=…` → signup with the same ref (UUID or SHALEAN… code).
 */
export default async function RefPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  const c = code?.trim();
  if (!c) redirect('/signup');
  redirect(`/signup?ref=${encodeURIComponent(c)}`);
}
