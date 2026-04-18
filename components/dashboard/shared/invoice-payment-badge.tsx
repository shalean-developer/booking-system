import { cn } from '@/lib/utils';

export function InvoicePaymentBadge({ label }: { label: string }) {
  const paid = label === 'Paid';
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-1 text-xs font-medium',
        paid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
      )}
    >
      {label}
    </span>
  );
}
