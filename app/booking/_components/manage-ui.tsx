import Link from 'next/link';

export function ManageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}

export function ManageCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
      <h1 className="text-xl font-semibold tracking-tight text-zinc-900">{title}</h1>
      <div className="mt-6 space-y-4 text-sm text-zinc-600">{children}</div>
    </div>
  );
}

export function ManageError({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <ManageShell>
      <ManageCard title={title}>
        <p>{message}</p>
        <p className="pt-2">
          <Link href="/" className="font-medium text-indigo-600 hover:text-indigo-500">
            Back to home
          </Link>
        </p>
      </ManageCard>
    </ManageShell>
  );
}
