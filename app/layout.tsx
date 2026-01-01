import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { cn } from "@/lib/utils";
import { stringifyStructuredData } from "@/lib/structured-data-validator";
import ToasterWrapper from "./components/toaster";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'arial', 'sans-serif'],
  adjustFontFallback: true,
  variable: '--font-inter',
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  display: 'swap',
  preload: false, // Load on demand since it's used less frequently
  fallback: ['serif'],
  variable: '--font-playfair',
  // Only load normal style - italic can be achieved via CSS font-style
});

export const metadata: Metadata = {
  metadataBase: new URL('https://shalean.co.za'),
  title: {
    default: "Shalean Cleaning Services — Professional Home Cleaning",
    template: "%s | Shalean Cleaning Services"
  },
  description: "Reliable home & apartment cleaning in Cape Town, Johannesburg, Pretoria, and Durban. Book deep cleans, move-outs, and regular cleaning with Shalean. Professional cleaners, eco-friendly products, satisfaction guaranteed.",
  applicationName: "Shalean Cleaning Services",
  referrer: "origin-when-cross-origin",
  keywords: ["cleaning services", "professional cleaning", "home cleaning", "office cleaning", "deep cleaning", "Airbnb cleaning", "Cape Town cleaning"],
  authors: [{ name: "Shalean Cleaning Services" }],
  creator: "Shalean Cleaning Services",
  publisher: "Shalean Cleaning Services",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icon-32.png', type: 'image/png', sizes: '32x32' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
  manifest: '/manifest.json',
  openGraph: {
    type: "website",
    locale: "en_ZA",
    url: "https://shalean.co.za",
    siteName: "Shalean Cleaning Services",
    title: "Shalean Cleaning Services — Professional Home Cleaning",
    description: "Reliable home & apartment cleaning in Cape Town, Johannesburg, Pretoria, and Durban. Book deep cleans, move-outs, and regular cleaning with Shalean. Professional cleaners, eco-friendly products, satisfaction guaranteed.",
    images: [
      {
        url: "https://shalean.co.za/assets/og/home-1200x630.jpg",
        width: 1200,
        height: 630,
        alt: "Shalean Cleaning Services team cleaning a living room"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Shalean Cleaning Services — Professional Home Cleaning",
    description: "Reliable home & apartment cleaning in Cape Town, Johannesburg, Pretoria, and Durban. Book deep cleans, move-outs, and regular cleaning with Shalean. Professional cleaners, eco-friendly products, satisfaction guaranteed.",
    images: ["https://shalean.co.za/assets/og/home-1200x630.jpg"]
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;

  // Organization structured data for consistent brand name display
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://shalean.co.za/#organization",
    "name": "Shalean Cleaning Services",
    "alternateName": "Shalean",
    "url": "https://shalean.co.za",
    "logo": {
      "@type": "ImageObject",
      "url": "https://shalean.co.za/icon-512.png"
    },
    "image": {
      "@type": "ImageObject",
      "url": "https://shalean.co.za/assets/og/home-1200x630.jpg",
      "width": 1200,
      "height": 630
    },
    "description": "Professional cleaning services for homes and businesses. Expert cleaners, eco-friendly products, 98% satisfaction rate.",
    "telephone": "+27 87 153 5250",
    "address": {
      "@type": "PostalAddress",
      "addressRegion": "Western Cape",
      "addressLocality": "Cape Town",
      "addressCountry": "ZA"
    },
    "sameAs": [
      "https://www.instagram.com/shalean_cleaning_services"
    ],
    "foundingDate": "2022",
    "numberOfEmployees": "50+",
    "serviceArea": {
      "@type": "Country",
      "name": "South Africa"
    }
  };

  // WebSite structured data for site name display in Google search results
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Shalean Cleaning Services",
    "url": "https://shalean.co.za",
    "publisher": {
      "@id": "https://shalean.co.za/#organization"
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://shalean.co.za/search?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <html lang="en">
      <head>
        {/* Resource Hints for Performance - Preconnect for critical origins */}
        <link rel="preconnect" href="https://shalean.co.za" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://analytics.ahrefs.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://utfvbtcszzafuoyytlpf.supabase.co" />
        
        {/* Preload critical images for LCP optimization */}
        <link 
          rel="preload" 
          href="/images/office-cleaning-team.jpg" 
          as="image" 
          fetchPriority="high"
        />
        
        {/* Critical CSS - Minimal styles for above-the-fold content */}
        <style dangerouslySetInnerHTML={{
          __html: `
            /* Critical CSS for initial render - prevents FOUC */
            body{margin:0;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;background-color:#f8fafc;color:#0f172a}
            .min-h-screen{min-height:100vh}
          `
        }} />
        
        {/* CSS is optimized by Next.js automatically - no custom loader needed */}
        
        {/* Organization Schema for Brand Name Display */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: stringifyStructuredData(organizationSchema, "Organization") }}
        />
        
        {/* WebSite Schema for Site Name Display in Google Search Results */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: stringifyStructuredData(websiteSchema) }}
        />
        
        {/* Google Analytics (gtag.js) - Deferred to lazyOnload for better performance */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-VV357GZWXM"
          strategy="lazyOnload"
        />
        <Script
          id="google-analytics"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-VV357GZWXM');
            `,
          }}
        />
        
        {/* Ahrefs Analytics - Deferred to lazyOnload for better performance */}
        <Script
          src="https://analytics.ahrefs.com/analytics.js"
          data-key="03pYd6IC2yPD0CqqG1dMTg"
          strategy="lazyOnload"
        />
      </head>
      <body className={cn(inter.variable, playfairDisplay.variable, inter.className, "min-h-screen bg-slate-50")} suppressHydrationWarning>
        {gtmId && (
          <>
            {/* Google Tag Manager */}
            <Script
              id="gtm-script"
              strategy="lazyOnload"
              dangerouslySetInnerHTML={{
                __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${gtmId}');`,
              }}
            />
            {/* Google Tag Manager (noscript) */}
            <noscript>
              <iframe
                src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
                height="0"
                width="0"
                style={{ display: 'none', visibility: 'hidden' }}
              />
            </noscript>
          </>
        )}
        {/* Skip to main content link for accessibility */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-md focus:shadow-lg"
          aria-label="Skip to main content"
          suppressHydrationWarning
        >
          Skip to main content
        </a>
        
        <ToasterWrapper />
        <ServiceWorkerRegister />
        
        {/* Chunk Error Handler */}
        <Script
          id="chunk-error-handler"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('error', function(e) {
                if (e.message && e.message.includes('Loading chunk') && e.message.includes('failed')) {
                  console.log('Chunk loading error detected, reloading page...');
                  setTimeout(() => {
                    window.location.reload();
                  }, 1000);
                }
              });
              
              window.addEventListener('unhandledrejection', function(e) {
                if (e.reason && e.reason.name === 'ChunkLoadError') {
                  console.log('Chunk loading promise rejection detected, reloading page...');
                  setTimeout(() => {
                    window.location.reload();
                  }, 1000);
                }
              });
            `,
          }}
        />
        
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}

