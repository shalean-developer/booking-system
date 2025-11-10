const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
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
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year cache for optimized images
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Permanent redirects (301) for SEO
  async redirects() {
    return [
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
      {
        source: '/cleaning/first-step',
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
        source: '/services/standard-cleaning',
        destination: '/services/regular-cleaning',
        permanent: true,
      },
      {
        source: '/services/house-cleaning',
        destination: '/services/regular-cleaning',
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
    ];
  },
  // Experimental optimizations
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons', 'framer-motion'],
  },
}

module.exports = withBundleAnalyzer(nextConfig)

