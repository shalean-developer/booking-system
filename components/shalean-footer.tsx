"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Phone, MessageSquare, MapPin, Facebook, Instagram, Linkedin } from "lucide-react";
import { ShaleanWordmark } from "@/components/shalean-wordmark";
import { GBP_LISTING_URL } from "@/lib/public-site-urls";

const quickLinks = [
  { label: "About Us", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Pricing", href: "/pricing" },
  { label: "Help", href: "/help" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

const serviceLinks = [
  "Standard Cleaning",
  "Deep Cleaning",
  "Airbnb Turnover",
  "Move In/Out",
  "Carpet Cleaning",
];

const socialLinks = [
  {
    href: "https://www.facebook.com/shaleancleaning",
    label: "Shalean on Facebook",
    Icon: Facebook,
  },
  {
    href: "https://www.instagram.com/shalean_cleaning_services/",
    label: "Shalean on Instagram",
    Icon: Instagram,
  },
  {
    href: "https://www.linkedin.com/in/shalean-cleaning-services-undefined-264687360/",
    label: "Shalean on LinkedIn",
    Icon: Linkedin,
  },
] as const;

export function ShaleanFooter() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const openCookieSettings = () => {
    window.dispatchEvent(new Event("open-cookie-settings"));
  };

  return (
    <footer className="bg-slate-900 text-white pt-24 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 flex items-center justify-center overflow-hidden">
                {mounted ? (
                  <Image
                    src="/logo.svg"
                    alt="Shalean logo"
                    width={32}
                    height={32}
                    className="h-8 w-8 object-contain"
                  />
                ) : null}
              </div>
              <ShaleanWordmark className="text-xl font-black uppercase tracking-tighter" dotClassName="text-emerald-400" />
            </div>
            <p className="text-slate-400 leading-relaxed">
              Premium cleaning services for homeowners and businesses in Cape
              Town. Quality you can trust, prices you can afford.
            </p>
            <div className="flex gap-4">
              {socialLinks.map(({ href, label, Icon }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
                  aria-label={label}
                >
                  <Icon className="w-5 h-5" aria-hidden />
                </a>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-6">Quick Links</h4>
            <ul className="space-y-4 text-slate-400">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-6">Services</h4>
            <ul className="space-y-4 text-slate-400">
              {serviceLinks.map((name) => (
                <li key={name}>
                  <Link
                    href="/services"
                    className="hover:text-white transition-colors"
                  >
                    {name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-6">Get in Touch</h4>
            <ul className="space-y-4 text-slate-400">
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <a href="tel:+27871535250" className="hover:text-white transition-colors">
                  +27 87 153 5250
                </a>
              </li>
              <li className="flex items-center gap-3">
                <MessageSquare className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <a
                  href="https://wa.me/27825915525"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-400 transition-colors"
                >
                  WhatsApp Support
                </a>
              </li>
              <li className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
                Cape Town, South Africa
              </li>
              <li className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-amber-400 flex-shrink-0" aria-hidden />
                <a
                  href={GBP_LISTING_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Google Business Profile
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <p>© {new Date().getFullYear()} Shalean Cleaning Services. All rights reserved.</p>
          <div className="flex gap-8">
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
            <button
              type="button"
              onClick={openCookieSettings}
              className="hover:text-white transition-colors"
            >
              Cookie settings
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
