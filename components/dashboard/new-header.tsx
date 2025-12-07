'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell, Menu, User, Settings, LogOut, LayoutDashboard } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { safeLogout } from '@/lib/logout-utils';
import { supabase } from '@/lib/supabase-client';
import { toast } from 'sonner';
import { devLog } from '@/lib/dev-logger';

interface NewHeaderProps {
  user?: any;
  customer?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    id?: string;
  } | null;
  onOpenMobileDrawer?: () => void;
  onRefresh?: () => void;
  notificationCount?: number;
}

export function NewHeader({ 
  user, 
  customer, 
  onOpenMobileDrawer, 
  onRefresh,
  notificationCount: propNotificationCount 
}: NewHeaderProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [notificationCount, setNotificationCount] = useState(propNotificationCount ?? 0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [skipLinkFocused, setSkipLinkFocused] = useState(false);
  const [logoSrc, setLogoSrc] = useState('/logo.svg');
  const hasAttemptedFallback = useRef(false);

  // Fetch notification count
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const response = await fetch('/api/dashboard/notifications', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        const data = await response.json();
        if (response.ok && data.ok) {
          setNotificationCount(data.unreadCount ?? 0);
        }
      } catch (err) {
        // Silently fail - notifications are optional
      }
    };

    fetchNotifications();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const displayName = customer?.firstName
    ? `${customer.firstName}${customer?.lastName ? ` ${customer.lastName}` : ''}`
    : user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Customer';

  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const profilePhoto = user?.user_metadata?.avatar_url || user?.user_metadata?.photo_url || null;

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    await safeLogout(supabase, router, {
      timeout: 5000,
      onSuccess: () => {
        toast.success('Successfully signed out');
      },
      onError: (error) => {
        devLog.error('Logout failed:', error);
        toast.warning('Logout completed with some issues, but you have been signed out.');
      },
      onTimeout: () => {
        toast.info('Logout is taking longer than expected, but you will be redirected shortly.');
      }
    });
    setIsLoggingOut(false);
  };

  return (
    <>
      {/* Skip Links */}
      <div className="sr-only focus-within:not-sr-only focus-within:absolute focus-within:z-[100] focus-within:top-4 focus-within:left-4">
        <a
          href="#main-content"
          className="inline-block px-4 py-2 bg-teal-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
          onFocus={() => setSkipLinkFocused(true)}
          onBlur={() => setSkipLinkFocused(false)}
        >
          Skip to main content
        </a>
      </div>
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80" role="banner">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left: Logo/Home */}
          <Link 
            href="/dashboard" 
            className="flex items-center gap-2 sm:gap-3"
            aria-label="Go to dashboard home"
          >
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl overflow-hidden flex-shrink-0" aria-hidden="true">
              <Image
                key={logoSrc}
                src={logoSrc}
                alt="Shalean Logo"
                width={40}
                height={40}
                priority
                className="h-full w-full object-contain"
                onError={() => {
                  // Fallback to PNG if SVG fails
                  // Use ref to track fallback attempt to prevent infinite error loops
                  if (!hasAttemptedFallback.current && logoSrc === '/logo.svg') {
                    hasAttemptedFallback.current = true;
                    setLogoSrc('/logo.png');
                  }
                  // If PNG also fails, the Image component will handle it gracefully
                }}
              />
            </div>
            <span className="hidden sm:block text-base sm:text-lg font-semibold text-gray-900">Shalean</span>
          </Link>


          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Refresh Button */}
            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                className="hidden sm:flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <span className="hidden lg:inline">Refresh</span>
              </Button>
            )}

            {/* Notifications */}
            <DropdownMenu open={notificationsOpen} onOpenChange={setNotificationsOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative text-gray-600 hover:text-gray-900"
                  aria-label={`Notifications${notificationCount > 0 ? `, ${notificationCount} unread` : ''}`}
                  aria-expanded={notificationsOpen}
                >
                  <Bell className="h-5 w-5" />
                  {notificationCount > 0 && (
                    <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notificationCount === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    No new notifications
                  </div>
                ) : (
                  <div className="p-4 text-center text-sm text-gray-500">
                    Notifications feature coming soon
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Profile Dropdown (Desktop) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="hidden md:flex items-center gap-2"
                  aria-label={`User menu for ${displayName}`}
                  aria-haspopup="menu"
                >
                  <Avatar className="h-8 w-8 border-2 border-teal-200">
                    {profilePhoto && (
                      <AvatarImage src={profilePhoto} alt={displayName} />
                    )}
                    <AvatarFallback className="bg-gradient-to-br from-teal-100 to-blue-100 text-teal-700 font-semibold text-sm">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden lg:block text-sm font-medium text-gray-900">{displayName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{displayName}</p>
                    <p className="text-xs text-gray-500">{customer?.email || user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="cursor-pointer">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  disabled={isLoggingOut}
                  className="text-red-600 focus:text-red-600 cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {isLoggingOut ? 'Logging out...' : 'Log out'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenMobileDrawer}
              className="md:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
    </>
  );
}
