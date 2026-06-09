import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  return [
    '/',
    '/archive',
    '/archive?section=ARTICLE',
    '/archive?section=TV_STORY',
    '/archive?section=EVENT_PHOTO',
    '/archive?materialTypes=UMKD',
    '/categories',
    '/login'
  ].map((path) => ({
    url: `${base}${path}`,
    changeFrequency: 'daily',
    priority: path === '/' ? 1 : 0.7
  }));
}
