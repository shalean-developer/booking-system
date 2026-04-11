'use client';

import { useState } from 'react';
import { Loader2, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PayNowButtonProps {
  bookingId: string;
  email?: string;
  className?: string;
  label?: string;
}

/**
 * Initializes Paystack via Supabase Edge Function (server proxy) and redirects the browser.
 * Amount and customer email are loaded server-side from the booking row.
 */
export function PayNowButton({ bookingId, email: _email, className, label = 'Pay now' }: PayNowButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: bookingId }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok || !data.authorization_url) {
        setError(data.error || 'Could not start payment');
        return;
      }
      window.location.href = data.authorization_url as string;
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onClick}
        disabled={loading || !bookingId}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold text-white',
          'bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
          className,
        )}
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CreditCard className="h-5 w-5" />}
        {loading ? 'Redirecting…' : label}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
