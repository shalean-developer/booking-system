import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const disallow = [
    '/api/',
    '/admin/',
    '/dashboard/',
    '/cleaner/',
    '/booking/confirmation',
  ];

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow,
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow,
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow,
      },
    ],
    sitemap: 'https://shalean.co.za/sitemap.xml',
  }
}
