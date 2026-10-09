import type { MetadataRoute } from 'next';
import { publicEnv } from '@/lib/env';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/account', '/cart', '/checkout', '/login', '/register'] }],
    sitemap: `${publicEnv.siteUrl}/sitemap.xml`,
  };
}
