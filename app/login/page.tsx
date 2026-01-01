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
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const passwordReset = searchParams.get('passwordReset');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(passwordReset === 'success');

  // CRITICAL: Check if payment was just completed and redirect to confirmation
  useEffect(() => {
    const redirectInProgress = sessionStorage.getItem('redirect_in_progress');
    const paymentComplete = sessionStorage.getItem('payment_complete');
    const redirectTarget = sessionStorage.getItem('redirect_target');
    
    // Only redirect if payment complete AND redirect not already in progress
    if (paymentComplete === 'true' && redirectTarget && redirectInProgress !== 'true') {
      console.log('🔍 Login page: Payment complete detected, redirecting to confirmation');
      console.log('🔍 Redirect target:', redirectTarget);
      
      // Mark redirect as in progress to prevent flickering
      sessionStorage.setItem('redirect_in_progress', 'true');
      
      // Single redirect - no multiple attempts
      try {
        window.location.replace(redirectTarget);
        console.log('✅ Redirect initiated from login page');
      } catch (error) {
        console.error('❌ Redirect error:', error);
        // Clear flag on error
        sessionStorage.removeItem('redirect_in_progress');
      }
      return;
    } else if (redirectInProgress === 'true') {
      console.log('⏸️ Redirect already in progress, skipping duplicate redirect');
      return;
    }
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    // Prevent double submission
    if (isLoading) {
      console.log('⏸️ Login already in progress, ignoring duplicate submit');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('=== LOGIN ATTEMPT ===');
      console.log('Email:', data.email);

      const result = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      console.log('🔍 Sign in result:', result);
      console.log('🔍 Has data:', !!result.data);
      console.log('🔍 Has error:', !!result.error);

      if (result.error) {
        console.error('❌ Login error:', result.error);
        setError(result.error.message);
        setIsLoading(false);
        return;
      }

      console.log('✅ Login successful, user:', result.data?.user?.email);

      // Determine redirect URL
      const redirectUrl = returnTo || '/dashboard';
      console.log('🎯 Redirecting to:', redirectUrl);

      // Wait for session to be fully established
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('⏱️ Wait complete');
      
      // Verify session before redirect
      try {
        const { data: { session: verifySession } } = await supabase.auth.getSession();
        console.log('🔍 Session verification:', verifySession ? '✅ Session found' : '❌ No session');
        
        console.log('🚀 About to redirect...');
        // Use window.location for reliable redirect
        window.location.href = redirectUrl;
      } catch (redirectErr) {
        console.error('❌ Redirect error:', redirectErr);
        // Force redirect even if session check fails
        window.location.href = redirectUrl;
      }

    } catch (err) {
      console.error('❌ Login exception:', err);
      
      // Check for CORS or network errors
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('CORS') || errorMessage.includes('network')) {
        setError('Network error: Unable to connect to authentication server. Please check your internet connection and ensure CORS is configured in Supabase Dashboard.');
      } else {
        setError(errorMessage);
      }
      
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-white">
      {/* Header */}
      <Header variant="minimal" />

      {/* Login Form */}
      <section className="py-12 md:py-20">
        <div className="mx-auto max-w-md px-4 sm:px-6 lg:px-8">
          <div className="animate-fade-in motion-safe:animate-fade-in">
            <div className="text-center mb-8">
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
                Welcome Back
              </Badge>
              <h1 className="mb-4 text-3xl md:text-4xl font-bold text-gray-900">
                Sign In
              </h1>
              <p className="text-gray-600 text-sm md:text-base">
                Access your account to manage bookings and preferences. New to Shalean? <Link href="/" className="text-primary hover:underline">Visit our homepage</Link> to learn about our <Link href="/services" className="text-primary hover:underline">cleaning services</Link> in <Link href="/location" className="text-primary hover:underline">locations</Link> across South Africa.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Login to Your Account
              </h2>

              {/* Success Message */}
              {showSuccess && (
                <div className="mb-6 rounded-2xl bg-green-50 border-2 border-green-200 p-4 animate-slide-down motion-safe:animate-slide-down">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-semibold text-green-900 mb-1">
                        Password Reset Successful
                      </h3>
                      <p className="text-sm text-green-700">
                        Your password has been updated. You can now log in with your new password.
                      </p>
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
                        Login Failed
                      </h3>
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-900">
                    Email Address
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
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-semibold text-gray-900">
                      Password
                    </Label>
                    <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      {...register('password')}
                      className={cn(
                        'h-11 rounded-xl border-2 pl-10',
                        'focus:ring-2 focus:ring-primary/30 focus:border-primary',
                        errors.password && 'border-red-500 ring-2 ring-red-500/20'
                      )}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.password.message}
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
                      Signing In...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </form>

              {/* Sign Up Link */}
              <div className="mt-6 text-center text-sm text-gray-600">
                Don't have an account?{' '}
                <Link href="/signup" className="font-semibold text-primary hover:underline">
                  Create an account
                </Link>
              </div>
            </div>

            {/* Terms */}
            <div className="mt-8 text-center text-xs text-gray-500">
              By signing in, you agree to our{' '}
              <Link href="/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </div>

            {/* Additional Links */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="text-center text-sm text-gray-600 mb-4">
                <p className="mb-3">New to Shalean? Explore our services:</p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Link href="/" className="text-primary hover:underline font-medium">Home</Link>
                  <span className="text-gray-400">•</span>
                  <Link href="/services" className="text-primary hover:underline font-medium">Services</Link>
                  <span className="text-gray-400">•</span>
                  <Link href="/location" className="text-primary hover:underline font-medium">Locations</Link>
                  <span className="text-gray-400">•</span>
                  <Link href="/how-it-works" className="text-primary hover:underline font-medium">How It Works</Link>
                  <span className="text-gray-400">•</span>
                  <Link href="/pricing" className="text-primary hover:underline font-medium">Pricing</Link>
                </div>
              </div>
              <div className="text-center text-xs text-gray-500">
                <Link href="/contact" className="text-primary hover:underline">Need help? Contact us</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-white">
        <Header variant="minimal" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

