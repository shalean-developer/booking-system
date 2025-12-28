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
                    href="https://www.instagram.com/shalean_cleaning_services" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-white border border-gray-300 rounded-full flex items-center justify-center hover:border-gray-400 transition-colors"
                    aria-label="Visit our Instagram profile"
                  >
                    <Instagram className="h-5 w-5 text-gray-900" />
                  </a>
                  <a 
                    href="https://x.com/shaloclean" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-white border border-gray-300 rounded-full flex items-center justify-center hover:border-gray-400 transition-colors"
                    aria-label="Visit our Twitter page"
                  >
                    <Twitter className="h-5 w-5 text-gray-900" />
                  </a>
                  <a 
                    href="https://www.linkedin.com/in/shalean-cleaning-services-undefined-264687360/" 
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

      {/* WhatsApp Floating Action Button */}
      <a
        href="https://wa.me/27825915525"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-full shadow-lg flex items-center justify-center z-50 transition-all hover:scale-110"
        aria-label="Contact us on WhatsApp"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-7 w-7"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
      </a>
    </>
  );
}
