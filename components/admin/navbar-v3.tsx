'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Search,
  Bell,
  User,
  LogOut,
  Settings,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { createClient } from '@/lib/supabase-browser';

export function AdminNavbarV3() {
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState(0);
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const router = useRouter();

  useEffect(() => {
    // Get user profile
    const getProfile = async () => {
      const supabaseClient = createClient();
      const { data: { user: authUser } } = await supabaseClient.auth.getUser();
      
      if (authUser) {
        setUser(authUser);
        // You can fetch notifications count here
        // For now, we'll set a placeholder
        setNotifications(0);
      }
    };

    getProfile();

    // Update last sync time every minute
    const interval = setInterval(() => {
      setLastSync(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search results or filter current page
      // For now, just log it
      console.log('Search:', searchQuery);
    }
  };

  const handleLogout = async () => {
    const supabaseClient = createClient();
    await supabaseClient.auth.signOut();
    router.push('/login');
  };

  const userInitials = user?.email?.charAt(0).toUpperCase() || 'A';

  const formatLastSync = () => {
    const now = new Date();
    const diffMs = now.getTime() - lastSync.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 min ago';
    return `${diffMins} min ago`;
  };

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-20 w-full border-b border-gray-200 bg-white shadow-sm"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Search Bar */}
          <div className="flex-1 max-w-lg">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search bookings, customers, cleaners..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 w-full focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>
            </form>
            {/* Last Sync Timestamp */}
            <p className="text-xs text-gray-500 mt-1 ml-2">{formatLastSync()}</p>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Refresh Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.location.reload()}
              aria-label="Refresh data"
              className="hidden md:flex"
            >
              <RefreshCw className="h-5 w-5" />
            </Button>

            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {notifications > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full border border-white" />
              )}
            </Button>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 px-2"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:block text-sm font-medium">
                    {user?.email?.split('@')[0] || 'Admin'}
                  </span>
                  <ChevronDown className="h-4 w-4 hidden md:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Admin Account</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email || 'admin@shalean.com'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/admin/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Switch Role</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setNotifications(0)}>
                  <Bell className="mr-2 h-4 w-4" />
                  <span>Notifications</span>
                  {notifications > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                      {notifications}
                    </span>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

