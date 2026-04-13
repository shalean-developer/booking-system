import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { cn } from "@/lib/utils";
import { GBP_LISTING_URL } from "@/lib/public-site-urls";
import { ORGANIZATION_SAME_AS, SITE_PHONE_DISPLAY, SITE_SUPPORT_EMAIL } from "@/lib/site-config";
import { stringifyStructuredData } from "@/lib/structured-data-validator";
import ToasterWrapper from "./components/toaster";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { AnalyticsConsent } from "@/components/analytics-consent";
import { BookingProvider } from "@/context/BookingContext"; // ✅ ADDED

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
  preload: false,
  fallback: ['serif'],
  variable: '--font-playfair',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://shalean.co.za'),
  title: {
    default: "Shalean Cleaning Services — Professional Home Cleaning",
    template: "%s | Shalean Cleaning Services"
  },
  description: "Reliable home & apartment cleaning in Cape Town, Johannesburg, Pretoria, and Durban. Book deep cleans, move-outs, and regular cleaning with Shalean.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://shalean.co.za/#organization",
    "name": "Shalean Cleaning Services",
    "url": "https://shalean.co.za",
    "telephone": SITE_PHONE_DISPLAY,
    "email": SITE_SUPPORT_EMAIL,
    "sameAs": [GBP_LISTING_URL, ...ORGANIZATION_SAME_AS],
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: stringifyStructuredData(organizationSchema) }}
        />
      </head>

      <body className={cn(inter.variable, playfairDisplay.variable, inter.className, "min-h-screen bg-slate-50")}>
        
        {gtmId && (
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
        )}

        {/* ✅ BOOKING CONTEXT WRAP */}
        <BookingProvider>
          <ToasterWrapper />
          <ServiceWorkerRegister />
          <AnalyticsConsent />

          <div className="min-h-screen">
            {children}
          </div>
        </BookingProvider>

      </body>
    </html>
  );
}
        
