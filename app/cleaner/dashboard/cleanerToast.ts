import { toast } from 'sonner';

/** Non-blocking error feedback for cleaner dashboard actions (replaces window.alert). */
export function toastCleanerActionError(e: unknown, fallback: string) {
  const message = e instanceof Error ? e.message : fallback;
  if (/payment is required/i.test(message)) {
    toast.error('Payment not received yet', {
      description:
        'This booking is still waiting for the customer to pay. Try again once payment has cleared.',
      duration: 7000,
    });
    return;
  }
  toast.error(message, { duration: 5500 });
}
