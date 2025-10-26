'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Smartphone,
  Lock,
  ArrowRight,
  AlertCircle,
  Loader2,
  MessageSquare,
  Check,
  Droplets
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Logo component with smart detection and cache busting
function Logo() {
  const [useFallback, setUseFallback] = useState(false);
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Version for cache busting - update when logo changes
  const LOGO_VERSION = '1.0.0';

  // Client-side file detection to find available logo format
  useEffect(() => {
    const checkLogo = async () => {
      setIsLoading(true);
      
      // Try SVG first
      try {
        const svgResponse = await fetch('/logo.svg', { method: 'HEAD' });
        if (svgResponse.ok) {
          setLogoSrc(`/logo.svg?v=${LOGO_VERSION}`);
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.log('SVG logo not found, trying PNG');
      }
      
      // Try PNG
      try {
        const pngResponse = await fetch('/logo.png', { method: 'HEAD' });
        if (pngResponse.ok) {
          setLogoSrc(`/logo.png?v=${LOGO_VERSION}`);
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.log('PNG logo not found, using fallback');
      }
      
      // No logo found, use fallback
      setUseFallback(true);
      setIsLoading(false);
    };
    
    checkLogo();
  }, [LOGO_VERSION]);

  const handleError = () => {
    console.warn('Logo failed to load:', logoSrc);
    // If current logo fails, try the other format
    if (logoSrc?.includes('logo.svg')) {
      setLogoSrc(`/logo.png?v=${LOGO_VERSION}`);
    } else {
      // Both formats failed, use fallback
      setUseFallback(true);
    }
  };

  if (useFallback || !logoSrc) {
    return (
      <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
        <Droplets className="h-5 w-5 text-white" />
      </div>
    );
  }

  return (
    <div className="h-10 w-10 rounded-full overflow-hidden bg-primary flex items-center justify-center">
      <Image 
        src={logoSrc}
        alt="Shalean Logo"
        width={40}
        height={40}
        className="h-10 w-10 object-cover"
        unoptimized={true}
        priority={true}
        onError={handleError}
      />
    </div>
  );
}

export default function CleanerLoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'password' | 'otp'>('password');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);

  // Password login state
  const [phonePassword, setPhonePassword] = useState('');
  const [password, setPassword] = useState('');

  // OTP login state
  const [phoneOtp, setPhoneOtp] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState(''); // For development

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/cleaner/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phonePassword,
          password,
        }),
      });

      const data = await response.json();

      if (!data.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      console.log('✅ Login successful:', data.cleaner);
      
      // Redirect to dashboard
      router.push('/cleaner/dashboard');
      router.refresh();
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOTP = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/cleaner/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneOtp }),
      });

      const data = await response.json();

      if (!data.ok) {
        setError(data.error || 'Failed to send OTP');
        return;
      }

      setOtpSent(true);
      
      // In development, show the OTP
      if (data.otp) {
        setDevOtp(data.otp);
      }

      console.log('✅ OTP sent successfully');
    } catch (err) {
      console.error('Send OTP error:', err);
      setError('Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/cleaner/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phoneOtp,
          otp,
        }),
      });

      const data = await response.json();

      if (!data.ok) {
        setError(data.error || 'Verification failed');
        return;
      }

      console.log('✅ OTP verified:', data.cleaner);
      
      // Redirect to dashboard
      router.push('/cleaner/dashboard');
      router.refresh();
    } catch (err) {
      console.error('Verify OTP error:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-white">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center gap-2">
            <Logo />
            <span className="text-xl font-bold">Shalean</span>
          </div>
        </div>
      </div>

      {/* Login Form */}
      <section className="py-8 px-4 sm:py-12">
        <div className="mx-auto max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="text-center mb-6">
              <Badge className="mb-3 bg-primary/10 text-primary border-primary/20">
                Cleaner Portal
              </Badge>
              <h1 className="mb-3 text-3xl md:text-4xl font-bold text-gray-900">
                Welcome Back
              </h1>
              <p className="text-gray-600 text-sm">
                Sign in to access your dashboard and manage bookings
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-6 rounded-xl bg-red-50 border-2 border-red-200 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-semibold text-red-900 mb-1">
                          Error
                        </h3>
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'password' | 'otp')} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="password" className="text-sm sm:text-base">
                    <Lock className="h-4 w-4 mr-2" />
                    Password
                  </TabsTrigger>
                  <TabsTrigger value="otp" className="text-sm sm:text-base">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    SMS Code
                  </TabsTrigger>
                </TabsList>

                {/* Password Login */}
                <TabsContent value="password">
                  <form onSubmit={handlePasswordLogin} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="phone-password" className="text-sm font-semibold text-gray-900">
                        Phone Number
                      </Label>
                      <div className="relative">
                        <Smartphone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        <Input
                          id="phone-password"
                          type="tel"
                          placeholder="+27 XX XXX XXXX"
                          value={phonePassword}
                          onChange={(e) => setPhonePassword(e.target.value)}
                          className="h-12 rounded-xl border-2 pl-10 text-base"
                          disabled={isLoading}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-semibold text-gray-900">
                        Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        <Input
                          id="password"
                          type="password"
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="h-12 rounded-xl border-2 pl-10 text-base"
                          disabled={isLoading}
                          required
                        />
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      disabled={isLoading}
                      className="w-full h-12 rounded-full text-base font-semibold shadow-lg bg-primary hover:bg-primary/90"
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
                </TabsContent>

                {/* OTP Login */}
                <TabsContent value="otp">
                  {!otpSent ? (
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="phone-otp" className="text-sm font-semibold text-gray-900">
                          Phone Number
                        </Label>
                        <div className="relative">
                          <Smartphone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                          <Input
                            id="phone-otp"
                            type="tel"
                            placeholder="+27 XX XXX XXXX"
                            value={phoneOtp}
                            onChange={(e) => setPhoneOtp(e.target.value)}
                            className="h-12 rounded-xl border-2 pl-10 text-base"
                            disabled={isLoading}
                            required
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          We'll send you a 6-digit verification code
                        </p>
                      </div>

                      <Button 
                        type="button"
                        onClick={handleSendOTP}
                        disabled={isLoading || !phoneOtp}
                        className="w-full h-12 rounded-full text-base font-semibold shadow-lg bg-primary hover:bg-primary/90"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Sending Code...
                          </>
                        ) : (
                          <>
                            Send Verification Code
                            <ArrowRight className="ml-2 h-5 w-5" />
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleVerifyOTP} className="space-y-5">
                      <div className="rounded-xl bg-green-50 border-2 border-green-200 p-4 mb-4">
                        <div className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-green-900">Code Sent!</p>
                            <p className="text-xs text-green-700 mt-1">
                              Check your phone for the verification code
                            </p>
                            {devOtp && (
                              <p className="text-xs text-green-700 mt-2 font-mono bg-green-100 px-2 py-1 rounded">
                                Dev OTP: {devOtp}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="otp" className="text-sm font-semibold text-gray-900">
                          Verification Code
                        </Label>
                        <Input
                          id="otp"
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={6}
                          placeholder="Enter 6-digit code"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                          className="h-12 rounded-xl border-2 text-center text-2xl tracking-widest font-mono"
                          disabled={isLoading}
                          required
                        />
                      </div>

                      <div className="flex gap-3">
                        <Button 
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setOtpSent(false);
                            setOtp('');
                            setDevOtp('');
                          }}
                          disabled={isLoading}
                          className="flex-1 h-12 rounded-full text-base"
                        >
                          Back
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={isLoading || otp.length !== 6}
                          className="flex-1 h-12 rounded-full text-base font-semibold shadow-lg bg-primary hover:bg-primary/90"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Verifying...
                            </>
                          ) : (
                            'Verify & Sign In'
                          )}
                        </Button>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setOtpSent(false);
                          setOtp('');
                          handleSendOTP();
                        }}
                        disabled={isLoading}
                        className="w-full text-sm text-primary hover:underline mt-4"
                      >
                        Didn't receive the code? Resend
                      </button>
                    </form>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* Help Text */}
            <div className="mt-6 text-center text-xs text-gray-500">
              Need help? Contact support at{' '}
              <a href="mailto:support@shalean.co.za" className="text-primary hover:underline">
                support@shalean.com
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

