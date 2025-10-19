'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, Menu, X } from 'lucide-react';
import { AvailabilityToggle } from './availability-toggle';

interface CleanerHeaderProps {
  cleaner: {
    name: string;
    photo_url: string | null;
    rating: number;
    is_available: boolean;
  };
  onAvailabilityChange?: (isAvailable: boolean) => void;
}

export function CleanerHeader({ cleaner, onAvailabilityChange }: CleanerHeaderProps) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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

  const initials = cleaner.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-50 border-b bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Logo & Cleaner Info */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <div className="hidden sm:block">
              <div className="font-semibold text-gray-900 text-sm">{cleaner.name}</div>
              <div className="text-xs text-gray-500">
                Rating: {cleaner.rating.toFixed(1)} ⭐
              </div>
            </div>
          </div>

          {/* Center: Availability Toggle (Desktop) */}
          <div className="hidden md:block flex-1 max-w-xs">
            <AvailabilityToggle
              isAvailable={cleaner.is_available}
              onChange={onAvailabilityChange}
            />
          </div>

          {/* Right: Avatar & Menu */}
          <div className="flex items-center gap-2">
            <Avatar className="h-10 w-10 border-2 border-primary/20">
              {cleaner.photo_url && (
                <AvatarImage src={cleaner.photo_url} alt={cleaner.name} />
              )}
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="hidden md:flex"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="mt-3 pt-3 border-t space-y-3 md:hidden">
            {/* Mobile Info */}
            <div className="sm:hidden">
              <div className="font-semibold text-gray-900">{cleaner.name}</div>
              <div className="text-sm text-gray-500">
                Rating: {cleaner.rating.toFixed(1)} ⭐
              </div>
            </div>

            {/* Mobile Availability Toggle */}
            <div className="md:hidden">
              <AvailabilityToggle
                isAvailable={cleaner.is_available}
                onChange={onAvailabilityChange}
              />
            </div>

            {/* Mobile Logout */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}

