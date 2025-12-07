const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  // Add empty turbopack config to silence Next.js 16 warning
  // We use webpack for custom chunk splitting configuration
  turbopack: {},
  images: {
    // Remote patterns for external images
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'utfvbtcszzafuoyytlpf.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    // Image optimization configuration
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 512, 640, 750, 1125],
    minimumCacheTTL: 31536000, // 1 year cache for optimized images
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Permanent redirects (301) for SEO
  async redirects() {
    return [
      // Force apex domain
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.shalean.co.za',
          },
        ],
        destination: 'https://shalean.co.za/:path*',
        permanent: true,
      },
      // Old blog URLs with domain prefix
      {
        source: '/blog/shalean.co.za',
        destination: '/',
        permanent: true,
      },
      {
        source: '/blog/shalean.co.za/booking/service/select',
        destination: '/booking/service/select',
        permanent: true,
      },
      // Wildcard redirect for old blog URLs with domain prefix
      {
        source: '/blog/shalean.co.za/:path*',
        destination: '/blog/:path*',
        permanent: true,
      },
      // Old blog post URLs
      {
        source: '/blog/eco-friendly-cleaning-products',
        destination: '/blog/the-benefits-of-eco-friendly-cleaning-products',
        permanent: true,
      },
      {
        source: '/blog/welcome-to-blog-cms',
        destination: '/blog',
        permanent: true,
      },
      {
        source: '/blog/selecting-best-cleaning-service',
        destination: '/blog',
        permanent: true,
      },
      {
        source: '/blog/complete-airbnb-turnover-cleaning-checklist',
        destination: '/blog/airbnb-cleaning-checklist',
        permanent: true,
      },
      // Old service URLs
      {
        source: '/services/move-in-cleaning',
        destination: '/services/move-turnover',
        permanent: true,
      },
      {
        source: '/services/construction-dust-removal',
        destination: '/services/post-construction-cleaning',
        permanent: true,
      },
      {
        source: '/services/after-party-cleaning',
        destination: '/services/one-time-cleaning',
        permanent: true,
      },
      {
        source: '/services/deep-specialty',
        destination: '/services/deep-cleaning',
        permanent: true,
      },
      // Old booking URLs
      {
        source: '/booking',
        destination: '/booking/service/select',
        permanent: true,
      },
      {
        source: '/booking/service',
        destination: '/booking/service/select',
        permanent: true,
      },
      // Old booking IDs redirect to confirmation page (format: numbersxnumbers)
      {
        source: '/booking/:id([0-9]+x[0-9]+)',
        destination: '/booking/confirmation',
        permanent: true,
      },
      // Legacy content URLs
      {
        source: '/articles/:path*',
        destination: '/blog',
        permanent: true,
      },
      {
        source: '/article_page/:path*',
        destination: '/blog',
        permanent: true,
      },
      {
        source: '/blog/cleaning-frequency',
        destination: '/blog',
        permanent: true,
      },
      {
        source: '/blog/cleaning-mistakes',
        destination: '/blog',
        permanent: true,
      },
      {
        source: '/blog/how-to-prepare-for-a-deep-clean',
        destination: '/blog',
        permanent: true,
      },
      {
        source: '/cleaning/first-step',
        destination: '/booking/service/select',
        permanent: true,
      },
      {
        source: '/cleaning0/:path*',
        destination: '/booking/service/select',
        permanent: true,
      },
      {
        source: '/cleaning1',
        destination: '/booking/service/select',
        permanent: true,
      },
      // Old location paths
      {
        source: '/location/cape-town/helderberg',
        destination: '/location/cape-town/helderberg-winelands',
        permanent: true,
      },
      {
        source: '/location/cape-town/winelands',
        destination: '/location/cape-town/helderberg-winelands',
        permanent: true,
      },
      {
        source: '/locations/tableview',
        destination: '/location/cape-town/table-view',
        permanent: true,
      },
      {
        source: '/locations/durbanvale',
        destination: '/location/cape-town/durbanville',
        permanent: true,
      },
      {
        source: '/locations/clareinch',
        destination: '/location/cape-town/claremont',
        permanent: true,
      },
      {
        source: '/locations/lower-vrede',
        destination: '/location/cape-town/southern-suburbs',
        permanent: true,
      },
      {
        source: '/locations/welgemoed',
        destination: '/location/cape-town/northern-suburbs',
        permanent: true,
      },
      {
        source: '/locations/de-waterkant',
        destination: '/location/cape-town/city-bowl',
        permanent: true,
      },
      // Old location URLs (plural to singular, add city prefix)
      {
        source: '/locations/-city-bowl',
        destination: '/location/cape-town/city-bowl',
        permanent: true,
      },
      {
        source: '/locations/glencairn',
        destination: '/location/cape-town/false-bay',
        permanent: true,
      },
      // Specific location mappings from CSV
      {
        source: '/locations/kalk-bay',
        destination: '/location/cape-town/kalk-bay',
        permanent: true,
      },
      {
        source: '/locations/observatory',
        destination: '/location/cape-town/observatory',
        permanent: true,
      },
      {
        source: '/locations/paarl',
        destination: '/location/cape-town/paarl',
        permanent: true,
      },
      {
        source: '/locations/george',
        destination: '/location/cape-town/george',
        permanent: true,
      },
      {
        source: '/locations/rosebank',
        destination: '/location/johannesburg/rosebank',
        permanent: true,
      },
      {
        source: '/locations/faure',
        destination: '/location/cape-town',
        permanent: true,
      },
      {
        source: '/locations/sunnyside',
        destination: '/location/pretoria/sunnyside',
        permanent: true,
      },
      {
        source: '/locations/:slug',
        destination: '/location/cape-town/:slug',
        permanent: true,
      },
      // Wildcard redirect for all old location URLs
      // Specific known locations are handled above, this catches everything else
      {
        source: '/locations/:path*',
        destination: '/location',
        permanent: true,
      },
      // Old service URLs
      {
        source: '/services/moving-cleaning',
        destination: '/services/move-turnover',
        permanent: true,
      },
      {
        source: '/services/carpet',
        destination: '/services/deep-specialty',
        permanent: true,
      },
      {
        source: '/services/carpet-cleaning',
        destination: '/services/deep-specialty',
        permanent: true,
      },
      {
        source: '/services/office-',
        destination: '/services/office-cleaning',
        permanent: true,
      },
      {
        source: '/services/standard-cleaning',
        destination: '/services/regular-cleaning',
        permanent: true,
      },
      {
        source: '/services/house-cleaning',
        destination: '/services/regular-cleaning',
        permanent: true,
      },
      {
        source: '/services/move-in-out-cleaning',
        destination: '/services/move-turnover',
        permanent: true,
      },
      // Old page URLs
      {
        source: '/reviews',
        destination: '/testimonials',
        permanent: true,
      },
      {
        source: '/auth',
        destination: '/login',
        permanent: true,
      },
      {
        source: '/auth/signin',
        destination: '/login',
        permanent: true,
      },
      {
        source: '/auth/sign-up',
        destination: '/signup',
        permanent: true,
      },
      {
        source: '/account',
        destination: '/login',
        permanent: true,
      },
      {
        source: '/community/:path*',
        destination: '/blog',
        permanent: true,
      },
      {
        source: '/apply',
        destination: '/careers/apply',
        permanent: true,
      },
      {
        source: '/about_us',
        destination: '/about',
        permanent: true,
      },
      {
        source: '/legal/terms',
        destination: '/terms',
        permanent: true,
      },
      {
        source: '/legal/privacy',
        destination: '/privacy',
        permanent: true,
      },
      {
        source: '/user/m',
        destination: '/login',
        permanent: true,
      },
      {
        source: '/privacy-policy',
        destination: '/privacy',
        permanent: true,
      },
      {
        source: '/refund',
        destination: '/terms',
        permanent: true,
      },
      {
        source: '/shipping',
        destination: '/terms',
        permanent: true,
      },
      {
        source: '/&',
        destination: '/',
        permanent: true,
      },
      {
        source: '/$',
        destination: '/',
        permanent: true,
      },
      // Fix URL encoding issues for location pages
      {
        source: '/location/cape-town/simon\'s-town',
        destination: '/location/cape-town/simons-town',
        permanent: true,
      },
      {
        source: '/location/cape-town/simon%27s-town',
        destination: '/location/cape-town/simons-town',
        permanent: true,
      },
      {
        source: '/location/cape-town/v&a-waterfront',
        destination: '/location/cape-town/waterfront',
        permanent: true,
      },
      {
        source: '/location/cape-town/v%26a-waterfront',
        destination: '/location/cape-town/waterfront',
        permanent: true,
      },
      // Handle malformed URLs and encoded strings
      {
        source: '/locations/:id([0-9]+x[0-9]+)',
        destination: '/location',
        permanent: true,
      },
      {
        source: '/locations/<p><a',
        destination: '/location',
        permanent: true,
      },
    ];
  },
  // Internal rewrites for booking flow migration
  // Old booking URLs internally serve new booking-v2 content without changing browser URL
  async rewrites() {
    return [
      {
        source: '/booking/service/select',
        destination: '/booking-v2/select',
      },
      {
        source: '/booking/service/:slug/details',
        destination: '/booking-v2/:slug/details',
      },
      {
        source: '/booking/service/:slug/schedule',
        destination: '/booking-v2/:slug/schedule',
      },
      {
        source: '/booking/service/:slug/contact',
        destination: '/booking-v2/:slug/contact',
      },
      {
        source: '/booking/service/:slug/select-cleaner',
        destination: '/booking-v2/:slug/cleaner',
      },
      {
        source: '/booking/service/:slug/review',
        destination: '/booking-v2/:slug/review',
      },
      {
        source: '/booking/confirmation',
        destination: '/booking-v2/confirmation',
      },
    ];
  },
  // Experimental optimizations
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons', 'framer-motion'],
  },
  // Compiler options for modern JavaScript
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // Optimize webpack chunk splitting for better code splitting
  webpack: (config, { isServer }) => {
    // Ignore optional Sentry package warnings
    config.resolve = {
      ...config.resolve,
      fallback: {
        ...config.resolve?.fallback,
      },
    };
    
    // Suppress warnings for optional dependencies
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /@sentry\/nextjs/,
        message: /Can't resolve '@sentry\/nextjs'/,
      },
    ];

    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: -10,
              reuseExistingChunk: true,
            },
            // Separate large libraries into their own chunks
            framerMotion: {
              test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
              name: 'framer-motion',
              priority: 20,
              reuseExistingChunk: true,
            },
            recharts: {
              test: /[\\/]node_modules[\\/]recharts[\\/]/,
              name: 'recharts',
              priority: 20,
              reuseExistingChunk: true,
            },
            radixUI: {
              test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
              name: 'radix-ui',
              priority: 15,
              reuseExistingChunk: true,
            },
            sonner: {
              test: /[\\/]node_modules[\\/]sonner[\\/]/,
              name: 'sonner',
              priority: 20,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }
    return config;
  },
}

module.exports = withBundleAnalyzer(nextConfig)

