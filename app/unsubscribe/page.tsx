import { unsubscribeByEmailParam } from '@/lib/email/unsubscribe-action';

export const dynamic = 'force-dynamic';

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const sp = await searchParams;
  const raw = typeof sp.email === 'string' ? sp.email.trim() : '';
  const email = raw ? decodeURIComponent(raw) : '';

  if (!email) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-lg font-semibold">Unsubscribe</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Missing email in the link. Use the unsubscribe link from your email.
        </p>
      </div>
    );
  }

  const result = await unsubscribeByEmailParam(email);

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-lg font-semibold">
        {result.ok ? 'You are unsubscribed' : 'Something went wrong'}
      </h1>
      <p className="text-muted-foreground mt-3 text-sm">
        {result.ok
          ? `We will not send further marketing emails to ${email}.`
          : result.error || 'Please try again or contact support.'}
      </p>
    </div>
  );
}
