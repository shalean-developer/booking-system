import { MetadataRoute } from 'next'
import { getPublishedPosts } from '@/lib/blog-server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://shalean.co.za'
  
  // Get all published blog posts
  const blogPosts = await getPublishedPosts()
  
  // Generate blog post entries
  const blogEntries: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.updated_at ? new Date(post.updated_at) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  // Cape Town suburbs
  const capeTownSuburbs = [
    'camps-bay', 'sea-point', 'green-point', 'claremont', 'newlands', 'rondebosch',
    'constantia', 'muizenberg', 'table-view', 'hout-bay', 'observatory', 'woodstock',
    'bellville', 'city-centre', 'gardens', 'clifton', 'bantry-bay', 'fresnaye',
    'tamboerskloof', 'oranjezicht', 'bloubergstrand', 'milnerton', 'durbanville',
    'parow', 'brackenfell', 'wynberg', 'kenilworth', 'plumstead', 'bishopscourt',
    'tokai', 'bergvliet', 'fish-hoek', 'kalk-bay', 'simons-town', 'lakeside',
    'noordhoek', 'kommetjie', 'scarborough', 'somerset-west', 'strand', 'stellenbosch'
  ];

  // Generate Cape Town suburb entries
  const capeTownEntries: MetadataRoute.Sitemap = capeTownSuburbs.map((suburb) => ({
    url: `${baseUrl}/location/cape-town/${suburb}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.6,
  }))
  
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/services`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/services/home-maintenance`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/services/deep-specialty`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/services/move-turnover`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/booking/service/select`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/booking/quote`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
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
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
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
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/location/johannesburg`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/location/pretoria`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/location/durban`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    // Add all blog posts
    ...blogEntries,
    // Add all Cape Town suburb pages
    ...capeTownEntries,
  ]
}

