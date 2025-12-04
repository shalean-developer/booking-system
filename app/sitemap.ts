import { MetadataRoute } from 'next'
import { getPublishedPosts } from '@/lib/blog-server'
import { CITY_AREA_DATA } from '@/lib/location-data'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://shalean.co.za'
  
  // Get all published blog posts (only published posts are included)
  const blogPosts = await getPublishedPosts()
  
  // Generate blog post entries - filter out any null/undefined posts
  const blogEntries: MetadataRoute.Sitemap = blogPosts
    .filter((post) => post && post.slug && post.status === 'published')
    .map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.updated_at ? new Date(post.updated_at) : new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.75,
    }))
  
  // Service pages (removed deep-specialty as it's a duplicate of deep-cleaning)
  const servicePages = [
    'regular-cleaning', 'airbnb-cleaning', 'office-cleaning', 
    'apartment-cleaning', 'window-cleaning', 'home-maintenance', 
    'deep-cleaning', 'move-turnover',
    'carpet-cleaning', 'house-cleaning', 'one-time-cleaning',
    'post-construction-cleaning'
  ];

  const serviceEntries: MetadataRoute.Sitemap = servicePages.map((service) => ({
    url: `${baseUrl}/services/${service}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.9,
  }));

  // Dynamically generate location pages from CITY_AREA_DATA
  const locationEntries: MetadataRoute.Sitemap = []
  const suburbEntries: MetadataRoute.Sitemap = []
  
  // Process each city in CITY_AREA_DATA
  for (const [citySlug, areas] of Object.entries(CITY_AREA_DATA)) {
    // Add area hub pages
    for (const area of areas) {
      locationEntries.push({
        url: `${baseUrl}/location/${citySlug}/${area.slug}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.8,
      })
      
      // Add suburb pages for this area
      for (const suburb of area.suburbs) {
        suburbEntries.push({
          url: `${baseUrl}/location/${citySlug}/${suburb.slug}`,
          lastModified: new Date(),
          changeFrequency: 'monthly' as const,
          priority: 0.6,
        })
      }
    }
  }

  // Other city pages (not in CITY_AREA_DATA)
  const otherCities = [
    'east-london', 'grahamstown', 'jeffreys-bay', 'port-elizabeth'
  ];

  const otherCityEntries: MetadataRoute.Sitemap = otherCities.map((city) => ({
    url: `${baseUrl}/location/${city}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/services`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.95,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/booking/service/select`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.85,
    },
    {
      url: `${baseUrl}/booking/quote`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/popia`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/cookies`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/testimonials`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/careers`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/cancellation`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/how-it-works`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/team`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/sitemap-html`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/location`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/location/cape-town`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/location/johannesburg`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    },
    {
      url: `${baseUrl}/location/pretoria`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/location/durban`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    // Add all service pages
    ...serviceEntries,
    // Add all location area hub pages (dynamically generated)
    ...locationEntries,
    // Add all suburb pages (dynamically generated)
    ...suburbEntries,
    // Add all blog posts
    ...blogEntries,
    // Add other city pages
    ...otherCityEntries,
  ]
}

