import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://shalean.co.za'),
  title: {
    default: "Shalean Cleaning Services | Professional Home & Office Cleaning",
    template: "%s | Shalean Cleaning Services"
  },
  description: "Book professional cleaning services online. Standard, deep cleaning, move in/out, and Airbnb services. Expert cleaners, eco-friendly products, 98% satisfaction rate.",
  applicationName: "Shalean Cleaning Services",
  referrer: "origin-when-cross-origin",
  keywords: ["cleaning services", "professional cleaning", "home cleaning", "office cleaning", "deep cleaning", "Airbnb cleaning"],
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
    title: "Shalean Cleaning Services | Professional Home & Office Cleaning",
    description: "Book professional cleaning services online. Expert cleaners, eco-friendly products, 98% satisfaction rate.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shalean Cleaning Services | Professional Home & Office Cleaning",
    description: "Book professional cleaning services online. Expert cleaners, eco-friendly products, 98% satisfaction rate.",
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
  return (
    <html lang="en">
      <head>
        {/* Google Tag Manager */}
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-5XRFHPL8');`,
          }}
        />
      </head>
      <body className={cn(inter.className, "min-h-screen bg-slate-50")}>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-5XRFHPL8"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        <Toaster position="top-center" richColors />
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}

