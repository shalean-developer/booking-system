'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, LogOut } from 'lucide-react';
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

  useEffect(() => {
    setIsMounted(true);
    fetchUnreadCount();

    // Refresh every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/admin/notifications/unread-count');
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count || 0);
      }
    } catch (error) {
      // Silently fail
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm h-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/admin" className="flex items-center space-x-2">
              <span className="text-xl font-bold text-[#3b82f6]">Admin Dashboard</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications */}
            {isMounted && (
              <Link href="/admin/notifications">
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
