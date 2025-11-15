import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/dashboard/',
          '/cleaner/',
          '/booking/confirmation',
          '/_next/',
          '/static/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/dashboard/',
          '/cleaner/',
          '/booking/confirmation',
          '/_next/',
          '/static/',
        ],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/dashboard/',
          '/cleaner/',
          '/booking/confirmation',
          '/_next/',
          '/static/',
        ],
      },
    ],
    sitemap: 'https://shalean.co.za/sitemap.xml',
    host: 'https://shalean.co.za',
  }
}

