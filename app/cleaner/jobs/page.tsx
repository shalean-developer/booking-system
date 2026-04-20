import { redirect } from 'next/navigation';

/** Canonical mobile path → existing Find jobs screen (preserves query e.g. ?from=supply). */
export default async function CleanerJobsAliasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const q = await searchParams;
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) {
    if (v === undefined) continue;
    if (Array.isArray(v)) v.forEach((x) => sp.append(k, x));
    else sp.set(k, v);
  }
  const qs = sp.toString();
  redirect(qs ? `/cleaner/dashboard/find-jobs?${qs}` : '/cleaner/dashboard/find-jobs');
}
