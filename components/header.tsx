'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/lib/supabase-client';
import { safeLogout, cleanupCorruptedSession, safeGetSession } from '@/lib/logout-utils';
import { useBooking } from '@/lib/useBooking';
import { Stepper } from '@/components/stepper';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import {
  Home,
  Wrench,
  Settings,
  MapPin,
  Droplets,
  User,
  LogOut,
  Shield,
  ChevronDown,
} from 'lucide-react';

// Lazy load AuthModal to reduce initial bundle size
const AuthModal = dynamic(() => import('@/components/auth-modal').then(mod => ({ default: mod.AuthModal })), {
  ssr: false,
  loading: () => <div className="w-20 h-9 bg-gray-200 rounded animate-pulse"></div>
});

interface HeaderProps {
  variant?: 'default' | 'minimal';
}

const navigationItems = [
  {
    name: 'Home',
    href: '/',
    icon: Home,
    key: 'home',
  },
  {
    name: 'Services',
    href: '/services',
    icon: Wrench,
    key: 'services',
  },
  {
    name: 'How It Works',
    href: '/how-it-works',
    icon: Settings,
    key: 'how-it-works',
  },
  {
    name: 'Locations',
    href: '/location',
    icon: MapPin,
    key: 'locations',
  },
];

export function Header({ variant = 'default' }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Get booking state for stepper display
  const { state: bookingState, isLoaded: bookingLoaded } = useBooking();
  
  // Check if on booking flow pages (includes confirmation, excludes quote and success)
  const isBookingPage = pathname?.startsWith('/booking/') && 
    !pathname.includes('/quote') && 
    !pathname.includes('/success') &&
    (pathname.startsWith('/booking/service/') || pathname === '/booking/confirmation');

  // Check auth state and admin role
  useEffect(() => {
    // Clean up any corrupted session data on component mount
    cleanupCorruptedSession();
    
    // Get initial session using safe session check
    safeGetSession(supabase).then(async (session) => {
      setUser(session?.user || null);
      
      // Check if user is admin
      if (session?.user) {
        const { data: customer } = await supabase
          .from('customers')
          .select('role')
          .eq('auth_user_id', session.user.id)
          .maybeSingle();
        
        setIsAdmin(customer?.role === 'admin');
      } else {
        setIsAdmin(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', event, session?.user?.id ? 'user present' : 'no user');
        
        // Handle sign out events or missing sessions
        if (event === 'SIGNED_OUT' || !session) {
          setUser(null);
          setIsAdmin(false);
          return;
        }
        
        setUser(session?.user || null);
        
        // Check if user is admin
        if (session?.user) {
          try {
            const { data: customer } = await supabase
              .from('customers')
              .select('role')
              .eq('auth_user_id', session.user.id)
              .maybeSingle();
            
            setIsAdmin(customer?.role === 'admin');
          } catch (error) {
            console.error('❌ Error checking admin role:', error);
            setIsAdmin(false);
          }
        } else {
          setIsAdmin(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Logout handler using centralized safe logout utility
  const handleLogout = async () => {
    setIsLoggingOut(true);
    
    await safeLogout(supabase, router, {
      timeout: 5000, // 5 seconds timeout (reduced from 10s)
      onSuccess: () => {
        console.log('🏁 Header logout completed successfully');
        toast.success('Successfully signed out');
      },
      onError: (error) => {
        console.error('❌ Header logout failed:', error);
        // Show user-friendly error message with toast
        toast.warning('Logout completed with some issues, but you have been signed out.');
      },
      onTimeout: () => {
        console.warn('⏰ Header logout timed out - user will be redirected anyway');
        // Show user-friendly timeout message with toast
        toast.info('Logout is taking longer than expected, but you will be redirected shortly.');
      }
    });
    
    setIsLoggingOut(false);
  };

  // Determine current page based on pathname
  const getCurrentPage = () => {
    if (pathname === '/') return 'home';
    if (pathname.startsWith('/services')) return 'services';
    if (pathname === '/how-it-works') return 'how-it-works';
    if (pathname === '/location') return 'locations';
    return null;
  };

  const currentPage = getCurrentPage();

  // Optimized Logo component - static import, no client-side detection
  const Logo = () => {
    return (
      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center">
        <Image 
          src="/logo.svg"
          alt="Shalean Logo"
          width={40}
          height={40}
          className="w-8 h-8 md:w-10 md:h-10 object-cover"
          priority={true}
        />
      </div>
    );
  };

  // Minimal variant for pages like login
  if (variant === 'minimal') {
    return (
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <Link href="/" className="flex items-center gap-2">
              <Logo />
              <div className="text-lg md:text-xl font-bold text-primary">Shalean</div>
            </Link>
            <Button variant="outline" asChild>
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white border-b sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top Row: Logo, Navigation/Stepper, Buttons */}
        <div className="flex items-center justify-between py-4 gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <Logo />
            <div className="text-lg md:text-xl font-bold text-primary">Shalean</div>
          </Link>

          {/* Center Section: Navigation or Stepper */}
          <div className="flex-1 flex justify-center min-w-0">
            {isBookingPage && bookingLoaded ? (
              /* Stepper for booking pages - Show on all screens but hide mobile stepper text */
              <div className="w-full max-w-2xl">
                <Stepper currentStep={bookingState.step} />
              </div>
            ) : !isBookingPage ? (
              /* Desktop Navigation for other pages - Hide during booking flow */
              <nav className="hidden md:flex items-center">
                {/* Navigation Container */}
                <div className="bg-gray-100 rounded-full p-1 flex items-center gap-1">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPage === item.key;
                    
                    return (
                      <Link
                        key={item.key}
                        href={item.href}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                          isActive
                            ? 'bg-primary text-white'
                            : 'bg-white text-gray-700 hover:text-primary'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="text-sm font-medium">{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </nav>
            ) : null}
          </div>

          {/* Action Buttons - Desktop & Mobile */}
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            {!isBookingPage && (
              <Button className="bg-primary hover:bg-primary/90 text-white rounded-full text-xs sm:text-sm px-3 sm:px-4 h-9 sm:h-10" asChild>
                <Link href={user ? "/booking/service/select" : "/booking/quote"}>
                  {user ? "Book a Service" : "Get Free Quote"}
                </Link>
              </Button>
            )}
            
            {user ? (
              /* Logged In State - User Dropdown */
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="rounded-full text-xs sm:text-sm px-3 sm:px-4 h-9 sm:h-10 gap-1"
                  >
                    <User className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">
                      {user.user_metadata?.first_name || user.email?.split('@')[0] || 'Account'}
                    </span>
                    <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isAdmin && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      My Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="text-red-600 focus:text-red-600"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {isLoggingOut ? 'Logging out...' : 'Logout'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              /* Logged Out State */
              <AuthModal />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
