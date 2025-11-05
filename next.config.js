/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
    minimumCacheTTL: 60,
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
    ];
  },
}

module.exports = nextConfig

