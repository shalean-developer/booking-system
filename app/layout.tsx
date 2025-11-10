import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import { stringifyStructuredData } from "@/lib/structured-data-validator";

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial'],
  adjustFontFallback: true,
  variable: '--font-inter',
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
    "logo": "https://shalean.co.za/icon-512.png",
    "description": "Professional cleaning services for homes and businesses. Expert cleaners, eco-friendly products, 98% satisfaction rate.",
    "telephone": "+27 87 153 5250",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "ZA"
    },
    "sameAs": [
      "https://instagram.com/shaleancleaning"
    ],
    "foundingDate": "2020",
    "numberOfEmployees": "50+",
    "serviceArea": {
      "@type": "Country",
      "name": "South Africa"
    }
  };

  return (
    <html lang="en">
      <head>
        {/* Resource Hints for Performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://utfvbtcszzafuoyytlpf.supabase.co" />
        
        {/* Preload critical resources */}
        <link rel="preload" href="/logo.svg" as="image" type="image/svg+xml" />
        
        {/* Organization Schema for Brand Name Display */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: stringifyStructuredData(organizationSchema, "Organization") }}
        />
      </head>
      <body className={cn(inter.variable, inter.className, "min-h-screen bg-slate-50")}>
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
        <Toaster position="top-center" richColors />
        
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

