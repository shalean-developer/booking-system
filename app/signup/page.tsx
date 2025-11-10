'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Header } from '@/components/header';
import { supabase } from '@/lib/supabase-client';
import {
  User,
  Mail,
  Lock,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAME_MAX_LENGTH = 120;

const signupSchema = z
  .object({
    fullName: z
      .string()
      .transform((value) => {
        const trimmed = value.trim();
        return trimmed.length === 0 ? undefined : trimmed;
      })
      .refine(
        (value) => value === undefined || value.length >= 2,
        'Full name must be at least 2 characters'
      )
      .refine(
        (value) => value === undefined || value.length <= NAME_MAX_LENGTH,
        `Full name must be less than ${NAME_MAX_LENGTH} characters`
      )
      .optional(),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type SignupForm = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [awaitingVerification, setAwaitingVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  const splitFullName = (fullName?: string) => {
    if (!fullName) {
      return { firstName: undefined, lastName: undefined };
    }
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) {
      return { firstName: parts[0], lastName: undefined };
    }
    const [firstName, ...rest] = parts;
    return { firstName, lastName: rest.join(' ') };
  };

  const getFriendlyError = (error: { message: string; status?: number }) => {
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
      return 'Please choose a stronger password (at least 8 characters).';
    }

    return 'We couldn’t create your account right now. Please try again or contact support.';
  };

  const handleResendVerification = async () => {
    if (!verificationEmail) return;
    try {
      setResendStatus('sending');
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: verificationEmail,
      });

      if (resendError) {
        console.error('Resend verification error:', resendError);
        setResendStatus('error');
        return;
      }

      setResendStatus('sent');
    } catch (resendErr) {
      console.error('Resend verification exception:', resendErr);
      setResendStatus('error');
    }
  };

  useEffect(() => {
    const firstError = Object.keys(errors)[0] as keyof SignupForm | undefined;
    if (firstError) {
      setFocus(firstError);
    }
  }, [errors, setFocus]);

  const onSubmit = async (data: SignupForm) => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    setAwaitingVerification(false);
    setVerificationEmail(null);
    setResendStatus('idle');

    try {
      console.log('=== SIGN UP ATTEMPT ===');
      console.log('Email:', data.email);

      const { firstName, lastName } = splitFullName(data.fullName);

      const signupOptions: { emailRedirectTo: string; data?: Record<string, string> } = {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      };

      if (firstName || lastName) {
        signupOptions.data = {};
        if (firstName) signupOptions.data.first_name = firstName;
        if (lastName) signupOptions.data.last_name = lastName;
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: signupOptions,
      });

      if (authError) {
        console.error('Sign up error:', authError);
        setError(getFriendlyError(authError));
        return;
      }

      console.log('✅ Sign up successful:', authData);

      if (authData.user) {
        try {
          console.log('🔗 Attempting to link or create customer profile...');
          const linkResponse = await fetch('/api/auth/link-customer', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: data.email,
              auth_user_id: authData.user.id,
              profile: {
                fullName: data.fullName ?? null,
                firstName: firstName ?? null,
                lastName: lastName ?? null,
              },
            }),
          });

          const linkResult = await linkResponse.json();

          if (!linkResponse.ok || !linkResult.ok) {
            console.warn('Customer link API returned an error', linkResult);
          } else if (linkResult.linked || linkResult.created) {
            console.log('✅ Customer profile ready:', linkResult.customer_id);
          } else {
            console.log('ℹ️ Customer profile will be created later');
          }
        } catch (linkError) {
          console.error('⚠️ Customer linking failed (non-critical):', linkError);
        }
      }

      if (authData.session) {
        console.log('🚀 Session established, redirecting immediately');
        router.push('/dashboard');
        return;
      }

      setAwaitingVerification(true);
      setVerificationEmail(data.email);
      setSuccessMessage(
        `Account created! We sent a verification email to ${data.email}. Please click the link in that email to activate your account.`
      );
    } catch (err) {
      console.error('Sign up exception:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while creating your account.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-white">
      {/* Header */}
      <Header variant="minimal" />

      {/* Sign Up Form */}
      <section className="py-12 md:py-20">
        <div className="mx-auto max-w-md px-4 sm:px-6 lg:px-8">
          <div className="animate-fade-in motion-safe:animate-fade-in">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <User className="h-8 w-8 text-primary" />
              </div>
              <h1 className="mb-4 text-3xl md:text-4xl font-bold text-gray-900">
                Create Your Account
              </h1>
              <p className="text-gray-600 text-sm md:text-base">
                Join Shalean for faster checkout and exclusive benefits
              </p>
            </div>

            {/* Benefits */}
            {!successMessage && (
              <div className="mb-8 grid gap-3">
                {[
                  'Faster checkout with saved information',
                  'View your booking history',
                  'Manage saved addresses',
                ].map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Form Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100 transition-transform duration-300 hover:shadow-xl">
              {/* Success Message */}
              {successMessage && (
                <div className="mb-6 rounded-2xl bg-green-50 border-2 border-green-200 p-4 animate-slide-down motion-safe:animate-slide-down">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-semibold text-green-900 mb-1">
                        Success!
                      </h3>
                      <p className="text-sm text-green-700">{successMessage}</p>
                      {awaitingVerification && (
                        <div className="mt-4 space-y-3 text-sm text-green-800">
                          <div className="flex items-start gap-2">
                            <Info className="h-4 w-4 mt-0.5 text-green-600" />
                            <span>
                              Didn’t get the email? Check your spam folder or resend the verification link.
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={handleResendVerification}
                              disabled={resendStatus === 'sending'}
                            >
                              {resendStatus === 'sending' ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Sending…
                                </>
                              ) : (
                                'Resend email'
                              )}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => router.push('/login?returnTo=/dashboard')}
                            >
                              Go to login
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => window.open('https://mail.google.com', '_blank', 'noreferrer')}
                            >
                              Open Gmail
                            </Button>
                          </div>
                          {resendStatus === 'sent' && (
                            <p className="text-xs text-green-700">Verification email sent. Give it a few seconds to arrive.</p>
                          )}
                          {resendStatus === 'error' && (
                            <p className="text-xs text-red-600">
                              We couldn’t resend the email right now. Please wait a moment and try again.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mb-6 rounded-2xl bg-red-50 border-2 border-red-200 p-4 animate-slide-down motion-safe:animate-slide-down">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-semibold text-red-900 mb-1">
                        Error
                      </h3>
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {!successMessage && (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Full Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-semibold text-gray-900">
                    Full Name <span className="text-gray-400 text-xs">(optional)</span>
                  </Label>
                  <Input
                    id="fullName"
                    placeholder="e.g., Thabo Mokoena"
                    {...register('fullName')}
                    className={cn(
                      'h-11 rounded-xl border-2',
                      'focus:ring-2 focus:ring-primary/30 focus:border-primary',
                      errors.fullName && 'border-red-500 ring-2 ring-red-500/20'
                    )}
                    disabled={isLoading}
                  />
                  <p className="text-xs text-gray-500">
                    We’ll use this to personalise your dashboard. You can add it later if you’d like.
                  </p>
                  {errors.fullName && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.fullName.message}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-900">
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      {...register('email')}
                      className={cn(
                        'h-11 rounded-xl border-2 pl-10',
                        'focus:ring-2 focus:ring-primary/30 focus:border-primary',
                        errors.email && 'border-red-500 ring-2 ring-red-500/20'
                      )}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-semibold text-gray-900">
                    Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      {...register('password')}
                      className={cn(
                        'h-11 rounded-xl border-2 pl-10',
                        'focus:ring-2 focus:ring-primary/30 focus:border-primary',
                        errors.password && 'border-red-500 ring-2 ring-red-500/20'
                      )}
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-1.5 top-1/2 h-8 w-8 -translate-y-1/2 text-gray-500"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.password.message}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    At least 8 characters — adding numbers or symbols helps keep your account secure.
                  </p>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-900">
                    Confirm Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      {...register('confirmPassword')}
                      className={cn(
                        'h-11 rounded-xl border-2 pl-10',
                        'focus:ring-2 focus:ring-primary/30 focus:border-primary',
                        errors.confirmPassword && 'border-red-500 ring-2 ring-red-500/20'
                      )}
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute right-1.5 top-1/2 h-8 w-8 -translate-y-1/2 text-gray-500"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className={cn(
                    'w-full rounded-full px-8 py-3 font-semibold shadow-lg h-12',
                    'bg-primary hover:bg-primary/90 text-white',
                    'focus:ring-2 focus:ring-primary/30 focus:outline-none',
                    'transition-all duration-200',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </form>
              )}

              {/* Login Link */}
              {!successMessage && (
                <div className="mt-6 text-center text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link href="/login" className="font-semibold text-primary hover:underline">
                    Sign in
                  </Link>
                </div>
              )}
            </div>

            {/* Terms */}
            <div className="mt-8 text-center text-xs text-gray-500">
              By creating an account, you agree to our{' '}
              <Link href="/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}


