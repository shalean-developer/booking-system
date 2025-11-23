'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/header';
import { supabase } from '@/lib/supabase-client';
import { 
  Lock,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';

const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);

  // Check if we have a valid session/token from the email link
  useEffect(() => {
    const checkSession = async () => {
      try {
        // First, check if there's a hash fragment with tokens (Supabase sends tokens in hash)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const type = hashParams.get('type');
        
        if (accessToken && type === 'recovery') {
          // We have a recovery token in the URL, set the session
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: hashParams.get('refresh_token') || '',
          });
          
          if (sessionError) {
            console.error('Error setting session:', sessionError);
            setIsValidToken(false);
            setError('Invalid or expired reset link. Please request a new password reset.');
            return;
          }
          
          setIsValidToken(true);
          // Clear the hash from URL for security
          window.history.replaceState(null, '', window.location.pathname);
        } else {
          // Check if we already have a session
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            setIsValidToken(true);
          } else {
            setIsValidToken(false);
            setError('Invalid or expired reset link. Please request a new password reset.');
          }
        }
      } catch (err) {
        console.error('Error checking session:', err);
        setIsValidToken(false);
        setError('Unable to verify reset link. Please request a new password reset.');
      }
    };

    checkSession();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (updateError) {
        console.error('❌ Password update error:', updateError);
        setError(updateError.message || 'Failed to update password');
        setIsLoading(false);
        return;
      }

      console.log('✅ Password updated successfully');
      setSuccess(true);
      setIsLoading(false);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login?passwordReset=success');
      }, 2000);
    } catch (err) {
      console.error('❌ Password update exception:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setIsLoading(false);
    }
  };

  if (isValidToken === null) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-white">
        <Header variant="minimal" />
        <section className="py-12 md:py-20">
          <div className="mx-auto max-w-md px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100">
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (isValidToken === false) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-white">
        <Header variant="minimal" />
        <section className="py-12 md:py-20">
          <div className="mx-auto max-w-md px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                  Invalid Reset Link
                </h1>
                <p className="text-gray-600 mb-6">
                  {error || 'This password reset link is invalid or has expired. Please request a new one.'}
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => router.push('/forgot-password')}
                    className="flex-1"
                  >
                    Request New Reset Link
                  </Button>
                  <Button
                    onClick={() => router.push('/login')}
                    variant="outline"
                    className="flex-1"
                  >
                    Back to Login
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-white">
        <Header variant="minimal" />
        <section className="py-12 md:py-20">
          <div className="mx-auto max-w-md px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                  Password Reset Successful!
                </h1>
                <p className="text-gray-600 mb-6">
                  Your password has been updated successfully. You can now log in with your new password.
                </p>
                <Button
                  onClick={() => router.push('/login')}
                  className="w-full"
                >
                  Go to Login
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-white">
      <Header variant="minimal" />
      <section className="py-12 md:py-20">
        <div className="mx-auto max-w-md px-4 sm:px-6 lg:px-8">
          <div className="animate-fade-in motion-safe:animate-fade-in">
            <div className="text-center mb-8">
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
                Reset Password
              </Badge>
              <h1 className="mb-4 text-3xl md:text-4xl font-bold text-gray-900">
                Create New Password
              </h1>
              <p className="text-gray-600 text-sm md:text-base">
                Enter your new password below
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100">
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

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* New Password */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-semibold text-gray-900">
                    New Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter new password"
                      {...register('password')}
                      className={cn(
                        'h-11 rounded-xl border-2 pl-10 pr-10',
                        'focus:ring-2 focus:ring-primary/30 focus:border-primary',
                        errors.password && 'border-red-500 ring-2 ring-red-500/20'
                      )}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.password.message}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    Must be at least 8 characters with uppercase, lowercase, and a number
                  </p>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-900">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm new password"
                      {...register('confirmPassword')}
                      className={cn(
                        'h-11 rounded-xl border-2 pl-10 pr-10',
                        'focus:ring-2 focus:ring-primary/30 focus:border-primary',
                        errors.confirmPassword && 'border-red-500 ring-2 ring-red-500/20'
                      )}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
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
                      Updating Password...
                    </>
                  ) : (
                    <>
                      Reset Password
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </form>

              {/* Back to Login */}
              <div className="mt-6 text-center">
                <Link 
                  href="/login" 
                  className="text-sm text-gray-600 hover:text-primary"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-white">
        <Header variant="minimal" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}

