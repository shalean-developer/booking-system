'use client';

import Image from 'next/image';
import { Star, CheckCircle2, ClipboardList } from 'lucide-react';

export function HomeReviewsApp() {
  // Profile avatars - using existing team images or placeholders
  const avatars = [
    '/images/team-lucia.webp',
    '/images/team-normatter.webp',
    '/images/team-nyasha.webp',
    '/images/team-lucia.webp',
  ];

  return (
    <section className="py-8 bg-white border-b">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left Section - Reviews with Avatars */}
          <div className="flex items-center gap-3">
            {/* Profile Avatars */}
            <div className="flex items-center -space-x-2">
              {avatars.map((avatar, index) => (
                <div
                  key={index}
                  className="relative w-10 h-10 rounded-full border-2 border-white overflow-hidden bg-gray-200"
                >
                  <Image
                    src={avatar}
                    alt={`Trusted client ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="40px"
                    onError={(e) => {
                      e.currentTarget.parentElement!.style.backgroundColor = '#e5e7eb';
                    }}
                  />
                </div>
              ))}
            </div>
            {/* Stars and Text Stacked */}
            <div className="flex flex-col items-start gap-1">
              {/* Stars */}
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              {/* Text */}
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-500">Trusted by</span>
                <span className="text-sm font-semibold text-gray-900">500+</span>
                <span className="text-sm text-gray-500">clients</span>
                <span className="text-sm text-gray-400">•</span>
                <div className="flex items-center gap-0.5">
                  <span className="text-sm font-semibold text-yellow-500">5.0</span>
                  <svg className="h-3 w-3 fill-yellow-400 text-yellow-400" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Section - Satisfaction Rate (Centered) */}
          <div className="flex items-center justify-center flex-1">
            <div className="flex items-center gap-3">
              {/* Icon */}
              <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-5 w-5 text-gray-700" />
              </div>
              {/* Number and Text */}
              <div className="flex flex-col items-start gap-1">
                <div className="text-lg font-bold text-gray-900">98%</div>
                <div className="text-xs text-gray-500">Satisfaction Rate</div>
              </div>
            </div>
          </div>

          {/* Right Section - Expert Cleaners and App Store Links */}
          <div className="flex items-center gap-6">
            {/* Expert Cleaners */}
            <div className="flex items-center gap-3">
              {/* Icon */}
              <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center flex-shrink-0">
                <ClipboardList className="h-5 w-5 text-gray-700" />
              </div>
              {/* Number and Text */}
              <div className="flex flex-col items-start gap-1">
                <div className="text-lg font-bold text-gray-900">50 +</div>
                <div className="text-xs text-gray-500">Expert Cleaners</div>
              </div>
            </div>

            {/* App Store Links - Hidden until app is available */}
            {/* Uncomment when app store badges are added to /public/images/ */}
            {false && (
              <div className="flex items-center gap-4">
                <a
                  href="#"
                  className="h-10 w-auto"
                  aria-label="Download Shalean Cleaning app on App Store"
                >
                  <Image
                    src="/images/app-store-badge.svg"
                    alt="Download on App Store"
                    width={120}
                    height={40}
                    className="h-10 w-auto"
                  />
                </a>
                <a
                  href="#"
                  className="h-10 w-auto"
                  aria-label="Get Shalean Cleaning app on Google Play"
                >
                  <Image
                    src="/images/google-play-badge.svg"
                    alt="Get it on Google Play"
                    width={120}
                    height={40}
                    className="h-10 w-auto"
                  />
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

