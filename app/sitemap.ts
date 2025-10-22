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
  
  // Service pages
  const servicePages = [
    'regular-cleaning', 'airbnb-cleaning', 'office-cleaning', 
    'apartment-cleaning', 'window-cleaning', 'home-maintenance', 
    'deep-specialty', 'move-turnover'
  ];

  const serviceEntries: MetadataRoute.Sitemap = servicePages.map((service) => ({
    url: `${baseUrl}/services/${service}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.85,
  }));

  // Cape Town area hub pages
  const capeTownAreas = [
    'atlantic-seaboard', 'city-bowl', 'northern-suburbs', 
    'southern-suburbs', 'false-bay', 'west-coast', 'helderberg-winelands'
  ];

  const capeTownAreaEntries: MetadataRoute.Sitemap = capeTownAreas.map((area) => ({
    url: `${baseUrl}/location/cape-town/${area}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  // Johannesburg area hub pages
  const johannesburgAreas = [
    'northern-suburbs', 'midrand', 'eastern-suburbs', 
    'southern-suburbs', 'western-suburbs', 'inner-city'
  ];

  const johannesburgAreaEntries: MetadataRoute.Sitemap = johannesburgAreas.map((area) => ({
    url: `${baseUrl}/location/johannesburg/${area}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  // Johannesburg suburb pages
  const johannesburgSuburbs = [
    'sandton', 'rosebank', 'fourways', 'bryanston', 'randburg', 
    'hyde-park', 'parktown-north', 'melrose', 'waterfall', 
    'halfway-house', 'bedfordview', 'edenvale', 'kempton-park', 
    'benoni', 'boksburg', 'rosettenville', 'southgate', 
    'mondeor', 'turffontein', 'roodepoort', 'florida', 
    'honeydew', 'johannesburg-cbd', 'braamfontein', 'parktown', 
    'houghton', 'westcliff'
  ];

  const johannesburgSuburbEntries: MetadataRoute.Sitemap = johannesburgSuburbs.map((suburb) => ({
    url: `${baseUrl}/location/johannesburg/${suburb}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  // Pretoria suburb pages
  const pretoriaSuburbs = [
    'centurion', 'menlyn', 'pretoria-cbd', 'arcadia', 'sunnyside', 
    'hatfield', 'lynnwood', 'brooklyn', 'waterkloof', 'garsfontein', 
    'faerie-glen', 'moreleta-park', 'montana', 'wonderboom', 
    'pretoria-north', 'annlin', 'constantia-park', 'eldoraigne', 
    'heuwelsig', 'groenkloof', 'erasmuskloof', 'elarduspark', 
    'irene', 'silver-lakes', 'woodhill', 'mooikloof'
  ];

  const pretoriaSuburbEntries: MetadataRoute.Sitemap = pretoriaSuburbs.map((suburb) => ({
    url: `${baseUrl}/location/pretoria/${suburb}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  // Durban suburb pages
  const durbanSuburbs = [
    'umhlanga', 'ballito', 'la-lucia', 'durban-north', 'umdloti', 
    'morningside', 'berea', 'musgrave', 'greyville', 'windermere', 
    'westville', 'hillcrest', 'kloof', 'pinetown', 'queensburgh', 
    'bluff', 'wentworth', 'montclair', 'chatsworth', 'amanzimtoti', 
    'umkomaas', 'warner-beach', 'glenwood', 'sherwood', 'durban-cbd'
  ];

  const durbanSuburbEntries: MetadataRoute.Sitemap = durbanSuburbs.map((suburb) => ({
    url: `${baseUrl}/location/durban/${suburb}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

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
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/location/johannesburg`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
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
    // Add all service pages
    ...serviceEntries,
    // Add all Cape Town area hub pages
    ...capeTownAreaEntries,
    // Add all Johannesburg area hub pages
    ...johannesburgAreaEntries,
    // Add all blog posts
    ...blogEntries,
    // Add all Cape Town suburb pages
    ...capeTownEntries,
    // Add all Johannesburg suburb pages
    ...johannesburgSuburbEntries,
    // Add all Pretoria suburb pages
    ...pretoriaSuburbEntries,
    // Add all Durban suburb pages
    ...durbanSuburbEntries,
  ]
}

