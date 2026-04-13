'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, CalendarDays, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function AdminNavbar() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [todayLabel, setTodayLabel] = useState('');

  const fetchUnreadCount = async () => {
    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch('/api/admin/notifications/unread-count', {
        signal: controller.signal,
        credentials: 'include',
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          setUnreadCount(data.count || 0);
        }
      }
    } catch (error: any) {
      // Silently fail - don't crash the app
      // Only log if it's not an abort error (timeout) or network error
      if (error.name !== 'AbortError' && error.message !== 'Failed to fetch') {
      console.error('Failed to fetch unread count:', error);
      }
      // Don't reset to 0 on error - keep previous count
    }
  };

  useEffect(() => {
    try {
      setIsMounted(true);

      const tickDate = () => {
        setTodayLabel(
          new Date().toLocaleDateString('en-ZA', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
        );
      };
      tickDate();
      const dateInterval = setInterval(tickDate, 60_000);

      // Initial fetch after a short delay to let page load
      const initialTimeout = setTimeout(() => {
        fetchUnreadCount();
      }, 1000);

      const interval = setInterval(fetchUnreadCount, 60000);

      return () => {
        clearInterval(dateInterval);
        clearTimeout(initialTimeout);
        clearInterval(interval);
      };
    } catch (error) {
      console.error('Error in AdminNavbar useEffect:', error);
    }
  }, []);

  // Prevent hydration errors by not rendering until mounted
  if (!isMounted) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm h-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <span className="text-xl font-bold text-[#3b82f6]">Admin Dashboard</span>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm h-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/admin" className="flex items-center space-x-2">
              <span className="text-xl font-bold text-[#3b82f6]">Admin Dashboard</span>
            </Link>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {isMounted && (
              <div
                className="flex max-w-[11rem] items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs font-medium text-gray-800 sm:max-w-none sm:gap-2 sm:px-3 sm:text-sm"
                title="Today (local time)"
              >
                <CalendarDays className="h-3.5 w-3.5 shrink-0 text-gray-500 sm:h-4 sm:w-4" aria-hidden />
                <span className="truncate">{todayLabel || '…'}</span>
              </div>
            )}
            {/* Notifications — list page removed; bell goes to main admin dashboard */}
            {isMounted && (
              <Link href="/admin" title="Admin dashboard">
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge
                      className="absolute -top-1 -right-1 h-5 min-w-5 px-1.5 text-xs bg-red-600 text-white"
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
                  )}
                </Button>
              </Link>
            )}

            {/* User menu */}
            {isMounted && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild suppressHydrationWarning>
                  <Button variant="ghost" size="sm">
                    Admin
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/admin/settings">Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/logout">
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
