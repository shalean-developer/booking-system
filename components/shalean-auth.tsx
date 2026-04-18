'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  CheckCircle2,
  Chrome,
  Loader2,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

// ─── Types ────────────────────────────────────────────────────────────────────

type AuthTab = 'signin' | 'signup';
interface FieldError {
  email?: string;
  password?: string;
  confirmPassword?: string;
  fullName?: string;
}

export type ShaleanAuthProps = {
  initialTab?: AuthTab;
};

const NAME_MAX_LENGTH = 120;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// ─── Trust Badge Data ─────────────────────────────────────────────────────────

const TRUST_BADGES = [
  { id: 'badge-rated', label: 'Rated 4.9 ★' },
  { id: 'badge-secure', label: 'Secure Payments' },
  { id: 'badge-checked', label: 'Background-checked' },
] as const;

// ─── Floating Orb ─────────────────────────────────────────────────────────────

function FloatingOrb({
  cx,
  cy,
  size,
  delay,
  color,
}: {
  cx: string;
  cy: string;
  size: number;
  delay: number;
  color: string;
}) {
  return (
    <motion.div
      className={cn('rounded-full blur-3xl', color)}
      style={{
        width: size,
        height: size,
        left: cx,
        top: cy,
        position: 'absolute',
      }}
      animate={{
        y: [0, -24, 0],
        opacity: [0.35, 0.55, 0.35],
      }}
      transition={{
        duration: 7 + delay,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
    />
  );
}

// ─── Left Brand Panel ─────────────────────────────────────────────────────────

function BrandPanel() {
  return (
    <div className="hidden lg:flex flex-col justify-between min-h-screen w-full bg-gradient-to-br from-[#1a56db] via-[#1e40af] to-[#1e3a8a] px-12 py-10 overflow-hidden">
      <FloatingOrb cx="-80px" cy="10%" size={340} delay={0} color="bg-blue-400/30" />
      <FloatingOrb cx="55%" cy="40%" size={260} delay={2.5} color="bg-indigo-300/20" />
      <FloatingOrb cx="20%" cy="65%" size={200} delay={1.2} color="bg-sky-400/20" />

      <div className="relative z-10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-white/20 border border-white/30 backdrop-blur-sm flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <span className="text-white text-xl font-extrabold tracking-tight">Shalean.</span>
      </div>

      <div className="relative z-10 flex-1 flex flex-col justify-center py-12">
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="text-white text-4xl xl:text-5xl font-extrabold leading-tight tracking-tight max-w-xs"
        >
          Book trusted cleaners
          <br />
          <span className="text-blue-200">in minutes.</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
          className="mt-5 text-blue-100 text-base leading-relaxed max-w-xs"
        >
          Professional home cleaning, deep cleans, and move-out services — vetted and insured cleaners, right at your
          fingertips.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 flex flex-wrap gap-3"
        >
          {TRUST_BADGES.map((badge) => (
            <div
              key={badge.id}
              className="backdrop-blur-md bg-white/15 border border-white/25 text-white text-xs font-semibold rounded-full px-4 py-2 shadow-sm"
            >
              {badge.label}
            </div>
          ))}
        </motion.div>
      </div>

      <p className="relative z-10 text-blue-300/70 text-xs">© {new Date().getFullYear()} Shalean. All rights reserved.</p>
    </div>
  );
}

// ─── Input Field ──────────────────────────────────────────────────────────────

interface InputFieldProps {
  id: string;
  name?: string;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string;
  icon: React.ReactNode;
  placeholder: string;
  rightSlot?: React.ReactNode;
  autoComplete?: string;
}
function InputField({
  id,
  name,
  label,
  type,
  value,
  onChange,
  onBlur,
  error,
  icon,
  placeholder,
  rightSlot,
  autoComplete,
}: InputFieldProps) {
  return (
    <div className="relative z-20 flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-bold text-gray-700 uppercase tracking-wider">
        {label}
      </label>
      <div
        className={cn(
          'flex items-center gap-3 bg-gray-50 border-2 rounded-xl px-4 transition-all duration-150',
          error ? 'border-red-300 bg-red-50/30' : 'border-gray-200 focus-within:border-blue-500 focus-within:bg-white'
        )}
      >
        <span className="text-gray-400 flex-shrink-0">{icon}</span>
        <input
          id={id}
          name={name ?? id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onInput={(e) => onChange((e.target as HTMLInputElement).value)}
          onBlur={onBlur}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="pointer-events-auto flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none py-3 min-h-[48px]"
        />
        {rightSlot}
      </div>
      {error && <p className="text-[11px] text-red-500 font-medium">{error}</p>}
    </div>
  );
}

// ─── Success State ────────────────────────────────────────────────────────────

function SuccessState({ tab }: { tab: AuthTab }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center py-12 gap-4 text-center"
    >
      <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center">
        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
      </div>
      <div>
        <p className="text-xl font-extrabold text-gray-900">{tab === 'signin' ? 'Welcome back!' : 'Account created!'}</p>
        <p className="text-sm text-gray-500 mt-1">
          {tab === 'signin' ? 'Redirecting you to your dashboard…' : 'Setting up your Shalean account…'}
        </p>
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <span className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        <span>Loading dashboard</span>
      </div>
    </motion.div>
  );
}

function splitFullName(fullName?: string) {
  if (!fullName) {
    return { firstName: undefined as string | undefined, lastName: undefined as string | undefined };
  }
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: undefined };
  }
  const [firstName, ...rest] = parts;
  return { firstName, lastName: rest.join(' ') };
}

// ─── Sign In Form ─────────────────────────────────────────────────────────────

interface SignInFormProps {
  returnTo: string;
  passwordResetSuccess: boolean;
}
function SignInForm({ returnTo, passwordResetSuccess }: SignInFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<FieldError>({});
  const [submitting, setSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const validateEmail = () => {
    if (!email)
      return setErrors((e) => ({
        ...e,
        email: 'Email is required.',
      }));
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return setErrors((e) => ({
        ...e,
        email: 'Enter a valid email address.',
      }));
    setErrors((e) => ({
      ...e,
      email: undefined,
    }));
  };
  const validatePassword = () => {
    if (!password)
      return setErrors((e) => ({
        ...e,
        password: 'Password is required.',
      }));
    if (password.length < 6)
      return setErrors((e) => ({
        ...e,
        password: 'Password must be at least 6 characters.',
      }));
    setErrors((e) => ({
      ...e,
      password: undefined,
    }));
  };

  const handleOAuth = async (provider: 'google' | 'apple') => {
    if (submitting || oauthLoading) return;
    setFormError(null);
    setOauthLoading(provider);
    try {
      const redirectTo = `${window.location.origin}/dashboard`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          ...(provider === 'google'
            ? {
                queryParams: {
                  access_type: 'offline',
                  prompt: 'consent',
                },
              }
            : {}),
        },
      });
      if (error) {
        setFormError(error.message);
        setOauthLoading(null);
        return;
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Sign-in failed.');
      setOauthLoading(null);
    }
  };

  const handleSubmit = async (evt: React.FormEvent) => {
    evt.preventDefault();
    setFormError(null);

    const form = evt.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const emailInputValue = String(formData.get('email') ?? '').trim();
    const passwordInputValue = String(formData.get('password') ?? '');
    const normalizedEmail = (email || emailInputValue).trim();
    const normalizedPassword = password || passwordInputValue;

    // Sync state with DOM values so browser autofill still submits correctly.
    if (normalizedEmail !== email) setEmail(normalizedEmail);
    if (normalizedPassword !== password) setPassword(normalizedPassword);

    if (!normalizedEmail) {
      setErrors((e) => ({ ...e, email: 'Email is required.' }));
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setErrors((e) => ({ ...e, email: 'Enter a valid email address.' }));
    } else {
      setErrors((e) => ({ ...e, email: undefined }));
    }

    if (!normalizedPassword) {
      setErrors((e) => ({ ...e, password: 'Password is required.' }));
    } else if (normalizedPassword.length < 6) {
      setErrors((e) => ({ ...e, password: 'Password must be at least 6 characters.' }));
    } else {
      setErrors((e) => ({ ...e, password: undefined }));
    }

    if (
      !normalizedEmail ||
      !normalizedPassword ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) ||
      normalizedPassword.length < 6
    ) {
      return;
    }

    setSubmitting(true);
    try {
      const result = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: normalizedPassword,
      });

      if (result.error) {
        setFormError(result.error.message);
        setSubmitting(false);
        return;
      }

      await new Promise((r) => setTimeout(r, 400));
      const redirectUrl = returnTo || '/dashboard';
      try {
        const {
          data: { session: verifySession },
        } = await supabase.auth.getSession();
        if (!verifySession) {
          console.warn('No session after login');
        }
        window.location.href = redirectUrl;
      } catch {
        window.location.href = redirectUrl;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred';
      if (msg.includes('Failed to fetch') || msg.includes('CORS') || msg.includes('network')) {
        setFormError(
          'Network error: Unable to reach authentication. Check your connection and Supabase configuration.'
        );
      } else {
        setFormError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="relative z-20 pointer-events-auto space-y-4">
      {passwordResetSuccess && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-900">
          <p className="font-semibold">Password reset successful</p>
          <p className="text-emerald-800/90 mt-0.5">You can now sign in with your new password.</p>
        </div>
      )}

      {formError && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">{formError}</div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => handleOAuth('google')}
          disabled={submitting || oauthLoading !== null}
          className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all min-h-[48px] disabled:opacity-60"
        >
          {oauthLoading === 'google' ? (
            <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
          ) : (
            <Chrome className="w-4 h-4 text-blue-500" />
          )}
          <span>{oauthLoading === 'google' ? 'Connecting...' : 'Google'}</span>
        </button>
        <button
          type="button"
          onClick={() => handleOAuth('apple')}
          disabled={submitting || oauthLoading !== null}
          className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all min-h-[48px] disabled:opacity-60"
        >
          {oauthLoading === 'apple' ? (
            <Loader2 className="w-4 h-4 text-gray-800 animate-spin" />
          ) : (
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current text-gray-800" aria-hidden="true">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4zm-3.1-17.52c.06 2.06-1.52 3.72-3.46 3.56-.27-1.98 1.52-3.75 3.46-3.56z" />
            </svg>
          )}
          <span>{oauthLoading === 'apple' ? 'Connecting...' : 'Apple'}</span>
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400 font-medium">or continue with email</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <InputField
        id="signin-email"
        name="email"
        label="Email Address"
        type="email"
        value={email}
        onChange={(value) => {
          setEmail(value);
          if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
          if (formError) setFormError(null);
        }}
        onBlur={validateEmail}
        error={errors.email}
        icon={<Mail className="w-4 h-4" />}
        placeholder="you@example.com"
        autoComplete="email"
      />
      <InputField
        id="signin-password"
        name="password"
        label="Password"
        type={showPw ? 'text' : 'password'}
        value={password}
        onChange={(value) => {
          setPassword(value);
          if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
          if (formError) setFormError(null);
        }}
        onBlur={validatePassword}
        error={errors.password}
        icon={<Lock className="w-4 h-4" />}
        placeholder="••••••••"
        autoComplete="current-password"
        rightSlot={
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            aria-label={showPw ? 'Hide password' : 'Show password'}
          >
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        }
      />

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <div
            role="checkbox"
            aria-checked={rememberMe}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setRememberMe((v) => !v);
              }
            }}
            onClick={() => setRememberMe((v) => !v)}
            className={cn(
              'w-4 h-4 rounded border-2 flex items-center justify-center transition-colors cursor-pointer',
              rememberMe ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
            )}
          >
            {rememberMe && (
              <svg viewBox="0 0 10 8" className="w-2.5 h-2 fill-white" aria-hidden="true">
                <path
                  d="M1 4l2.5 2.5L9 1"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            )}
          </div>
          <span className="text-xs text-gray-600 font-medium">Remember me</span>
        </label>
        <Link href="/forgot-password" className="text-xs font-semibold text-blue-600 hover:underline">
          Forgot password?
        </Link>
      </div>

      <motion.button
        type="submit"
        whileTap={{ scale: 0.98 }}
        disabled={submitting || oauthLoading !== null}
        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold shadow-md hover:shadow-lg transition-shadow flex items-center justify-center gap-2 min-h-[48px] disabled:opacity-70"
      >
        {submitting && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
        <span>{submitting ? 'Signing in…' : 'Sign In'}</span>
      </motion.button>
    </form>
  );
}

// ─── Sign Up Form ─────────────────────────────────────────────────────────────

interface SignUpFormProps {
  validReferrer: string;
  onSessionSuccess: () => void;
  onVerificationRequired: (email: string) => void;
  onError: (message: string) => void;
}
function SignUpForm({ validReferrer, onSessionSuccess, onVerificationRequired, onError }: SignUpFormProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [errors, setErrors] = useState<FieldError>({});
  const [loading, setLoading] = useState(false);

  const validateFullName = () => {
    if (!fullName.trim())
      return setErrors((e) => ({
        ...e,
        fullName: 'Full name is required.',
      }));
    if (fullName.trim().length < 2)
      return setErrors((e) => ({
        ...e,
        fullName: 'Full name must be at least 2 characters.',
      }));
    if (fullName.trim().length > NAME_MAX_LENGTH)
      return setErrors((e) => ({
        ...e,
        fullName: `Full name must be less than ${NAME_MAX_LENGTH} characters.`,
      }));
    setErrors((e) => ({
      ...e,
      fullName: undefined,
    }));
  };
  const validateEmail = () => {
    if (!email)
      return setErrors((e) => ({
        ...e,
        email: 'Email is required.',
      }));
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return setErrors((e) => ({
        ...e,
        email: 'Enter a valid email address.',
      }));
    setErrors((e) => ({
      ...e,
      email: undefined,
    }));
  };
  const validatePassword = () => {
    if (!password)
      return setErrors((e) => ({
        ...e,
        password: 'Password is required.',
      }));
    if (password.length < 6)
      return setErrors((e) => ({
        ...e,
        password: 'Password must be at least 6 characters.',
      }));
    setErrors((e) => ({
      ...e,
      password: undefined,
    }));
    if (confirmPassword) validateConfirmPassword();
  };
  const validateConfirmPassword = () => {
    if (!confirmPassword)
      return setErrors((e) => ({
        ...e,
        confirmPassword: 'Please confirm your password.',
      }));
    if (password !== confirmPassword)
      return setErrors((e) => ({
        ...e,
        confirmPassword: 'Passwords do not match.',
      }));
    setErrors((e) => ({
      ...e,
      confirmPassword: undefined,
    }));
  };

  const getFriendlySignupError = (error: { message: string; status?: number }) => {
    const message = error.message?.toLowerCase() || '';
    if (error.status === 429 || message.includes('rate limit')) {
      return 'We just sent you an email. Please wait a moment before trying again.';
    }
    if (message.includes('user already registered') || message.includes('already exists')) {
      return 'Looks like you already have an account with this email. Try signing in instead.';
    }
    if (message.includes('invalid email')) {
      return 'That email address looks invalid. Please double-check and try again.';
    }
    if (message.includes('password')) {
      return 'Please choose a stronger password (at least 6 characters).';
    }
    return 'We couldn’t create your account right now. Please try again or contact support.';
  };

  const handleSubmit = async (evt: React.FormEvent) => {
    evt.preventDefault();
    validateFullName();
    validateEmail();
    validatePassword();
    validateConfirmPassword();
    if (
      !fullName.trim() ||
      fullName.trim().length < 2 ||
      !email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      password.length < 6 ||
      password !== confirmPassword
    )
      return;

    setLoading(true);
    try {
      const { firstName, lastName } = splitFullName(fullName);

      const signupOptions: {
        emailRedirectTo: string;
        data?: Record<string, string>;
      } = {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      };

      const userMeta: Record<string, string> = {};
      if (firstName) userMeta.first_name = firstName;
      if (lastName) userMeta.last_name = lastName;
      if (validReferrer) userMeta.referred_by_customer_id = validReferrer;
      if (Object.keys(userMeta).length > 0) {
        signupOptions.data = userMeta;
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: signupOptions,
      });

      if (authError) {
        onError(getFriendlySignupError(authError));
        setLoading(false);
        return;
      }

      if (authData.user) {
        try {
          await fetch('/api/auth/link-customer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email,
              auth_user_id: authData.user.id,
              referred_by_customer_id: validReferrer || undefined,
              profile: {
                fullName: fullName.trim(),
                firstName: firstName ?? null,
                lastName: lastName ?? null,
              },
            }),
          });
        } catch {
          /* non-critical */
        }
      }

      if (authData.session) {
        onSessionSuccess();
        return;
      }

      onVerificationRequired(email);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'An unexpected error occurred while creating your account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="relative z-20 pointer-events-auto space-y-4">
      {validReferrer && (
        <div className="rounded-xl border border-blue-100 bg-blue-50/90 px-4 py-3 text-left text-sm text-blue-950">
          <p className="font-semibold">You’re signing up with a referral link</p>
          <p className="mt-1 text-blue-900/90">
            Complete your first booking to qualify for referral rewards — you and your friend both benefit.
          </p>
        </div>
      )}

      <InputField
        id="signup-name"
        name="fullName"
        label="Full Name"
        type="text"
        value={fullName}
        onChange={(value) => {
          setFullName(value);
          if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }));
          onError('');
        }}
        onBlur={validateFullName}
        error={errors.fullName}
        icon={<User className="w-4 h-4" />}
        placeholder="Thandiwe Mokoena"
        autoComplete="name"
      />
      <InputField
        id="signup-email"
        name="email"
        label="Email Address"
        type="email"
        value={email}
        onChange={(value) => {
          setEmail(value);
          if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
          onError('');
        }}
        onBlur={validateEmail}
        error={errors.email}
        icon={<Mail className="w-4 h-4" />}
        placeholder="you@example.com"
        autoComplete="email"
      />
      <InputField
        id="signup-password"
        name="password"
        label="Password"
        type={showPw ? 'text' : 'password'}
        value={password}
        onChange={(value) => {
          setPassword(value);
          if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
          if (errors.confirmPassword && confirmPassword.length > 0) {
            setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
          }
          onError('');
        }}
        onBlur={validatePassword}
        error={errors.password}
        icon={<Lock className="w-4 h-4" />}
        placeholder="Min 6 characters"
        autoComplete="new-password"
        rightSlot={
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            aria-label={showPw ? 'Hide password' : 'Show password'}
          >
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        }
      />
      <InputField
        id="signup-confirm-password"
        name="confirmPassword"
        label="Confirm Password"
        type={showConfirmPw ? 'text' : 'password'}
        value={confirmPassword}
        onChange={(value) => {
          setConfirmPassword(value);
          if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
          onError('');
        }}
        onBlur={validateConfirmPassword}
        error={errors.confirmPassword}
        icon={<Lock className="w-4 h-4" />}
        placeholder="Repeat password"
        autoComplete="new-password"
        rightSlot={
          <button
            type="button"
            onClick={() => setShowConfirmPw((v) => !v)}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            aria-label={showConfirmPw ? 'Hide password' : 'Show password'}
          >
            {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        }
      />

      {confirmPassword.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'flex items-center gap-2 text-xs font-medium',
            password === confirmPassword ? 'text-emerald-600' : 'text-red-500'
          )}
        >
          {password === confirmPassword ? (
            <CheckCircle2 className="w-3.5 h-3.5" />
          ) : (
            <span className="w-3.5 h-3.5 rounded-full border-2 border-red-400 flex-shrink-0" />
          )}
          <span>{password === confirmPassword ? 'Passwords match' : 'Passwords do not match'}</span>
        </motion.div>
      )}

      <motion.button
        type="submit"
        whileTap={{ scale: 0.98 }}
        disabled={loading}
        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold shadow-md hover:shadow-lg transition-shadow flex items-center justify-center gap-2 min-h-[48px] disabled:opacity-70"
      >
        {loading && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
        <span>{loading ? 'Creating account…' : 'Create Account'}</span>
      </motion.button>

      <p className="text-center text-[11px] text-gray-400 leading-relaxed">
        By creating an account, you agree to our{' '}
        <Link href="/terms" className="text-blue-600 font-semibold hover:underline">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="text-blue-600 font-semibold hover:underline">
          Privacy Policy
        </Link>
        .
      </p>
    </form>
  );
}

// ─── Verification pending ─────────────────────────────────────────────────────

function VerificationPending({ email }: { email: string }) {
  const router = useRouter();
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const handleResend = async () => {
    try {
      setResendStatus('sending');
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });
      if (error) {
        setResendStatus('error');
        return;
      }
      setResendStatus('sent');
    } catch {
      setResendStatus('error');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-emerald-50 border-2 border-emerald-200 p-6 text-left"
    >
      <div className="flex items-start gap-3">
        <CheckCircle2 className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-emerald-900">Check your email</h3>
          <p className="text-sm text-emerald-800">
            We sent a verification link to <span className="font-medium">{email}</span>. Click the link to activate your
            account.
          </p>
          <div className="flex items-start gap-2 text-sm text-emerald-900 pt-2">
            <Info className="h-4 w-4 mt-0.5 text-emerald-600 flex-shrink-0" />
            <span>Didn’t get it? Check spam or resend the verification email.</span>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="button" variant="secondary" size="sm" onClick={handleResend} disabled={resendStatus === 'sending'}>
              {resendStatus === 'sending' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending…
                </>
              ) : (
                'Resend email'
              )}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => router.push('/login?returnTo=/dashboard')}>
              Go to login
            </Button>
          </div>
          {resendStatus === 'sent' && (
            <p className="text-xs text-emerald-700">Verification email sent. Give it a few seconds to arrive.</p>
          )}
          {resendStatus === 'error' && (
            <p className="text-xs text-red-600">We couldn’t resend right now. Please wait a moment and try again.</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Auth Card ────────────────────────────────────────────────────────────────

interface AuthCardProps {
  initialTab: AuthTab;
  returnTo: string;
  passwordResetSuccess: boolean;
  validReferrer: string;
}
function AuthCard({ initialTab, returnTo, passwordResetSuccess, validReferrer }: AuthCardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AuthTab>(initialTab);
  const [success, setSuccess] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);
  const [cardError, setCardError] = useState<string | null>(null);
  const tabRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (success && activeTab === 'signup' && verificationEmail === null) {
      const t = setTimeout(() => router.push('/dashboard'), 1200);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [success, activeTab, verificationEmail, router]);

  const handleSignupSessionSuccess = () => {
    setVerificationEmail(null);
    setCardError(null);
    setSuccess(true);
  };

  const handleVerificationRequired = (email: string) => {
    setVerificationEmail(email);
    setCardError(null);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 w-full max-w-md">
      <div className="flex items-center gap-2 mb-6 lg:hidden">
        <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <span className="text-gray-900 text-lg font-extrabold tracking-tight">Shalean.</span>
      </div>

      {cardError && !success && verificationEmail === null && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">{cardError}</div>
      )}

      {!success && verificationEmail === null && (
        <div>
          <div ref={tabRef} className="relative flex bg-gray-100 rounded-xl p-1 mb-6">
            <motion.div
              layoutId="auth-tab-indicator"
              className="absolute top-1 bottom-1 rounded-lg bg-white shadow-sm pointer-events-none"
              style={{
                width: 'calc(50% - 4px)',
                left: activeTab === 'signin' ? '4px' : 'calc(50%)',
              }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 35,
              }}
            />
            <button
              type="button"
              onClick={() => {
                setActiveTab('signin');
                setCardError(null);
              }}
              className={cn(
                'relative z-10 flex-1 py-2.5 text-sm font-bold rounded-lg transition-colors duration-150',
                activeTab === 'signin' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('signup');
                setCardError(null);
              }}
              className={cn(
                'relative z-10 flex-1 py-2.5 text-sm font-bold rounded-lg transition-colors duration-150',
                activeTab === 'signup' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              Sign Up
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`title-${activeTab}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="mb-5 pointer-events-none"
            >
              <h2 className="text-xl font-extrabold text-gray-900">
                {activeTab === 'signin' ? 'Welcome back 👋' : 'Create your account 🎉'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {activeTab === 'signin' ? 'Sign in to manage your cleaning bookings.' : 'Join Shalean — it only takes a minute.'}
              </p>
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={`form-${activeTab}`}
              initial={{ opacity: 0, x: activeTab === 'signin' ? -16 : 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: activeTab === 'signin' ? 16 : -16 }}
              transition={{ duration: 0.22 }}
            >
              {activeTab === 'signin' ? (
                <SignInForm returnTo={returnTo} passwordResetSuccess={passwordResetSuccess} />
              ) : (
                <SignUpForm
                  validReferrer={validReferrer}
                  onSessionSuccess={handleSignupSessionSuccess}
                  onVerificationRequired={handleVerificationRequired}
                  onError={(msg) => setCardError(msg)}
                />
              )}
            </motion.div>
          </AnimatePresence>

          <p className="text-center text-xs text-gray-500 mt-5">
            {activeTab === 'signin' ? (
              <span>
                <span>Don&apos;t have an account? </span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('signup');
                    setCardError(null);
                  }}
                  className="text-blue-600 font-bold hover:underline"
                >
                  Sign Up
                </button>
              </span>
            ) : (
              <span>
                <span>Already have an account? </span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('signin');
                    setCardError(null);
                  }}
                  className="text-blue-600 font-bold hover:underline"
                >
                  Sign In
                </button>
              </span>
            )}
          </p>
        </div>
      )}

      {verificationEmail && !success && <VerificationPending email={verificationEmail} />}

      {success && <SuccessState tab={activeTab} />}
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

function ShaleanAuthInner({ initialTab = 'signin' }: ShaleanAuthProps) {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo')?.trim() || '/dashboard';

  useEffect(() => {
    const redirectInProgress = sessionStorage.getItem('redirect_in_progress');
    const paymentComplete = sessionStorage.getItem('payment_complete');
    const redirectTarget = sessionStorage.getItem('redirect_target');
    if (paymentComplete === 'true' && redirectTarget && redirectInProgress !== 'true') {
      sessionStorage.setItem('redirect_in_progress', 'true');
      try {
        window.location.replace(redirectTarget);
      } catch {
        sessionStorage.removeItem('redirect_in_progress');
      }
    }
  }, []);
  const passwordReset = searchParams.get('passwordReset');
  const referrerCustomerId = searchParams.get('ref')?.trim() ?? '';
  const validReferrer = UUID_RE.test(referrerCustomerId) ? referrerCustomerId : '';

  return (
    <div className="min-h-screen w-full flex">
      <div className="hidden lg:flex w-[45%] xl:w-[42%] flex-shrink-0">
        <BrandPanel />
      </div>

      <main className="flex-1 bg-[#f8fafc] flex flex-col items-center justify-center px-4 sm:px-8 py-10 min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          <AuthCard
            initialTab={initialTab}
            returnTo={returnTo}
            passwordResetSuccess={passwordReset === 'success'}
            validReferrer={validReferrer}
          />
        </motion.div>

        <div className="flex flex-wrap justify-center gap-2 mt-6 lg:hidden">
          {TRUST_BADGES.map((badge) => (
            <div
              key={badge.id}
              className="bg-white border border-gray-200 text-gray-600 text-xs font-semibold rounded-full px-3 py-1.5 shadow-sm"
            >
              {badge.label}
            </div>
          ))}
        </div>

        <p className="text-[11px] text-gray-400 mt-6 lg:hidden">© {new Date().getFullYear()} Shalean. All rights reserved.</p>
      </main>
    </div>
  );
}

export function ShaleanAuth(props: ShaleanAuthProps) {
  return <ShaleanAuthInner {...props} />;
}
