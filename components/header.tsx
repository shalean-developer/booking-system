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
  ChevronDown,
  Home,
  LogOut,
  MapPin,
  Menu,
  Settings,
  Shield,
  User,
  Wrench,
} from 'lucide-react';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader as SheetDialogHeader,
  SheetTrigger,
  SheetTitle as SheetDialogTitle,
} from '@/components/ui/sheet';

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
        <div className="flex items-center justify-between gap-4 py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <Logo />
            <div className="text-lg md:text-xl font-bold text-primary">Shalean</div>
          </Link>

          {/* Center Section: Navigation or Stepper */}
          <div className="flex min-w-0 flex-1 justify-center">
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
          <div className="flex flex-shrink-0 items-center gap-2 md:gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-full border-gray-200 text-gray-700 hover:border-primary hover:text-primary md:hidden"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-full max-w-xs border-r border-gray-200 p-0">
                <div className="flex h-full flex-col">
                  <SheetDialogHeader className="sr-only">
                    <SheetDialogTitle>Mobile navigation</SheetDialogTitle>
                  </SheetDialogHeader>
                  <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                    <Link href="/" className="flex items-center gap-2">
                      <Logo />
                      <span className="text-lg font-semibold text-primary">Shalean</span>
                    </Link>
                  </div>
                  <nav className="flex-1 overflow-y-auto px-6 py-6">
                    <ul className="space-y-3">
                      {navigationItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentPage === item.key;

                        return (
                          <li key={item.key}>
                            <SheetClose asChild>
                              <Link
                                href={item.href}
                                className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                                  isActive
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-gray-200 bg-white text-gray-700 hover:border-primary hover:bg-primary/5 hover:text-primary'
                                }`}
                              >
                                <Icon className="h-4 w-4" />
                                {item.name}
                              </Link>
                            </SheetClose>
                          </li>
                        );
                      })}
                    </ul>
                  </nav>
                  <div className="space-y-3 border-t border-gray-200 px-6 py-6">
                    <SheetClose asChild>
                      <Button className="w-full rounded-full bg-primary text-white hover:bg-primary/90" asChild>
                        <Link href={user ? '/booking/service/select' : '/booking/quote'}>
                          {user ? 'Book a Service' : 'Get a Free Quote'}
                        </Link>
                      </Button>
                    </SheetClose>
                    {user ? (
                      <>
                        <SheetClose asChild>
                          <Link
                            href="/dashboard"
                            className="flex w-full items-center justify-between rounded-full border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition hover:border-primary hover:text-primary"
                          >
                            <span>My Dashboard</span>
                          </Link>
                        </SheetClose>
                        <SheetClose asChild>
                          <Button
                            variant="outline"
                            className="w-full rounded-full border-red-200 text-red-600 hover:bg-red-50"
                            onClick={async () => {
                              await handleLogout();
                            }}
                          >
                            Log out
                          </Button>
                        </SheetClose>
                      </>
                    ) : (
                      <div className="space-y-2">
                        <SheetClose asChild>
                          <Link
                            href="/login"
                            className="flex w-full items-center justify-center rounded-full border border-primary/40 px-4 py-3 text-sm font-semibold text-primary transition hover:bg-primary/10"
                          >
                            Sign in
                          </Link>
                        </SheetClose>
                        <SheetClose asChild>
                          <Link
                            href="/signup"
                            className="flex w-full items-center justify-center rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary/90"
                          >
                            Create account
                          </Link>
                        </SheetClose>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            {!isBookingPage && (
              <Button className="hidden md:flex rounded-full bg-primary px-4 py-2 text-sm text-white hover:bg-primary/90" asChild>
                <Link href={user ? "/booking/service/select" : "/booking/quote"}>
                  {user ? "Book a Service" : "Get Free Quote"}
                </Link>
              </Button>
            )}
            
            <div className="hidden md:flex items-center gap-2">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="rounded-full px-4 py-2 text-sm gap-2"
                    >
                      <User className="h-4 w-4" />
                      {user.user_metadata?.first_name || user.email?.split('@')[0] || 'Account'}
                      <ChevronDown className="h-4 w-4" />
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
                      <LogOut className="mr-2 h-4 w-4" />
                      {isLoggingOut ? 'Logging out...' : 'Logout'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <AuthModal />
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
