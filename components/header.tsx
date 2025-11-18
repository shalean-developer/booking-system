'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useBookingV2 } from '@/lib/useBookingV2';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface HeaderProps {
  variant?: 'default' | 'minimal';
}

const navigationItems = [
  {
    name: 'Home',
    href: '/',
    key: 'home',
  },
  {
    name: 'Locations',
    href: '/location',
    key: 'locations',
  },
  {
    name: 'Services',
    href: '/services',
    key: 'services',
  },
  {
    name: 'How It Works',
    href: '/how-it-works',
    key: 'how-it-works',
  },
  {
    name: 'Sign Up / Login',
    href: '/login',
    key: 'auth',
  },
];

export function Header({ variant = 'default' }: HeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Check if we're in booking flow
  const isBookingFlow = pathname?.startsWith('/booking') || pathname?.startsWith('/booking-v2');
  
  // Always call hook (React rules), but only use it in booking flow
  const bookingHook = useBookingV2();
  const bookingState = isBookingFlow ? bookingHook.state : { currentStep: 1 };

  // Determine current page based on pathname
  const getCurrentPage = () => {
    if (pathname === '/') return 'home';
    if (pathname.startsWith('/location')) return 'locations';
    if (pathname.startsWith('/services')) return 'services';
    if (pathname.startsWith('/how-it-works')) return 'how-it-works';
    if (pathname.startsWith('/login') || pathname.startsWith('/signup')) return 'auth';
    return null;
  };

  const currentPage = getCurrentPage();

  // Logo component
  const Logo = () => {
    return (
      <div className="w-10 h-10 rounded-lg overflow-hidden bg-transparent flex items-center justify-center">
        <Image 
          src="/logo.svg"
          alt="Shalean Logo"
          width={40}
          height={40}
          className="w-8 h-8 object-contain"
          priority={false}
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
              <div className="text-lg md:text-xl font-bold text-gray-900">Shalean</div>
            </Link>
            <Button variant="outline" asChild>
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
      <div className="container mx-auto px-4 max-w-7xl relative">
        <div className="flex items-center justify-between py-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 flex-shrink-0">
              <Logo />
            </Link>

            {/* Desktop Navigation - Hidden in booking flow */}
            {!isBookingFlow && (
              <nav className="hidden md:flex items-center gap-8">
                {navigationItems.map((item) => {
                const isActive = currentPage === item.key;
                  
                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      className={`text-sm font-medium transition-colors ${
                        isActive
                          ? 'text-gray-900 font-semibold'
                          : 'text-gray-700 hover:text-gray-900'
                      }`}
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            )}

            {/* Stepper - Centered horizontally, only visible in booking flow */}
            {isBookingFlow && (
              <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                {/* Desktop Stepper - Only desktop version, no mobile duplicate */}
                <div className="hidden md:flex items-center justify-center gap-1.5">
                  {(() => {
                    const current = bookingState.currentStep;
                    const currentGroup = current === 1 ? 1 : current === 2 ? 2 : 3;
                    
                    return (
                      <div className="flex items-center justify-center gap-1.5">
                        {[
                          { number: 1, label: 'Service & Details' },
                          { number: 2, label: 'Schedule & Cleaner' },
                          { number: 3, label: 'Contact & Review' }
                        ].map((group, idx) => {
                          const isCompleted = group.number < currentGroup;
                          const isCurrent = group.number === currentGroup;
                          const isUpcoming = group.number > currentGroup;
                          
                          return (
                            <div key={group.number} className="flex items-center gap-1.5">
                              <div className="flex flex-col items-center">
                                <motion.div
                                  className={cn(
                                    'flex h-8 w-8 items-center justify-center rounded-full font-semibold transition-all',
                                    isCompleted && 'bg-primary text-white ring-1 ring-primary/20',
                                    isCurrent && 'bg-primary text-white shadow-md ring-1 ring-primary/30',
                                    isUpcoming && 'bg-gray-50 text-gray-400 border border-gray-200'
                                  )}
                                  initial={false}
                                  animate={{ scale: isCurrent ? 1.05 : 1 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  {isCompleted ? (
                                    <Check className="h-4 w-4" />
                                  ) : (
                                    <span className={isCurrent ? 'text-sm font-bold' : 'text-xs'}>
                                      {group.number}
                                    </span>
                                  )}
                                </motion.div>
                                <span
                                  className={cn(
                                    'mt-1 text-[10px] font-medium whitespace-nowrap text-center max-w-[80px] leading-tight',
                                    !isUpcoming ? 'text-slate-900' : 'text-slate-400'
                                  )}
                                >
                                  {group.label}
                                </span>
                              </div>
                              {idx < 2 && (
                                <div className="relative w-12 lg:w-14 h-0.5 bg-gray-200 mt-[-16px]">
                                  <motion.div
                                    className="absolute inset-0 bg-primary"
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: isCompleted ? 1 : 0 }}
                                    transition={{ duration: 0.3, ease: 'easeOut' }}
                                    style={{ transformOrigin: 'left' }}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

          {/* Right Section: Buttons */}
            <div className="flex items-center gap-4">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-700 hover:text-gray-900"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>

            {/* Get Free Quote Button - Hidden in booking flow */}
              {!isBookingFlow && (
                <Button 
                  variant="outline"
                  className="hidden md:flex border-primary text-primary hover:bg-primary/10 rounded-lg px-6 py-2 text-sm font-medium transition-colors" 
                  asChild
                >
                  <Link href="/booking/quote">Get Free Quote</Link>
                </Button>
              )}

            {/* Become a Cleaner Button */}
              <Button 
              className="hidden md:flex bg-primary hover:bg-primary/90 text-white rounded-lg px-6 py-2 text-sm font-medium transition-colors" 
                asChild
              >
              <Link href="/careers">Become a Cleaner</Link>
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-gray-200 pt-4">
              <nav className="flex flex-col gap-4">
                {!isBookingFlow && navigationItems.map((item) => {
                  const isActive = currentPage === item.key;
                  
                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`text-sm font-medium transition-colors ${
                        isActive
                          ? 'text-gray-900 font-semibold'
                          : 'text-gray-700 hover:text-gray-900'
                      }`}
                    >
                      {item.name}
                    </Link>
                  );
                })}
              {/* Get Free Quote Button - Hidden in booking flow */}
              {!isBookingFlow && (
                <Button 
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary/10 rounded-lg px-6 py-2 text-sm font-medium transition-colors w-full justify-center" 
                  asChild
                >
                  <Link href="/booking/quote">Get Free Quote</Link>
                </Button>
              )}
              <Button 
                className="bg-primary hover:bg-primary/90 text-white rounded-lg px-6 py-2 text-sm font-medium transition-colors w-full justify-center" 
                asChild
              >
                <Link href="/careers">Become a Cleaner</Link>
              </Button>
              </nav>
            </div>
          )}
      </div>
    </header>
  );
}
