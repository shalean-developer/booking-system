'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  User,
  Mail,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { supabase } from '@/lib/supabase-client';

interface AuthModalProps {
  children?: React.ReactNode;
}

export function AuthModal({ children }: AuthModalProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleOAuthSignIn = async (provider: 'google' | 'facebook') => {
    if (isLoading) return; // Prevent double clicks

    setIsLoading(provider);
    
    try {
      // Get current URL for redirect
      const redirectTo = `${window.location.origin}/dashboard`;
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error(`OAuth ${provider} error:`, error);
        alert(`Failed to sign in with ${provider}. Please try again or use email login.`);
        setIsLoading(null);
        return;
      }

      // The OAuth flow will redirect the user, so we don't need to handle redirect here
      // The redirectTo option handles the redirect after OAuth completes
    } catch (err) {
      console.error(`OAuth ${provider} exception:`, err);
      alert(`An error occurred. Please try again or use email login.`);
      setIsLoading(null);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children || (
          <Button variant="secondary" className="rounded-full text-xs sm:text-sm px-3 sm:px-4 h-9 sm:h-10">
            <User className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
            <span className="hidden sm:inline">Sign In</span>
            <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="end">
        <div className="space-y-4">
          {/* Header */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900">Sign In</h3>
            <p className="text-sm text-gray-600">Choose your preferred method</p>
          </div>

          {/* Social Login Buttons */}
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 rounded-lg border-2 hover:bg-gray-50 transition-colors disabled:opacity-50"
              onClick={() => handleOAuthSignIn('google')}
              disabled={isLoading !== null}
            >
              {isLoading === 'google' ? (
                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
              ) : (
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              Continue with Google
            </Button>
            
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 rounded-lg border-2 hover:bg-gray-50 transition-colors disabled:opacity-50"
              onClick={() => handleOAuthSignIn('facebook')}
              disabled={isLoading !== null}
            >
              {isLoading === 'facebook' ? (
                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
              ) : (
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              )}
              Continue with Facebook
            </Button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Or</span>
            </div>
          </div>

          {/* Email Login Button */}
          <Button
            asChild
            className="w-full h-11 rounded-lg bg-primary hover:bg-primary/90 text-white"
          >
            <Link href="/login">
              <Mail className="w-4 h-4 mr-2" />
              Login with Email
            </Link>
          </Button>

          {/* Sign Up Link */}
          <div className="text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/signup" className="font-semibold text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
