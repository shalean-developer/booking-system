'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LoginButton } from '@/components/login-button';
import {
  Home,
  Wrench,
  Settings,
  MapPin,
  Droplets,
} from 'lucide-react';

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

  // Determine current page based on pathname
  const getCurrentPage = () => {
    if (pathname === '/') return 'home';
    if (pathname.startsWith('/services')) return 'services';
    if (pathname === '/how-it-works') return 'how-it-works';
    if (pathname === '/location') return 'locations';
    return null;
  };

  const currentPage = getCurrentPage();

  // Logo component with smart detection
  const Logo = () => {
    const [useFallback, setUseFallback] = useState(false);
    const [logoSrc, setLogoSrc] = useState('/logo.svg');

    const handleError = () => {
      if (logoSrc === '/logo.svg') {
        setLogoSrc('/logo.png');
      } else {
        setUseFallback(true);
      }
    };

    if (useFallback) {
      return (
        <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <Droplets className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
        </div>
      );
    }

    return (
      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center">
        <Image 
          src={logoSrc}
          alt="Shalean Logo"
          width={40}
          height={40}
          className="w-8 h-8 md:w-10 md:h-10 object-cover"
          onError={handleError}
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
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Logo />
            <div className="text-lg md:text-xl font-bold text-primary">Shalean</div>
          </Link>

          {/* Desktop Navigation */}
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

          {/* Action Buttons - Desktop & Mobile */}
          <div className="flex items-center gap-2 md:gap-3">
            <Button className="bg-primary hover:bg-primary/90 text-white rounded-full text-xs sm:text-sm px-3 sm:px-4 h-9 sm:h-10" asChild>
              <Link href="/booking/quote">
                Get Free Quote
              </Link>
            </Button>
            <Link href="/login">
              <LoginButton className="rounded-full text-xs sm:text-sm px-3 sm:px-4 h-9 sm:h-10" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
