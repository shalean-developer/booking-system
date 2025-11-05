/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Performance optimizations
  swcMinify: true,
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
      {
        source: '/booking',
        destination: '/booking/service/select',
        permanent: true,
      },
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
    ];
  },
  // Experimental optimizations
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons', 'framer-motion'],
    turbo: {
      resolveAlias: {
        // Optimize imports
        'lucide-react': 'lucide-react/dist/esm/icons',
      },
    },
  },
}

module.exports = nextConfig

