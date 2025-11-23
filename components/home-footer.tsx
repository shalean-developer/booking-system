'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from "lucide-react";

// Contact email - ensure consistency between server and client
// IMPORTANT: This must match exactly on server and client to prevent hydration errors
const CONTACT_EMAIL = 'info@shalean.com' as const;

export function HomeFooter() {
  const [currentYear, setCurrentYear] = useState(2024);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
    setMounted(true);
  }, []);

  return (
    <>
      <footer className="bg-gray-900 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Main Footer Content */}
          <div className="py-12 sm:py-16">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
              {/* Brand Section */}
              <div className="lg:col-span-1">
                <Link href="/" className="inline-block mb-4">
                  <Image
                    src="/logo.svg"
                    alt="Shalean Cleaning Services"
                    width={120}
                    height={40}
                    className="h-8 w-auto"
                  />
                </Link>
                <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                  Professional cleaning services in Cape Town. Trusted cleaners for your home, office, and Airbnb.
                </p>
                <div className="mb-6">
                  <p className="text-xs text-gray-500 mb-2">Serving Cape Town areas:</p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Link href="/location/cape-town/sea-point" className="text-gray-400 hover:text-primary transition-colors">
                      Sea Point
                    </Link>
                    <span className="text-gray-600">•</span>
                    <Link href="/location/cape-town/claremont" className="text-gray-400 hover:text-primary transition-colors">
                      Claremont
                    </Link>
                    <span className="text-gray-600">•</span>
                    <Link href="/location/cape-town/constantia" className="text-gray-400 hover:text-primary transition-colors">
                      Constantia
                    </Link>
                    <span className="text-gray-600">•</span>
                    <Link href="/location/cape-town/camps-bay" className="text-gray-400 hover:text-primary transition-colors">
                      Camps Bay
                    </Link>
                    <span className="text-gray-600">•</span>
                    <Link href="/location/cape-town" className="text-gray-400 hover:text-primary transition-colors">
                      More areas →
                    </Link>
                  </div>
                </div>
                {/* Social Media */}
                <div className="flex items-center gap-3">
                  <a 
                    href="https://facebook.com/shaleancleaning" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary transition-colors"
                    aria-label="Visit our Facebook page"
                  >
                    <Facebook className="h-4 w-4 text-white" />
                  </a>
                  <a 
                    href="https://twitter.com/shaleancleaning" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary transition-colors"
                    aria-label="Visit our Twitter page"
                  >
                    <Twitter className="h-4 w-4 text-white" />
                  </a>
                  <a 
                    href="https://instagram.com/shaleancleaning" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary transition-colors"
                    aria-label="Visit our Instagram profile"
                  >
                    <Instagram className="h-4 w-4 text-white" />
                  </a>
                </div>
              </div>

              {/* Services */}
              <div>
                <h3 className="font-semibold mb-4 text-base text-white">Services</h3>
                <ul className="space-y-3">
                  <li>
                    <Link href="/services/regular-cleaning" className="text-sm text-gray-400 hover:text-white transition-colors">
                      Standard Cleaning
                    </Link>
                  </li>
                  <li>
                    <Link href="/services/deep-specialty" className="text-sm text-gray-400 hover:text-white transition-colors">
                      Deep Cleaning
                    </Link>
                  </li>
                  <li>
                    <Link href="/services/move-turnover" className="text-sm text-gray-400 hover:text-white transition-colors">
                      Move In/Out
                    </Link>
                  </li>
                  <li>
                    <Link href="/services/office-cleaning" className="text-sm text-gray-400 hover:text-white transition-colors">
                      Office Cleaning
                    </Link>
                  </li>
                  <li>
                    <Link href="/booking/service/select" className="text-sm text-primary hover:text-primary/80 transition-colors font-medium">
                      Book Now →
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Company */}
              <div>
                <h3 className="font-semibold mb-4 text-base text-white">Company</h3>
                <ul className="space-y-3">
                  <li>
                    <Link href="/about" className="text-sm text-gray-400 hover:text-white transition-colors">
                      About Us
                    </Link>
                  </li>
                  <li>
                    <Link href="/careers" className="text-sm text-gray-400 hover:text-white transition-colors">
                      Careers
                    </Link>
                  </li>
                  <li>
                    <Link href="/blog" className="text-sm text-gray-400 hover:text-white transition-colors">
                      Blog
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="text-sm text-gray-400 hover:text-white transition-colors">
                      Contact
                    </Link>
                  </li>
                  <li>
                    <Link href="/login" className="text-sm text-primary hover:text-primary/80 transition-colors font-medium">
                      Sign In →
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Legal & Support */}
              <div>
                <h3 className="font-semibold mb-4 text-base text-white">Legal & Support</h3>
                <ul className="space-y-3">
                  <li>
                    <Link href="/terms" className="text-sm text-gray-400 hover:text-white transition-colors">
                      Terms & Conditions
                    </Link>
                  </li>
                  <li>
                    <Link href="/privacy" className="text-sm text-gray-400 hover:text-white transition-colors">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="text-sm text-gray-400 hover:text-white transition-colors">
                      Help Center
                    </Link>
                  </li>
                  <li>
                    <Link href="/faq" className="text-sm text-gray-400 hover:text-white transition-colors">
                      FAQ
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-gray-400 text-center md:text-left">
                Copyright © {currentYear} Shalean Cleaning Services. All rights reserved.
              </p>
              <div className="flex items-center gap-6 text-sm text-gray-400">
                <a 
                  href={`mailto:${CONTACT_EMAIL}`} 
                  className="hover:text-white transition-colors flex items-center gap-2"
                  suppressHydrationWarning
                >
                  <Mail className="h-4 w-4" />
                  <span className="hidden sm:inline" suppressHydrationWarning>
                    {mounted ? CONTACT_EMAIL : 'info@shalean.com'}
                  </span>
                </a>
                <a href="tel:+27871535250" className="hover:text-white transition-colors flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span className="hidden sm:inline">+27 87 153 5250</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Action Button */}
      <button
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary hover:bg-primary/90 text-white rounded-full shadow-lg flex items-center justify-center z-50 transition-all hover:scale-110"
        aria-label="Quick access"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="h-6 w-6"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 19.5v-15m0 0l-6.75 6.75M12 4.5l6.75 6.75" />
        </svg>
      </button>
    </>
  );
}
