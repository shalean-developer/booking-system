'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Chrome, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { BOOKING_FORM_SESSION_KEY } from '@/lib/booking-form-session';

type BookingAuthSummary = {
  service?: string;
  date?: string;
  time?: string;
  total?: number | null;
};

type Phase = 'form' | 'magic-sent';

function getRedirectTarget() {
  if (typeof window === 'undefined') return '/booking/payment';
  return localStorage.getItem('booking_redirect') || '/booking/payment';
}

function formatService(service?: string) {
  if (!service) return 'Your booking';
  const map: Record<string, string> = {
    standard: 'Standard Cleaning',
    deep: 'Deep Cleaning',
    move: 'Move Out Cleaning',
    airbnb: 'Airbnb Cleaning',
    carpet: 'Carpet Cleaning',
  };
  return map[service] ?? service;
}

function formatZarShort(total: number | null | undefined) {
  if (typeof total !== 'number' || Number.isNaN(total)) return '—';
  return `R${Math.round(total).toLocaleString('en-ZA')}`;
}

function formatDateShort(dateStr?: string) {
  if (!dateStr?.trim()) return '—';
  const d = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatTimeShort(timeStr?: string) {
  if (!timeStr?.trim()) return '—';
  const [h, m] = timeStr.split(':').map(Number);
  if (Number.isNaN(h)) return timeStr;
  const d = new Date();
  d.setHours(h, m ?? 0, 0, 0);
  return d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', hour12: false });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

export default function BookingAuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [phase, setPhase] = useState<Phase>('form');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const [summary, setSummary] = useState<BookingAuthSummary>({});

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);
  const canContinueEmail = useMemo(() => EMAIL_RE.test(normalizedEmail), [normalizedEmail]);
  const paymentRedirectTo =
    typeof window !== 'undefined' ? `${window.location.origin}/booking/payment` : undefined;

  const summaryOneLine = useMemo(() => {
    const service = formatService(summary.service);
    const date = formatDateShort(summary.date);
    const time = formatTimeShort(summary.time);
    const price = formatZarShort(summary.total);
    return `${service} · ${date} · ${time} · ${price}`;
  }, [summary.service, summary.date, summary.time, summary.total]);

  useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(BOOKING_FORM_SESSION_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        service?: string;
        date?: string;
        time?: string;
        lockedPrice?: number;
      };
      setSummary({
        service: parsed.service,
        date: parsed.date,
        time: parsed.time,
        total: typeof parsed.lockedPrice === 'number' ? parsed.lockedPrice : null,
      });
    } catch {
      setSummary({});
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const redirect = () => router.push(getRedirectTarget());

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) redirect();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) redirect();
    });

    return () => subscription.unsubscribe();
  }, [mounted, router]);

  async function sendMagicLink(targetEmail: string) {
    if (!paymentRedirectTo) return false;
    setError('');
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: targetEmail,
      options: {
        emailRedirectTo: paymentRedirectTo,
      },
    });
    if (otpError) {
      setError(otpError.message);
      return false;
    }
    setPhase('magic-sent');
    return true;
  }

  const onResendMagicLink = async () => {
    setMagicLoading(true);
    setError('');
    try {
      await sendMagicLink(normalizedEmail);
    } finally {
      setMagicLoading(false);
    }
  };

  const onContinueWithEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canContinueEmail || submitLoading) return;
    setSubmitLoading(true);
    setError('');
    try {
      await sendMagicLink(normalizedEmail);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const onVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim() || otpLoading || !canContinueEmail) return;
    setOtpLoading(true);
    setError('');
    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token: otpCode.trim(),
        type: 'email',
      });
      if (verifyError) {
        setError(verifyError.message);
        return;
      }
      if (data.session) {
        router.push(getRedirectTarget());
      }
    } finally {
      setOtpLoading(false);
    }
  };

  const onGoogleLogin = async () => {
    if (googleLoading || submitLoading) return;
    setGoogleLoading(true);
    setError('');
    try {
      const redirectTo =
        typeof window !== 'undefined' ? `${window.location.origin}/booking/payment` : undefined;
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: redirectTo
          ? {
              redirectTo,
              queryParams: { access_type: 'offline', prompt: 'consent' },
            }
          : undefined,
      });
      if (oauthError) {
        setError(oauthError.message);
        setGoogleLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed.');
      setGoogleLoading(false);
    }
  };

  const inputsDisabled = submitLoading || googleLoading;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100/80">
      <div className="mx-auto w-full max-w-md px-4 py-6 sm:p-6">
        <header className="space-y-1">
          <button
            type="button"
            onClick={() => router.push('/booking/payment')}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-white hover:text-gray-900 hover:shadow-sm"
            aria-label="Back to payment"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-[1.35rem] font-bold tracking-tight text-gray-900 sm:text-2xl">
            Continue to complete your booking
          </h1>
          <p className="text-sm leading-relaxed text-gray-500">Save your details and checkout faster</p>
        </header>

        <div className="mt-6 rounded-2xl border border-gray-100/80 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] sm:rounded-2xl">
          <p className="text-center text-sm font-medium leading-snug text-gray-700">{summaryOneLine}</p>

          {error ? (
            <div className="mt-4 rounded-xl border border-red-100 bg-red-50/90 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          ) : null}

          {phase === 'magic-sent' ? (
            <div className="mt-6 space-y-5">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-5 text-center">
                <p className="text-base font-semibold text-emerald-950">Check your email for a login link</p>
                <p className="mt-2 text-sm text-emerald-900/80">
                  Sent to <span className="font-medium text-emerald-950">{normalizedEmail}</span>
                </p>
                <button
                  type="button"
                  disabled={magicLoading}
                  className="mt-4 text-sm font-semibold text-emerald-800 underline decoration-emerald-600/40 underline-offset-2 hover:text-emerald-950 disabled:opacity-50"
                  onClick={() => void onResendMagicLink()}
                >
                  {magicLoading ? 'Sending…' : 'Resend link'}
                </button>
              </div>

              <form onSubmit={onVerifyOtp} className="space-y-3">
                <p className="text-center text-xs font-medium uppercase tracking-wide text-gray-400">Or use code</p>
                <div className="flex gap-2">
                  <input
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="6-digit code"
                    inputMode="numeric"
                    disabled={otpLoading}
                    className="min-h-[52px] min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50/50 px-4 text-center text-base font-medium tracking-widest text-gray-900 outline-none transition-colors focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100 disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={!otpCode.trim() || otpLoading}
                    className="flex min-h-[52px] min-w-[5.5rem] shrink-0 items-center justify-center rounded-xl bg-gray-900 px-5 text-sm font-semibold text-white transition-opacity hover:bg-gray-800 disabled:opacity-40"
                  >
                    {otpLoading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : 'Verify'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <form onSubmit={onContinueWithEmail} className="mt-6 space-y-4">
              <div>
                <label htmlFor="booking-auth-email" className="sr-only">
                  Email
                </label>
                <input
                  id="booking-auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  autoComplete="email"
                  autoFocus
                  disabled={inputsDisabled}
                  className="min-h-[56px] w-full rounded-xl border border-gray-200 bg-gray-50/40 px-4 text-base text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-500/10 disabled:opacity-60"
                />
                <p className="mt-2 text-xs leading-relaxed text-gray-500">
                  We&apos;ll create an account if you&apos;re new
                </p>
              </div>

              <button
                type="submit"
                disabled={!canContinueEmail || submitLoading}
                className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 text-base font-semibold text-white shadow-md shadow-violet-500/20 transition-all hover:from-blue-700 hover:to-violet-700 hover:shadow-lg disabled:cursor-not-allowed disabled:from-gray-300 disabled:to-gray-300 disabled:shadow-none"
              >
                {submitLoading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : null}
                {submitLoading ? 'Sending…' : 'Continue'}
              </button>

              <div className="flex items-center gap-3 py-1">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400">Or</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              <button
                type="button"
                onClick={onGoogleLogin}
                disabled={inputsDisabled}
                className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-4 text-sm font-semibold text-gray-800 transition-colors hover:border-gray-300 hover:bg-gray-50 disabled:opacity-60"
              >
                {googleLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-gray-600" aria-hidden />
                ) : (
                  <Chrome className="h-5 w-5 text-blue-600" aria-hidden />
                )}
                {googleLoading ? 'Connecting…' : 'Continue with Google'}
              </button>
            </form>
          )}

          {phase === 'form' ? (
            <div className="mt-8 flex flex-col items-center gap-1 border-t border-gray-100 pt-6 text-center text-xs text-gray-500">
              <span>✓ Secure checkout</span>
              <span>✓ No spam</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
