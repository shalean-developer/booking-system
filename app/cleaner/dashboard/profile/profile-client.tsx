'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CleanerMobileBottomNav } from '@/components/cleaner/cleaner-mobile-bottom-nav';
import { User, UserCircle, UserCheck, CreditCard, LogOut, Loader2, Briefcase } from 'lucide-react';

interface CleanerSession {
  id: string;
  name: string;
  phone: string;
  photo_url: string | null;
  rating: number;
  areas: string[];
  is_available: boolean;
  available_monday?: boolean;
  available_tuesday?: boolean;
  available_wednesday?: boolean;
  available_thursday?: boolean;
  available_friday?: boolean;
  available_saturday?: boolean;
  available_sunday?: boolean;
}

interface ProfileClientProps {
  cleaner: CleanerSession;
}

export function ProfileClient({ cleaner }: ProfileClientProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/cleaner/auth/logout', { method: 'POST' });
      router.push('/cleaner/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  const menuItems = [
    {
      id: 'personal-info',
      label: 'Personal info',
      icon: UserCircle,
      href: '/cleaner/dashboard/profile/personal-info',
    },
    {
      id: 'cleaner-profile',
      label: 'Cleaner profile',
      icon: UserCheck,
      href: '/cleaner/dashboard/profile/cleaner-profile',
    },
    {
      id: 'payments',
      label: 'Payments',
      icon: CreditCard,
      href: '/cleaner/dashboard/profile/payments',
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: UserCheck,
      href: '/cleaner/dashboard/profile/notifications',
    },
    {
      id: 'my-business',
      label: 'My Business',
      icon: Briefcase,
      href: '/cleaner/dashboard/find-jobs',
    },
    {
      id: 'logout',
      label: 'Log out',
      icon: LogOut,
      onClick: handleLogout,
      isDestructive: true,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Blue Header */}
      <header className="bg-[#3b82f6] text-white py-4 px-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <User className="h-6 w-6" strokeWidth={2} />
          <h1 className="text-lg font-semibold">Profile</h1>
          <User className="h-6 w-6" strokeWidth={2} />
        </div>
      </header>

      {/* Main Content */}
      <main className="bg-white pb-24">
        <div className="max-w-md mx-auto px-4 py-6">
          {/* Menu Items List */}
          <div className="space-y-0">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const isLast = index === menuItems.length - 1;

              return (
                <div key={item.id}>
                  {item.id === 'logout' ? (
                    <button
                      onClick={item.onClick}
                      disabled={isLoggingOut}
                      className={`
                        w-full flex items-center gap-4 py-4 px-2
                        transition-colors text-left
                        text-red-600 hover:bg-red-50
                        disabled:opacity-50 disabled:cursor-not-allowed
                      `}
                    >
                      {/* Icon */}
                      <Icon 
                        className={`
                          h-5 w-5 flex-shrink-0
                          text-red-600
                          ${isLoggingOut ? 'animate-spin' : ''}
                        `}
                        strokeWidth={2}
                      />
                      
                      {/* Label */}
                      <span className="text-base font-medium flex-1">
                        {item.label}
                      </span>

                      {/* Loading spinner for logout */}
                      {isLoggingOut && (
                        <Loader2 className="h-4 w-4 animate-spin text-red-600" />
                      )}
                    </button>
                  ) : (
                    <Link
                      href={item.href || '#'}
                      className={`
                        w-full flex items-center gap-4 py-4 px-2
                        transition-colors text-left
                        text-gray-900 hover:bg-gray-50
                      `}
                    >
                      {/* Icon */}
                      <Icon 
                        className="h-5 w-5 flex-shrink-0 text-gray-400"
                        strokeWidth={2}
                      />
                      
                      {/* Label */}
                      <span className="text-base font-medium flex-1">
                        {item.label}
                      </span>
                    </Link>
                  )}

                  {/* Separator line */}
                  {!isLast && (
                    <div className="border-b border-gray-200 mx-2" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <CleanerMobileBottomNav />

      {/* Bottom Spacer */}
      <div className="h-20 sm:h-0" />
    </div>
  );
}

