'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Facebook, Twitter, Instagram, Linkedin, ChevronRight } from "lucide-react";

// Contact email - ensure consistency between server and client
// IMPORTANT: This must match exactly on server and client to prevent hydration errors
const CONTACT_EMAIL = 'info@shalean.com' as const;
const CONTACT_PHONE = '+27 87 153 5250';

export function HomeFooter() {
  const [currentYear, setCurrentYear] = useState(2024);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
    setMounted(true);
  }, []);

  return (
    <>
      <footer className="bg-white text-gray-900 relative overflow-hidden">
        {/* Decorative diagonal lines in corners */}
        <div className="absolute bottom-0 left-0 w-64 h-64 opacity-[0.03] pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <line x1="0" y1="100" x2="100" y2="0" stroke="#000" strokeWidth="1" />
          </svg>
        </div>
        <div className="absolute bottom-0 right-0 w-64 h-64 opacity-[0.03] pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <line x1="0" y1="0" x2="100" y2="100" stroke="#000" strokeWidth="1" />
          </svg>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Main Footer Content */}
          <div className="py-12 sm:py-16">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
              {/* Brand Section */}
              <div className="lg:col-span-1">
                <Link href="/" className="inline-flex items-center gap-2 mb-4">
                  <Image
                    src="/logo.svg"
                    alt="Shalean"
                    width={40}
                    height={40}
                    className="h-10 w-10 object-contain"
                  />
                  <span className="text-2xl font-bold text-gray-900">Shalean</span>
                </Link>
                <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                  Shalean delivers reliable, professional cleaning services for spotless, healthy spaces.
                </p>
                {/* Social Media Icons */}
                <div className="flex items-center gap-3">
                  <a 
                    href="https://facebook.com/shaleancleaning" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-white border border-gray-300 rounded-full flex items-center justify-center hover:border-gray-400 transition-colors"
                    aria-label="Visit our Facebook page"
                  >
                    <Facebook className="h-5 w-5 text-gray-900" />
                  </a>
                  <a 
                    href="https://instagram.com/shaleancleaning" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-white border border-gray-300 rounded-full flex items-center justify-center hover:border-gray-400 transition-colors"
                    aria-label="Visit our Instagram profile"
                  >
                    <Instagram className="h-5 w-5 text-gray-900" />
                  </a>
                  <a 
                    href="https://twitter.com/shaleancleaning" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-white border border-gray-300 rounded-full flex items-center justify-center hover:border-gray-400 transition-colors"
                    aria-label="Visit our Twitter page"
                  >
                    <Twitter className="h-5 w-5 text-gray-900" />
                  </a>
                  <a 
                    href="https://linkedin.com/company/shaleancleaning" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-white border border-gray-300 rounded-full flex items-center justify-center hover:border-gray-400 transition-colors"
                    aria-label="Visit our LinkedIn page"
                  >
                    <Linkedin className="h-5 w-5 text-gray-900" />
                  </a>
                </div>
              </div>

              {/* Company Links */}
              <div>
                <h3 className="font-bold mb-4 text-base text-gray-900">Company</h3>
                <ul className="space-y-3">
                  <li>
                    <Link href="/" className="text-sm text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2 group">
                      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                      Home
                    </Link>
                  </li>
                  <li>
                    <Link href="/about" className="text-sm text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2 group">
                      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                      About Us
                    </Link>
                  </li>
                  <li>
                    <Link href="/services" className="text-sm text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2 group">
                      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                      Services
                    </Link>
                  </li>
                  <li>
                    <Link href="/services" className="text-sm text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2 group">
                      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                      Projects
                    </Link>
                  </li>
                  <li>
                    <Link href="/blog" className="text-sm text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2 group">
                      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                      Blogs
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="text-sm text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2 group">
                      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                      Contact Us
                    </Link>
                  </li>
                  <li>
                    <Link href="/pricing" className="text-sm text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2 group">
                      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                      Pricing
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Services Section */}
              <div>
                <h3 className="font-bold mb-4 text-base text-gray-900">Services</h3>
                <ul className="space-y-3">
                  <li>
                    <Link href="/services/deep-cleaning" className="text-sm text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2 group">
                      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                      Deep Cleaning Service
                    </Link>
                  </li>
                  <li>
                    <Link href="/services/office-cleaning" className="text-sm text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2 group">
                      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                      Office Cleaning Service
                    </Link>
                  </li>
                  <li>
                    <Link href="/services/move-turnover" className="text-sm text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2 group">
                      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                      Move-In Cleaning
                    </Link>
                  </li>
                  <li>
                    <Link href="/services/regular-cleaning" className="text-sm text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2 group">
                      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                      Regular Cleaning
                    </Link>
                  </li>
                  <li>
                    <Link href="/services/airbnb-cleaning" className="text-sm text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2 group">
                      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                      Airbnb Cleaning
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Contacts */}
              <div>
                <h3 className="font-bold mb-4 text-base text-gray-900">Contacts</h3>
                <ul className="space-y-3">
                  <li>
                    <a 
                      href={`tel:${CONTACT_PHONE.replace(/\s/g, '')}`}
                      className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      (+27) 87 153 5250
                    </a>
                  </li>
                  <li>
                    <a 
                      href={`mailto:${CONTACT_EMAIL}`}
                      className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                      suppressHydrationWarning
                    >
                      {mounted ? CONTACT_EMAIL : 'info@shalean.com'}
                    </a>
                  </li>
                </ul>
              </div>

              {/* Legal & Policies */}
              <div>
                <h3 className="font-bold mb-4 text-base text-gray-900">Legal & Policies</h3>
                <ul className="space-y-3">
                  <li>
                    <Link href="/privacy" className="text-sm text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2 group">
                      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms" className="text-sm text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2 group">
                      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                      Terms & Conditions
                    </Link>
                  </li>
                  <li>
                    <Link href="/cookies" className="text-sm text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2 group">
                      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                      Cookie Policy
                    </Link>
                  </li>
                  <li>
                    <Link href="/popia" className="text-sm text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2 group">
                      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                      POPIA Compliance
                    </Link>
                  </li>
                  <li>
                    <Link href="/faq" className="text-sm text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2 group">
                      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                      FAQ
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom Copyright Bar */}
          <div className="border-t border-gray-200 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-gray-600 text-center md:text-left">
                Copyright © {currentYear} Shalean Cleaning Services. All rights reserved.
              </p>
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
