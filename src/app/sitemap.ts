import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://runbits.io', lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: 'https://runbits.io/login', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: 'https://runbits.io/store', lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: 'https://runbits.io/privacy', lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: 'https://runbits.io/terms', lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ]
}
